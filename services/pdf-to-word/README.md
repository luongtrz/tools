# Self-hosted PDF → editable Word

This service implements the free, local conversion pipeline used by toolmd:

```text
PDF → Pix2Text → Markdown/LaTeX → Pandoc → DOCX/OMML
```

It does not call Mathpix, an LLM API, or any paid cloud service. Pix2Text's
free base models run locally and Pandoc converts TeX math delimiters to Word's
native OMML representation. Chemical diagrams and other figures remain image
fallbacks when they do not have a safe editable representation.

## Run locally

From this directory:

```bash
docker compose up --build
```

The first conversion downloads the free base model files and can take several
minutes. They are kept in Docker volumes for later conversions. The service
listens on `http://localhost:8080`:

```bash
curl -F file=@document.pdf http://localhost:8080/v1/pdf-to-word -o document.docx
```

Set the frontend endpoint before building toolmd:

```bash
VITE_PDF_TO_WORD_URL=http://localhost:8080/v1/pdf-to-word npm run dev
```

Without this endpoint, the frontend still creates an editable DOCX from a PDF
text layer in the browser. This service is needed for scanned PDFs and OCR
formulas; visual image export remains available as an explicit fidelity mode.

For a public deployment, set `CORS_ORIGINS` to the exact frontend origins and
put the service behind HTTPS. Do not expose a development service directly to
the internet.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins |
| `MAX_FILE_BYTES` | `26214400` | Maximum upload size |
| `MAX_PAGES` | `100` | Maximum PDF page count |
| `P2T_DEVICE` | `cpu` | Pix2Text device (`cpu`, `cuda`, or `gpu`) |

The application is MIT-licensed code in this repository. Review the upstream
licenses for Pix2Text, its bundled base models, Pandoc, and their transitive
dependencies before redistributing a production image.
