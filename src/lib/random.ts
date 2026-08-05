export function randomString(length: number, alphabet: string): string {
  if (!alphabet.length || length <= 0) return "";
  const result: string[] = [];
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % alphabet.length);

  while (result.length < length) {
    const bytes = new Uint32Array(Math.max(16, length - result.length));
    crypto.getRandomValues(bytes);
    bytes.forEach((byte) => {
      if (byte < limit && result.length < length) {
        result.push(alphabet[byte % alphabet.length]);
      }
    });
  }
  return result.join("");
}
