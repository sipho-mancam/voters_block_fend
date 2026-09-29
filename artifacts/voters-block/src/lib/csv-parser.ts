export interface ParsedPlayer {
  name: string;
  jerseyNumber: number;
  teamName: string;
  metadata?: string;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted value");
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parsePlayerCsv(csvText: string): { data: ParsedPlayer[]; error?: string } {
  if (!csvText.trim()) return { data: [], error: "CSV file is empty" };
  let rows: string[][];
  try {
    rows = parseCsvRows(csvText);
  } catch (error) {
    return { data: [], error: (error as Error).message };
  }
  if (rows.length < 2) return { data: [], error: "CSV must contain a header row and at least one candidate" };

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").toLowerCase());
  const nameIdx = headers.indexOf("name");
  const numberIdx = headers.findIndex((header) => ["jerseynumber", "squadnumber", "number"].includes(header));
  const teamIdx = headers.findIndex((header) => ["teamname", "team"].includes(header));
  const metadataIdx = headers.findIndex((header) => ["metadata", "position"].includes(header));
  if (nameIdx < 0 || numberIdx < 0 || teamIdx < 0) {
    return { data: [], error: "CSV must include name, jerseyNumber, and teamName headers" };
  }

  const data: ParsedPlayer[] = [];
  for (let index = 1; index < rows.length; index++) {
    const values = rows[index];
    const name = values[nameIdx]?.trim();
    const teamName = values[teamIdx]?.trim();
    const jerseyText = values[numberIdx]?.trim();
    const jerseyNumber = Number(jerseyText);
    if (!name || !teamName || !/^\d+$/.test(jerseyText) || !Number.isSafeInteger(jerseyNumber)) {
      return { data: [], error: `Row ${index + 1} needs a name, teamName, and a non-negative integer jerseyNumber` };
    }
    data.push({
      name,
      jerseyNumber,
      teamName,
      metadata: metadataIdx < 0 ? undefined : values[metadataIdx]?.trim() || undefined,
    });
  }
  return { data };
}