export interface QrPreset {
  id: string;
  label: string;
  toString: () => string;
}

function escape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;");
}

function join(type: string, pairs: [string, string][]): string {
  return [type, ...pairs.map(([k, v]) => `${k}:${escape(v)}`)]
    .filter(Boolean)
    .join(";");
}

export const QR_PRESETS: QrPreset[] = [
  {
    id: "wifi",
    label: "Wi-Fi",
    toString: () =>
      join("WIFI", [
        ["S", "MyNetwork"],
        ["T", "WPA"],
        ["P", "supersecret123"],
        ["H", "true"],
      ]),
  },
  {
    id: "email",
    label: "Email",
    toString: () =>
      join("MATMSG", [
        ["TO", "hello@example.com"],
        ["SUB", "Hello"],
        ["BODY", "Just saying hi from toolmd"],
      ]),
  },
  {
    id: "phone",
    label: "Phone",
    toString: () => "tel:+15551234567",
  },
  {
    id: "sms",
    label: "SMS",
    toString: () =>
      join("SMSTO", [
        ["", "+15551234567"],
        [":", "Hi there!"],
      ]),
  },
  {
    id: "vcard",
    label: "vCard",
    toString: () =>
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "FN:Jane Doe",
        "ORG:toolmd",
        "TITLE:Engineer",
        "EMAIL;TYPE=INTERNET:jane@example.com",
        "URL:https://toolmd.pages.dev",
        "END:VCARD",
      ].join("\n"),
  },
];
