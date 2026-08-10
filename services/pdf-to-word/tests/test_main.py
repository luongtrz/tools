from app.main import content_disposition, pandoc_command, safe_stem


def test_safe_stem_keeps_unicode_and_removes_path_characters() -> None:
    assert safe_stem("kiểm-tra:π.pdf") == "kiểm-tra-π"
    assert safe_stem("...pdf") == "document"


def test_content_disposition_supports_unicode_filename() -> None:
    header = content_disposition("kiểm-tra-π.docx")
    assert "attachment" in header
    assert "filename*=UTF-8''ki%E1%BB%83m-tra-%CF%80.docx" in header


def test_pandoc_command_uses_docx_and_tex_math() -> None:
    command = pandoc_command("input.md", "output.docx")
    assert command[0] == "pandoc"
    assert "--to=docx" in command
    assert "tex_math_dollars" in command[2]
    assert command[-1] == "--output=output.docx"
