from __future__ import annotations

import asyncio
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import quote

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

MAX_FILE_BYTES = int(os.getenv("MAX_FILE_BYTES", str(25 * 1024 * 1024)))
MAX_PAGES = int(os.getenv("MAX_PAGES", "100"))
P2T_DEVICE = os.getenv("P2T_DEVICE", "cpu")
DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
PDF_SIGNATURE = b"%PDF-"
SAFE_NAME = re.compile(r"[^\w.-]+", re.UNICODE)

_converter: Any | None = None
_converter_lock = asyncio.Lock()
_conversion_lock = asyncio.Lock()


def _cors_origins() -> list[str]:
    value = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in value.split(",") if origin.strip()]


app = FastAPI(
    title="toolmd PDF to Word",
    description="Local Pix2Text and Pandoc PDF to editable DOCX conversion.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def safe_stem(filename: str | None) -> str:
    stem = Path(filename or "document.pdf").stem.strip()
    stem = SAFE_NAME.sub("-", stem).strip(".-_")
    return (stem or "document")[:120]


def content_disposition(filename: str) -> str:
    ascii_name = filename.encode("ascii", "ignore").decode("ascii") or "document.docx"
    encoded_name = quote(filename, safe="")
    return f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'


def pandoc_command(markdown_name: str, output_name: str) -> list[str]:
    return [
        "pandoc",
        markdown_name,
        "--from=markdown+tex_math_dollars+tex_math_single_backslash",
        "--to=docx",
        "--standalone",
        f"--output={output_name}",
    ]


def _load_converter() -> Any:
    global _converter
    if _converter is None:
        from pix2text import Pix2Text

        _converter = Pix2Text.from_config(
            enable_formula=True,
            enable_table=True,
            device=P2T_DEVICE,
        )
    return _converter


async def _get_converter() -> Any:
    global _converter
    if _converter is None:
        async with _converter_lock:
            if _converter is None:
                _converter = await asyncio.to_thread(_load_converter)
    return _converter


async def _save_upload(file: UploadFile, destination: Path) -> int:
    total = 0
    with destination.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > MAX_FILE_BYTES:
                raise HTTPException(status_code=413, detail="PDF file is too large")
            output.write(chunk)
    return total


def _validate_pdf(path: Path) -> int:
    with path.open("rb") as source:
        if source.read(len(PDF_SIGNATURE)) != PDF_SIGNATURE:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a PDF",
            )

    try:
        document = fitz.open(path)
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="The PDF could not be read",
        ) from error

    try:
        page_count = document.page_count
    finally:
        document.close()

    if page_count == 0:
        raise HTTPException(status_code=400, detail="The PDF has no pages")
    if page_count > MAX_PAGES:
        raise HTTPException(
            status_code=413,
            detail=f"The PDF has too many pages (maximum {MAX_PAGES})",
        )
    return page_count


def _find_markdown(output_dir: Path, result: Any) -> Path:
    markdown_files = sorted(output_dir.rglob("*.md"))
    if markdown_files:
        return markdown_files[0]

    if isinstance(result, (str, Path)):
        candidate = Path(result)
        if candidate.is_file() and candidate.suffix.lower() == ".md":
            return candidate

    raise RuntimeError("Pix2Text did not produce a Markdown file")


def _convert(pdf_path: Path, output_dir: Path, output_name: str) -> Path:
    converter = _load_converter()
    document = converter.recognize_pdf(pdf_path)
    markdown_result = document.to_markdown(str(output_dir))
    markdown_path = _find_markdown(output_dir, markdown_result)

    output_path = output_dir / output_name
    command = pandoc_command(markdown_path.name, output_path.name)
    try:
        completed = subprocess.run(
            command,
            cwd=output_dir,
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except FileNotFoundError as error:
        raise RuntimeError(
            "Pandoc is not installed in the conversion service"
        ) from error
    except subprocess.TimeoutExpired as error:
        raise RuntimeError("Pandoc timed out while creating the DOCX") from error

    if completed.returncode != 0:
        detail = completed.stderr.strip() or "Pandoc failed to create the DOCX"
        raise RuntimeError(detail[-2000:])
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise RuntimeError("Pandoc produced an empty DOCX")
    return output_path


async def _convert_request(pdf_path: Path, output_dir: Path, output_name: str) -> Path:
    async with _conversion_lock:
        return await asyncio.to_thread(_convert, pdf_path, output_dir, output_name)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "engine": "pix2text-pandoc"}


@app.post("/v1/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)) -> Response:
    if file.content_type not in {None, "application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Only PDF files are supported")

    source_name = safe_stem(file.filename)
    output_name = f"{source_name}.docx"

    with tempfile.TemporaryDirectory(prefix="toolmd-pdf-to-word-") as temporary_dir:
        work_dir = Path(temporary_dir)
        pdf_path = work_dir / "input.pdf"
        await _save_upload(file, pdf_path)
        _validate_pdf(pdf_path)
        try:
            await _get_converter()
            output_path = await _convert_request(pdf_path, work_dir, output_name)
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(
                status_code=422,
                detail=f"PDF conversion failed: {error}",
            ) from error

        return Response(
            content=output_path.read_bytes(),
            media_type=DOCX_MEDIA_TYPE,
            headers={"Content-Disposition": content_disposition(output_name)},
        )
