import { localizedTool, type Language } from "../i18n.tsx";
import type { ToolDefinition } from "../toolRegistry.ts";

export interface ToolSeoContent {
  pageTitle: string;
  h1: string;
  description: string;
  intro: string;
  steps: string[];
  benefits: string[];
  limitation: string;
  keywords: string[];
  relatedSlugs: string[];
}

type LocalizedSeoContent = Record<Language, Omit<ToolSeoContent, "keywords" | "relatedSlugs">>;

const CUSTOM_CONTENT: Record<string, LocalizedSeoContent> = {
  "pdf-to-word": {
    vi: {
      pageTitle: "Chuyển PDF sang Word online — DOCX chỉnh sửa được | toolmd",
      h1: "Chuyển PDF sang Word online",
      description:
        "Chuyển PDF sang Word (DOCX) online miễn phí. Text vẫn chỉnh sửa được, ảnh PDF được giữ lại và file được xử lý ngay trong trình duyệt.",
      intro:
        "Toolmd chuyển PDF có text layer thành file Word DOCX có thể chỉnh sửa. Nội dung text được giữ dưới dạng chữ thật, còn ảnh, QR và hình minh họa được nhúng riêng theo thứ tự đọc.",
      steps: [
        "Chọn hoặc kéo thả file PDF vào công cụ.",
        "Chọn chế độ DOCX chỉnh sửa được.",
        "Chờ trình duyệt trích xuất text và ảnh từ từng trang PDF.",
        "Tải file DOCX và mở bằng Microsoft Word, Google Docs hoặc LibreOffice.",
      ],
      benefits: [
        "Chữ trong PDF có text layer được chuyển thành text Word có thể sửa.",
        "Ảnh, QR và hình minh họa được nhúng vào DOCX thay vì bị mất.",
        "File được xử lý cục bộ trong trình duyệt, không cần đăng ký hay upload lên server.",
        "Có chế độ giữ nguyên hiển thị dạng ảnh khi cần giống PDF tuyệt đối.",
      ],
      limitation:
        "PDF scan, chữ nằm trong ảnh, bảng nhiều cột và công thức dạng đồ họa có thể cần OCR hoặc chỉnh lại trong Word. Với các trường hợp đó, hãy dùng Pix2Text local hoặc chế độ giữ nguyên hiển thị.",
    },
    en: {
      pageTitle: "Convert PDF to Word online — editable DOCX | toolmd",
      h1: "Convert PDF to Word online",
      description:
        "Convert PDF to editable Word (DOCX) online for free. Text stays editable, PDF images are preserved, and files remain in your browser.",
      intro:
        "Toolmd converts text-based PDFs into editable Word DOCX files. PDF text becomes real Word text, while images, QR codes and illustrations are embedded separately in reading order.",
      steps: [
        "Choose a PDF file or drag it into the converter.",
        "Select the editable DOCX output mode.",
        "Let the browser extract text and images from each PDF page.",
        "Download the DOCX and open it in Microsoft Word, Google Docs or LibreOffice.",
      ],
      benefits: [
        "Selectable PDF text becomes editable Word text.",
        "Images, QR codes and illustrations are embedded instead of being dropped.",
        "Files are processed locally in the browser with no account or server upload.",
        "A visual mode is available when matching the original PDF appearance matters most.",
      ],
      limitation:
        "Scanned PDFs, text inside images, multi-column tables and graphic formulas may need OCR or cleanup in Word. Use the self-hosted Pix2Text service or visual mode for those cases.",
    },
  },
};

function genericContent(
  tool: ToolDefinition,
  language: Language,
): Omit<ToolSeoContent, "keywords" | "relatedSlugs"> {
  const localized = localizedTool(tool, language);
  const isVi = language === "vi";
  return {
    pageTitle: isVi
      ? `${localized.title} online miễn phí — toolmd`
      : `${localized.title} — free online tool | toolmd`,
    h1: localized.title,
    description: isVi
      ? `${localized.description} Chạy trực tiếp trong trình duyệt, miễn phí, không cần đăng ký.`
      : `${localized.description} Runs directly in your browser, free, private and without sign-up.`,
    intro: isVi
      ? `${localized.description} Công cụ xử lý dữ liệu ngay trên thiết bị của bạn, phù hợp cho công việc hằng ngày.`
      : `${localized.description} Process your work directly on your device with a fast, browser-based tool.`,
    steps: isVi
      ? [
          "Mở công cụ và nhập nội dung hoặc chọn file cần xử lý.",
          "Chọn tùy chọn đầu ra phù hợp với nhu cầu.",
          "Kiểm tra kết quả ngay trên trang.",
          "Sao chép hoặc tải kết quả xuống thiết bị.",
        ]
      : [
          "Open the tool and enter content or choose a file.",
          "Choose the output options that match your task.",
          "Review the result directly on the page.",
          "Copy or download the result to your device.",
        ],
    benefits: isVi
      ? [
          "Chạy trực tiếp trong trình duyệt hiện đại.",
          "Không cần tài khoản, cài đặt hoặc upload dữ liệu lên server.",
          "Có thể sao chép và tải kết quả xuống ngay.",
        ]
      : [
          "Runs directly in a modern browser.",
          "No account, installation or server upload required.",
          "Copy and download the result immediately.",
        ],
    limitation: isVi
      ? "Kết quả phụ thuộc vào định dạng dữ liệu đầu vào và trình duyệt bạn đang sử dụng."
      : "Results depend on the input format and the browser you are using.",
  };
}

export function getToolSeoContent(
  tool: ToolDefinition,
  language: Language,
): ToolSeoContent {
  const custom = CUSTOM_CONTENT[tool.slug]?.[language];
  const content = custom ?? genericContent(tool, language);
  const localized = localizedTool(tool, language);
  const keywords = new Set([
    tool.slug,
    localized.title.toLowerCase(),
    tool.category.toLowerCase(),
  ]);
  if (tool.slug === "pdf-to-word") {
    [
      "pdf to word",
      "pdf to docx",
      "convert pdf to word",
      "editable pdf to word",
      "chuyển pdf sang word",
      "pdf sang docx",
    ].forEach((keyword) => keywords.add(keyword));
  }
  return {
    ...content,
    keywords: [...keywords],
    relatedSlugs: relatedTools(tool.slug),
  };
}

function relatedTools(slug: string): string[] {
  if (slug === "pdf-to-word") {
    return ["pdf-to-image", "merge-pdf", "split-pdf", "compress-pdf"];
  }
  return [];
}
