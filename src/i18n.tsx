import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToolDefinition, ToolCategory } from "./toolRegistry";

export type Language = "vi" | "en";

const LANGUAGE_STORAGE_KEY = "toolmd-language";

const messages = {
  vi: {
    home: "Trang chủ",
    mcp: "MCP",
    toolCategories: "Danh mục công cụ",
    viewAll: "Xem tất cả {category}",
    toolsCount: "{count} công cụ",
    runsInBrowser: "Chạy trong trình duyệt",
    allTools: "Tất cả công cụ",
    changeLanguage: "Chuyển sang tiếng Anh",
    footerDescription: "một bộ sưu tập nhỏ các công cụ hữu ích",
    footerBuilt: "Được xây dựng cho công việc tập trung",
    backAllTools: "← Tất cả công cụ",
    searchTools: "Tìm công cụ theo tên hoặc mục đích…",
    searchToolsLabel: "Tìm kiếm công cụ",
    resultsCount: "{count} kết quả",
    clearFilter: "Xóa bộ lọc",
    heroEyebrow: "MỘT BỘ CÔNG CỤ TẬP TRUNG",
    heroTitleLead: "Công cụ hữu ích,",
    heroTitleAccent: "không rối mắt.",
    heroDescription:
      "Các tiện ích Markdown, tài liệu và developer chạy ngay trong trình duyệt. Chọn một việc, hoàn thành rồi tiếp tục.",
    curatedTools: "công cụ được chọn lọc",
    andGrowing: "và đang phát triển",
    startHere: "BẮT ĐẦU TỪ ĐÂY",
    mostUsefulFirst: "Những công cụ hữu ích nhất",
    everydayWork: "Cho công việc hằng ngày",
    makeDataReadable: "Làm dữ liệu dễ đọc",
    shapeYourText: "Định hình văn bản",
    noToolsMatched: "Không có công cụ khớp với “{query}”. Hãy thử từ khóa ngắn hơn.",
    markdownWorkspace: "KHÔNG GIAN TÀI LIỆU",
    markdownReady: "Markdown,",
    readyToPrint: "sẵn sàng để in.",
    markdownDescription: "Biến ghi chú và tài liệu của bạn thành PDF sạch đẹp trong vài giây.",
    liveWorkspace: "KHÔNG GIAN TRỰC TUYẾN",
    localWorkspace: "KHÔNG GIAN CỤC BỘ",
    collaborating: "Đang cộng tác",
    synced: "Đã đồng bộ",
    markdownEditorPreview: "Trình soạn Markdown và bản xem trước",
    md2pdfWorkspace: "không gian md2pdf",
    focusedWriting: "Được tạo cho việc viết tập trung",
    restoreSample: "Khôi phục nội dung mẫu",
    workspace: "Không gian làm việc",
    liveRoom: "Phòng live",
    onlinePeople: "{count} người đang online",
    localMarkdown: "Tài liệu Markdown · Cục bộ",
    renameFile: "Đổi tên file",
    liveStatus: "Live · {count} online",
    connecting: "Đang kết nối…",
    offlineRetrying: "Ngoại tuyến · đang thử lại",
    connectionFailed: "Kết nối thất bại",
    localDraft: "Bản nháp cục bộ",
    shareLive: "Chia sẻ live",
    autoSave: "Tự động lưu",
    downloadMarkdown: "Tải .md",
    exportPdf: "Xuất PDF",
    markdownPane: "MARKDOWN",
    previewPane: "Bản xem trước",
    markdownInput: "Nội dung Markdown",
    word: "từ",
    words: "từ",
    characters: "ký tự",
    livePreview: "XEM TRƯỚC TRỰC TUYẾN",
    zoomOut: "Thu nhỏ bản xem trước",
    zoomIn: "Phóng to bản xem trước",
    realtimeUpdate: "Cập nhật theo thời gian thực",
    page: "trang",
    pages: "trang",
    outputSettings: "THIẾT LẬP ĐẦU RA",
    pdfOutput: "Đầu ra PDF",
    pageSize: "Khổ giấy",
    orientation: "Chiều giấy",
    margins: "Lề",
    fileName: "Tên file",
    standard: "Tiêu chuẩn",
    narrow: "Hẹp",
    wide: "Rộng",
    copy: "Copy",
    quickTip: "MẸO NHANH",
    designedFor: "Được thiết kế cho",
    cleanExports: "bản xuất sạch đẹp.",
    quickTipDescription:
      "Hỗ trợ headings, lists, links, code blocks và blockquotes. PDF được render bằng engine tương thích wkhtmltopdf.",
    viewWkhtmltopdfDocs: "Xem tài liệu wkhtmltopdf",
    liveCollaboration: "CỘNG TÁC TRỰC TUYẾN",
    shareWorkspace: "Chia sẻ",
    workspaceAccent: "không gian này.",
    shareDescription: "Mời mọi người cùng chỉnh sửa Markdown theo thời gian thực. Ai có link đều có thể tham gia phòng này.",
    yourName: "Tên của bạn",
    guestWriter: "Người viết khách",
    roomLink: "Link phòng cộng tác",
    copyLink: "Copy link",
    done: "Xong",
    roomCode: "Mã phòng",
    syncedViaCloudflare: "Đồng bộ qua Cloudflare WebSocket",
    onlyYou: "Chỉ bạn",
    roomReady: "Phòng đã sẵn sàng",
    copyAgentGuide: "Copy hướng dẫn agent",
    copyConfig: "Copy config",
    copyInstruction: "Copy hướng dẫn cho agent",
    copyInstructionDescription: "Dán nguyên block này vào agent. Agent sẽ tự setup command, test MCP và biết khi nào nên gọi toolmd.",
    connectAiHost: "Kết nối AI host",
    connectAiHostDescription: "Toolmd MCP chạy local qua stdio. Dán cấu hình này vào MCP client như Claude Desktop, Cursor hoặc host hỗ trợ MCP rồi thay đường dẫn project thật.",
    note: "Lưu ý:",
    browserCannotSpawn: "trình duyệt không thể tự spawn process stdio. Việc kết nối phải do AI host chạy MCP server, còn trang này là nơi hướng dẫn và tạo prompt test.",
    installCommand: "Cài command một lần trong repository:",
    mcpHostCanCall: "Sau đó MCP host có thể gọi trực tiếp",
    testFromTerminal: "Test từ terminal",
    smokeTestDescription: "Smoke test dùng MCP client thật, kiểm tra discovery và gọi nhiều tool.",
    available: "có sẵn",
    notRequired: "Không yêu cầu",
    tryNow: "Prompt mẫu để thử ngay",
    tryNowDescription: "Sau khi host đã kết nối MCP server, gửi một trong các prompt dưới đây cho AI.",
    callableTools: "Tool AI có thể gọi",
    callableToolsDescription: "Các tool trả về JSON có cấu trúc để AI có thể đọc, tóm tắt hoặc chuyển tiếp sang bước tiếp theo.",
    aiIntegration: "TÍCH HỢP AI",
  },
  en: {
    home: "Home",
    mcp: "MCP",
    toolCategories: "Tool categories",
    viewAll: "View all {category}",
    toolsCount: "{count} tools",
    runsInBrowser: "Runs in your browser",
    allTools: "All tools",
    changeLanguage: "Chuyển sang tiếng Việt",
    footerDescription: "a small collection of useful tools",
    footerBuilt: "Built for focused work",
    backAllTools: "← All tools",
    searchTools: "Search tools by name or purpose…",
    searchToolsLabel: "Search tools",
    resultsCount: "{count} results",
    clearFilter: "Clear filter",
    heroEyebrow: "A SMALL, FOCUSED TOOLBOX",
    heroTitleLead: "Useful tools,",
    heroTitleAccent: "without the noise.",
    heroDescription:
      "Markdown, document and developer utilities that run in your browser. Pick one thing, finish it, move on.",
    curatedTools: "curated tools",
    andGrowing: "and growing",
    startHere: "START HERE",
    mostUsefulFirst: "Most useful first",
    everydayWork: "For everyday work",
    makeDataReadable: "Make data readable",
    shapeYourText: "Shape your text",
    noToolsMatched: "No tools matched “{query}”. Try a shorter search.",
    markdownWorkspace: "DOCUMENT WORKSPACE",
    markdownReady: "Markdown,",
    readyToPrint: "ready to print.",
    markdownDescription: "Turn your notes and documents into clean PDFs in seconds.",
    liveWorkspace: "LIVE WORKSPACE",
    localWorkspace: "LOCAL WORKSPACE",
    collaborating: "Collaborating",
    synced: "Synced",
    markdownEditorPreview: "Markdown editor and preview",
    md2pdfWorkspace: "md2pdf workspace",
    focusedWriting: "Made for focused writing",
    restoreSample: "Restore sample content",
    workspace: "Workspace",
    liveRoom: "Live room",
    onlinePeople: "{count} people online",
    localMarkdown: "Markdown document · Local",
    renameFile: "Rename file",
    liveStatus: "Live · {count} online",
    connecting: "Connecting…",
    offlineRetrying: "Offline · retrying",
    connectionFailed: "Connection failed",
    localDraft: "Local draft",
    shareLive: "Share live",
    autoSave: "Auto-save",
    downloadMarkdown: "Download .md",
    exportPdf: "Export PDF",
    markdownPane: "MARKDOWN",
    previewPane: "Preview",
    markdownInput: "Markdown input",
    word: "word",
    words: "words",
    characters: "characters",
    livePreview: "LIVE PREVIEW",
    zoomOut: "Zoom out preview",
    zoomIn: "Zoom in preview",
    realtimeUpdate: "Updating in real time",
    page: "page",
    pages: "pages",
    outputSettings: "OUTPUT SETTINGS",
    pdfOutput: "PDF output",
    pageSize: "Page size",
    orientation: "Orientation",
    margins: "Margins",
    fileName: "File name",
    standard: "Standard",
    narrow: "Narrow",
    wide: "Wide",
    copy: "Copy",
    quickTip: "QUICK TIP",
    designedFor: "Designed for",
    cleanExports: "clean exports.",
    quickTipDescription: "Supports headings, lists, links, code blocks and blockquotes. PDFs are rendered by a wkhtmltopdf-compatible engine.",
    viewWkhtmltopdfDocs: "View wkhtmltopdf docs",
    liveCollaboration: "LIVE COLLABORATION",
    shareWorkspace: "Share this",
    workspaceAccent: "workspace.",
    shareDescription: "Invite people to edit Markdown in real time. Anyone with the link can join this room.",
    yourName: "Your name",
    guestWriter: "Guest writer",
    roomLink: "Collaboration room link",
    copyLink: "Copy link",
    done: "Done",
    roomCode: "Room code",
    syncedViaCloudflare: "Synced via Cloudflare WebSocket",
    onlyYou: "Only you",
    roomReady: "Room ready",
    copyAgentGuide: "Copy agent guide",
    copyConfig: "Copy config",
    copyInstruction: "Copy instruction for your agent",
    copyInstructionDescription: "Paste this block into your agent. It will set up the command, test MCP and know when to call toolmd.",
    connectAiHost: "Connect an AI host",
    connectAiHostDescription: "Toolmd MCP runs locally over stdio. Paste this config into an MCP client such as Claude Desktop, Cursor or another MCP host, then use the real project path.",
    note: "Note:",
    browserCannotSpawn: "browsers cannot spawn stdio processes themselves. The AI host must run the MCP server; this page provides the setup guide and test prompts.",
    installCommand: "Install the command once in the repository:",
    mcpHostCanCall: "Then the MCP host can call",
    testFromTerminal: "Test from terminal",
    smokeTestDescription: "Uses a real MCP client to verify discovery and call multiple tools.",
    available: "available",
    notRequired: "Not required",
    tryNow: "Prompts to try now",
    tryNowDescription: "After the host connects to the MCP server, send one of these prompts to the AI.",
    callableTools: "Callable AI tools",
    callableToolsDescription: "The tools return structured JSON that AI can read, summarize or pass to the next step.",
    aiIntegration: "AI INTEGRATION",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

const categoryTranslations: Record<ToolCategory, { vi: string; en: string }> = {
  Document: { vi: "Tài liệu", en: "Document" },
  Markdown: { vi: "Markdown", en: "Markdown" },
  "Developer data": { vi: "Dữ liệu developer", en: "Developer data" },
  "Text utility": { vi: "Tiện ích văn bản", en: "Text utility" },
  "Quick tools": { vi: "Công cụ nhanh", en: "Quick tools" },
  Integration: { vi: "Tích hợp", en: "Integration" },
};

const toolTranslations: Record<
  string,
  { title: { vi: string; en: string }; description: { vi: string; en: string } }
> = {
  md2pdf: {
    title: { vi: "Markdown → PDF", en: "Markdown → PDF" },
    description: { vi: "Soạn Markdown, xem preview và in thành PDF sạch đẹp.", en: "Write Markdown, preview it and print a clean PDF." },
  },
  md2word: {
    title: { vi: "Markdown → Word", en: "Markdown → Word" },
    description: { vi: "Xuất Markdown thành tài liệu Word có thể chỉnh sửa.", en: "Export Markdown as an editable Word document." },
  },
  md2pptx: {
    title: { vi: "Markdown → PowerPoint", en: "Markdown → PowerPoint" },
    description: { vi: "Tách nội dung Markdown thành bộ slide PPTX.", en: "Turn Markdown sections into a PPTX slide deck." },
  },
  "merge-pdf": {
    title: { vi: "Gộp PDF", en: "Merge PDF" },
    description: { vi: "Gộp nhiều file PDF ngay trong trình duyệt.", en: "Merge multiple PDF files directly in your browser." },
  },
  "split-pdf": {
    title: { vi: "Tách PDF", en: "Split PDF" },
    description: { vi: "Tách các trang được chọn thành một file PDF mới.", en: "Extract selected pages into a new PDF file." },
  },
  "compress-pdf": {
    title: { vi: "Nén PDF", en: "Compress PDF" },
    description: { vi: "Tối ưu và giảm dung lượng PDF client-side.", en: "Optimize and reduce PDF size client-side." },
  },
  "markdown-editor": {
    title: { vi: "Trình soạn Markdown", en: "Markdown Editor" },
    description: { vi: "Editor Markdown tập trung với preview realtime.", en: "A focused Markdown editor with a live preview." },
  },
  "markdown-table-generator": {
    title: { vi: "Tạo bảng Markdown", en: "Markdown Table Generator" },
    description: { vi: "Tạo bảng Markdown từ số hàng và cột.", en: "Generate a Markdown table from rows and columns." },
  },
  "markdown-table-formatter": {
    title: { vi: "Định dạng bảng Markdown", en: "Markdown Table Formatter" },
    description: { vi: "Căn chỉnh bảng Markdown cho dễ đọc.", en: "Align Markdown tables for easier reading." },
  },
  "markdown-word-counter": {
    title: { vi: "Đếm từ Markdown", en: "Markdown Word Counter" },
    description: { vi: "Đếm từ, ký tự, dòng và thời gian đọc.", en: "Count words, characters, lines and reading time." },
  },
  "html-to-markdown": {
    title: { vi: "HTML → Markdown", en: "HTML → Markdown" },
    description: { vi: "Chuyển HTML cơ bản thành Markdown sạch.", en: "Convert basic HTML into clean Markdown." },
  },
  "json-formatter": {
    title: { vi: "Định dạng JSON", en: "JSON Formatter" },
    description: { vi: "Format, minify và kiểm tra JSON nhanh.", en: "Format, minify and inspect JSON quickly." },
  },
  "json-validator": {
    title: { vi: "Kiểm tra JSON", en: "JSON Validator" },
    description: { vi: "Xác thực JSON và hiển thị lỗi rõ ràng.", en: "Validate JSON and show readable errors." },
  },
  "json-diff": {
    title: { vi: "So sánh JSON", en: "JSON Diff" },
    description: { vi: "So sánh hai JSON và xem phần thay đổi.", en: "Compare two JSON values and inspect changes." },
  },
  "yaml-json": {
    title: { vi: "YAML ↔ JSON", en: "YAML ↔ JSON" },
    description: { vi: "Chuyển đổi qua lại giữa YAML và JSON.", en: "Convert between YAML and JSON." },
  },
  "csv-json": {
    title: { vi: "CSV ↔ JSON", en: "CSV ↔ JSON" },
    description: { vi: "Chuyển đổi dữ liệu bảng giữa CSV và JSON.", en: "Convert tabular data between CSV and JSON." },
  },
  "text-diff": {
    title: { vi: "So sánh văn bản", en: "Text Diff" },
    description: { vi: "So sánh hai đoạn text theo từng dòng.", en: "Compare two text blocks line by line." },
  },
  "regex-tester": {
    title: { vi: "Kiểm tra Regex", en: "Regex Tester" },
    description: { vi: "Test biểu thức chính quy và xem matches realtime.", en: "Test regular expressions and inspect matches live." },
  },
  base64: {
    title: { vi: "Mã hóa / giải mã Base64", en: "Base64 Encoder / Decoder" },
    description: { vi: "Encode hoặc decode Base64 hỗ trợ Unicode.", en: "Encode or decode Base64 with Unicode support." },
  },
  "case-converter": {
    title: { vi: "Đổi kiểu chữ", en: "Case Converter" },
    description: { vi: "Đổi chữ hoa, thường, title, camel, snake và kebab case.", en: "Convert upper, lower, title, camel, snake and kebab case." },
  },
  "slug-generator": {
    title: { vi: "Tạo Slug", en: "Slug Generator" },
    description: { vi: "Tạo URL slug không dấu từ tiêu đề.", en: "Create an accent-free URL slug from a title." },
  },
  "qr-generator": {
    title: { vi: "Tạo mã QR", en: "QR Code Generator" },
    description: { vi: "Tạo và tải QR code từ text hoặc URL.", en: "Create and download a QR code from text or a URL." },
  },
  "uuid-generator": {
    title: { vi: "Tạo UUID", en: "UUID Generator" },
    description: { vi: "Tạo một hoặc nhiều UUID v4 bằng crypto của browser.", en: "Generate one or more UUID v4 values with browser crypto." },
  },
  "password-generator": {
    title: { vi: "Tạo mật khẩu", en: "Password Generator" },
    description: { vi: "Tạo password ngẫu nhiên theo độ dài và bộ ký tự.", en: "Generate random passwords by length and character set." },
  },
  "color-picker": {
    title: { vi: "Chọn màu", en: "Color Picker" },
    description: { vi: "Chọn màu và xem HEX, RGB, HSL tương ứng.", en: "Pick a color and inspect its HEX, RGB and HSL values." },
  },
  mcp: {
    title: { vi: "MCP cho AI", en: "MCP for AI" },
    description: { vi: "Kết nối AI host với toolmd qua MCP và test bằng prompt mẫu.", en: "Connect an AI host to toolmd over MCP and test it with prompts." },
  },
};

type LiteralTranslation = { vi: string; en: string };

const literalTranslations: Record<string, LiteralTranslation> = {
  "JSON input": { vi: "Dữ liệu JSON", en: "JSON input" },
  "Validate JSON": { vi: "Xác thực JSON", en: "Validate JSON" },
  "Paste JSON and run it locally in your browser.": { vi: "Dán JSON và chạy ngay trong trình duyệt của bạn.", en: "Paste JSON and run it locally in your browser." },
  "Format JSON": { vi: "Định dạng JSON", en: "Format JSON" },
  "Check JSON": { vi: "Kiểm tra JSON", en: "Check JSON" },
  "JSON changes": { vi: "Thay đổi JSON", en: "JSON changes" },
  Result: { vi: "Kết quả", en: "Result" },
  "First JSON": { vi: "JSON thứ nhất", en: "First JSON" },
  "Second JSON": { vi: "JSON thứ hai", en: "Second JSON" },
  "Both inputs must be valid JSON before comparing.": { vi: "Cả hai dữ liệu phải là JSON hợp lệ trước khi so sánh.", en: "Both inputs must be valid JSON before comparing." },
  "Convert YAML and JSON": { vi: "Chuyển đổi YAML và JSON", en: "Convert YAML and JSON" },
  "YAML or JSON input": { vi: "Dữ liệu YAML hoặc JSON", en: "YAML or JSON input" },
  "Convert CSV and JSON": { vi: "Chuyển đổi CSV và JSON", en: "Convert CSV and JSON" },
  "CSV or JSON input": { vi: "Dữ liệu CSV hoặc JSON", en: "CSV or JSON input" },
  "Markdown input": { vi: "Dữ liệu Markdown", en: "Markdown input" },
  "Paste or write the content you want to export.": { vi: "Dán hoặc viết nội dung bạn muốn xuất.", en: "Paste or write the content you want to export." },
  "Word preview": { vi: "Xem trước Word", en: "Word preview" },
  "The exported .doc keeps this basic formatting.": { vi: "File .doc xuất ra sẽ giữ định dạng cơ bản này.", en: "The exported .doc keeps this basic formatting." },
  "Download .doc": { vi: "Tải .doc", en: "Download .doc" },
  "File name": { vi: "Tên file", en: "File name" },
  "Markdown editor": { vi: "Trình soạn Markdown", en: "Markdown editor" },
  "Write Markdown": { vi: "Viết Markdown", en: "Write Markdown" },
  "Live preview": { vi: "Xem trước trực tuyến", en: "Live preview" },
  "Table setup": { vi: "Thiết lập bảng", en: "Table setup" },
  "Separate column names with commas.": { vi: "Phân tách tên cột bằng dấu phẩy.", en: "Separate column names with commas." },
  "Table headers": { vi: "Tiêu đề cột", en: "Table headers" },
  "Generated Markdown": { vi: "Markdown đã tạo", en: "Generated Markdown" },
  "Unformatted table": { vi: "Bảng chưa định dạng", en: "Unformatted table" },
  "Markdown table input": { vi: "Dữ liệu bảng Markdown", en: "Markdown table input" },
  "Format table": { vi: "Định dạng bảng", en: "Format table" },
  "Markdown text": { vi: "Văn bản Markdown", en: "Markdown text" },
  "HTML input": { vi: "Dữ liệu HTML", en: "HTML input" },
  "Markdown result": { vi: "Markdown kết quả", en: "Markdown result" },
  Original: { vi: "Bản gốc", en: "Original" },
  Changed: { vi: "Bản đã sửa", en: "Changed" },
  "Original text": { vi: "Văn bản gốc", en: "Original text" },
  "Changed text": { vi: "Văn bản đã sửa", en: "Changed text" },
  "Diff result": { vi: "Kết quả so sánh", en: "Diff result" },
  "Regular expression": { vi: "Biểu thức chính quy", en: "Regular expression" },
  "Regex test text": { vi: "Văn bản test Regex", en: "Regex test text" },
  Matches: { vi: "Kết quả khớp", en: "Matches" },
  "Base64 converter": { vi: "Chuyển đổi Base64", en: "Base64 converter" },
  "Base64 input": { vi: "Dữ liệu Base64", en: "Base64 input" },
  "Convert text": { vi: "Chuyển đổi văn bản", en: "Convert text" },
  "Text case input": { vi: "Văn bản cần đổi kiểu", en: "Text case input" },
  "URL slug": { vi: "URL slug", en: "URL slug" },
  "Slug source text": { vi: "Tiêu đề nguồn", en: "Slug source text" },
  "Text or URL": { vi: "Văn bản hoặc URL", en: "Text or URL" },
  "QR content": { vi: "Nội dung QR", en: "QR content" },
  "QR preview": { vi: "Xem trước QR", en: "QR preview" },
  "Download PNG": { vi: "Tải PNG", en: "Download PNG" },
  "UUID v4 generator": { vi: "Tạo UUID v4", en: "UUID v4 generator" },
  "Generate UUIDs": { vi: "Tạo UUID", en: "Generate UUIDs" },
  "Secure password": { vi: "Mật khẩu an toàn", en: "Secure password" },
  "Generate password": { vi: "Tạo mật khẩu", en: "Generate password" },
  "Pick a color": { vi: "Chọn một màu", en: "Pick a color" },
  "Choose PDF file": { vi: "Chọn file PDF", en: "Choose PDF file" },
  "Choose PDF files": { vi: "Chọn các file PDF", en: "Choose PDF files" },
  "PDF files": { vi: "Các file PDF", en: "PDF files" },
  "Files stay in your browser and are never uploaded.": { vi: "File được giữ trong trình duyệt và không bao giờ được tải lên.", en: "Files stay in your browser and are never uploaded." },
  "Choose a PDF": { vi: "Chọn một file PDF", en: "Choose a PDF" },
  "Use page numbers like 1, 3-5, 8.": { vi: "Dùng số trang như 1, 3-5, 8.", en: "Use page numbers like 1, 3-5, 8." },
  "No file selected": { vi: "Chưa chọn file", en: "No file selected" },
  Pages: { vi: "Các trang", en: "Pages" },
  "Compress a PDF": { vi: "Nén một file PDF", en: "Compress a PDF" },
  "Download split PDF": { vi: "Tải PDF đã tách", en: "Download split PDF" },
  "Download optimized PDF": { vi: "Tải PDF đã tối ưu", en: "Download optimized PDF" },
  "Merging…": { vi: "Đang gộp…", en: "Merging…" },
  "Splitting…": { vi: "Đang tách…", en: "Splitting…" },
  "Optimizing…": { vi: "Đang tối ưu…", en: "Optimizing…" },
  "Building…": { vi: "Đang tạo…", en: "Building…" },
  "Download .pptx": { vi: "Tải .pptx", en: "Download .pptx" },
  "Markdown slides": { vi: "Slide Markdown", en: "Markdown slides" },
  "Separate slides with a line containing three dashes.": { vi: "Tách slide bằng một dòng chứa ba dấu gạch ngang.", en: "Separate slides with a line containing three dashes." },
  "Markdown slides input": { vi: "Dữ liệu slide Markdown", en: "Markdown slides input" },
};

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "vi";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "vi";
}

function interpolate(value: string, variables?: Record<string, string | number>): string {
  if (!variables) return value;
  return Object.entries(variables).reduce(
    (result, [key, replacement]) => result.split(`{${key}}`).join(String(replacement)),
    value,
  );
}

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: MessageKey, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "vi" ? "en" : "vi")),
      t: (key, variables) => interpolate(messages[language][key], variables),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function categoryLabel(category: ToolCategory, language: Language): string {
  return categoryTranslations[category][language];
}

export function localizedTool(tool: ToolDefinition, language: Language): ToolDefinition {
  const copy = toolTranslations[tool.slug];
  if (!copy) return tool;
  return {
    ...tool,
    title: copy.title[language],
    description: copy.description[language],
  };
}

export function literal(value: string | undefined, language: Language): string | undefined {
  if (!value) return value;
  return literalTranslations[value]?.[language] || value;
}
