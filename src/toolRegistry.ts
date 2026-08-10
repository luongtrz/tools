export type ToolCategory =
  | "Document"
  | "Markdown"
  | "Developer data"
  | "Text utility"
  | "Quick tools"
  | "Integration";

export interface ToolDefinition {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  featured?: boolean;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    slug: "md2pdf",
    title: "Markdown → PDF",
    description: "Soạn Markdown, xem preview và xuất PDF trực tiếp từ trình duyệt.",
    category: "Document",
    featured: true,
  },
  {
    slug: "md2word",
    title: "Markdown → Word",
    description: "Xuất Markdown thành DOC hoặc DOCX có thể chỉnh sửa.",
    category: "Document",
    featured: true,
  },
  {
    slug: "md2pptx",
    title: "Markdown → PowerPoint",
    description: "Tách nội dung Markdown thành bộ slide PPTX.",
    category: "Document",
    featured: true,
  },
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Gộp nhiều file PDF ngay trong trình duyệt.",
    category: "Document",
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Tách các trang được chọn thành một file PDF mới.",
    category: "Document",
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    description: "Tối ưu và giảm dung lượng PDF client-side.",
    category: "Document",
  },
  {
    slug: "pdf-to-image",
    title: "PDF → Image",
    description: "Tách từng trang PDF thành ảnh PNG hoặc JPG.",
    category: "Document",
  },
  {
    slug: "images-to-pdf",
    title: "Images → PDF",
    description: "Gộp nhiều ảnh thành PDF, mỗi ảnh là một trang.",
    category: "Document",
  },
  {
    slug: "markdown-editor",
    title: "Markdown Editor",
    description: "Editor Markdown tập trung với preview realtime.",
    category: "Markdown",
    featured: true,
  },
  {
    slug: "markdown-table-generator",
    title: "Markdown Table Generator",
    description: "Tạo bảng Markdown từ số hàng và cột.",
    category: "Markdown",
  },
  {
    slug: "markdown-table-formatter",
    title: "Markdown Table Formatter",
    description: "Căn chỉnh bảng Markdown cho dễ đọc.",
    category: "Markdown",
  },
  {
    slug: "markdown-word-counter",
    title: "Markdown Word Counter",
    description: "Đếm từ, ký tự, dòng và thời gian đọc.",
    category: "Markdown",
  },
  {
    slug: "html-to-markdown",
    title: "HTML → Markdown",
    description: "Chuyển HTML cơ bản thành Markdown sạch.",
    category: "Markdown",
  },
  {
    slug: "jwt-decoder",
    title: "JWT Decoder",
    description: "Decode JWT header and payload locally without verifying the signature.",
    category: "Developer data",
  },
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "Format, minify và kiểm tra JSON nhanh.",
    category: "Developer data",
    featured: true,
  },
  {
    slug: "json-validator",
    title: "JSON Validator",
    description: "Xác thực JSON và hiển thị lỗi rõ ràng.",
    category: "Developer data",
  },
  {
    slug: "json-diff",
    title: "JSON Diff",
    description: "So sánh hai JSON và xem phần thay đổi.",
    category: "Developer data",
  },
  {
    slug: "yaml-json",
    title: "YAML ↔ JSON",
    description: "Chuyển đổi qua lại giữa YAML và JSON.",
    category: "Developer data",
  },
  {
    slug: "csv-json",
    title: "CSV ↔ JSON",
    description: "Chuyển đổi dữ liệu bảng giữa CSV và JSON.",
    category: "Developer data",
  },
  {
    slug: "text-diff",
    title: "Text Diff",
    description: "So sánh hai đoạn text theo từng dòng.",
    category: "Text utility",
    featured: true,
  },
  {
    slug: "regex-tester",
    title: "Regex Tester",
    description: "Test biểu thức chính quy và xem matches realtime.",
    category: "Text utility",
  },
  {
    slug: "base64",
    title: "Base64 Encoder / Decoder",
    description: "Encode hoặc decode Base64 hỗ trợ Unicode.",
    category: "Text utility",
  },
  {
    slug: "case-converter",
    title: "Case Converter",
    description: "Đổi chữ hoa, thường, title, camel, snake và kebab case.",
    category: "Text utility",
  },
  {
    slug: "slug-generator",
    title: "Slug Generator",
    description: "Tạo URL slug không dấu từ tiêu đề.",
    category: "Text utility",
  },
  {
    slug: "url-codec",
    title: "URL Encode / Decode",
    description: "Encode or decode URL components privately in the browser.",
    category: "Text utility",
  },
  {
    slug: "qr-generator",
    title: "QR Code Generator",
    description: "Tạo và tải QR code từ text hoặc URL.",
    category: "Quick tools",
    featured: true,
  },
  {
    slug: "uuid-generator",
    title: "UUID Generator",
    description: "Tạo một hoặc nhiều UUID v4 bằng crypto của browser.",
    category: "Quick tools",
  },
  {
    slug: "password-generator",
    title: "Password Generator",
    description: "Tạo password ngẫu nhiên theo độ dài và bộ ký tự.",
    category: "Quick tools",
  },
  {
    slug: "color-picker",
    title: "Color Picker",
    description: "Chọn màu và xem HEX, RGB, HSL tương ứng.",
    category: "Quick tools",
  },
  {
    slug: "mcp",
    title: "MCP for AI",
    description: "Kết nối AI host với toolmd qua MCP và test bằng prompt mẫu.",
    category: "Integration",
  },
];

export function getTool(slug: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.slug === slug);
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  "Document",
  "Markdown",
  "Developer data",
  "Text utility",
  "Quick tools",
];
