export const MAX_DOC_CHARS = 40000;
const CHUNK_SIZE = 1500;

export async function extractTextFromBuffer(buffer: Buffer, type: string): Promise<string> {
  const t = type.toLowerCase();

  if (t === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text as string;
  }

  if (t === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

export function truncateText(text: string, max = MAX_DOC_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n[truncated]";
}

export function chunkText(text: string, chunkSize = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks.filter((c) => c.trim().length > 0);
}

export function searchText(text: string, query: string, limit = 5): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return chunkText(text)
    .map((chunk) => ({
      chunk,
      score: terms.filter((term) => chunk.toLowerCase().includes(term)).length,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.chunk);
}
