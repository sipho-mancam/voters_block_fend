export interface ParsedPlayer {
  name: string;
  squadNumber: string;
  position?: string;
  team?: string;
}

export function parsePlayerCsv(csvText: string): { data: ParsedPlayer[]; error?: string } {
  if (!csvText.trim()) {
    return { data: [], error: "CSV file is empty" };
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { data: [], error: "CSV must contain a header row and at least one player row" };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const nameIdx = headers.indexOf('name');
  const numberIdx = headers.findIndex(h => h === 'number' || h === 'squadnumber');
  const posIdx = headers.indexOf('position');
  const teamIdx = headers.indexOf('team');

  if (nameIdx === -1 || numberIdx === -1) {
    return { data: [], error: "CSV must include 'name' and 'squadNumber' headers" };
  }

  const data: ParsedPlayer[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV split that ignores commas inside quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
    
    // In case the simple regex fails, fallback to simple split
    const finalValues = values.length >= headers.length ? values : lines[i].split(',').map(v => v.trim());

    const name = finalValues[nameIdx];
    const squadNumber = finalValues[numberIdx];

    if (!name || !squadNumber) {
      errors.push(`Row ${i + 1} is missing required fields (name, squadNumber)`);
      continue;
    }

    data.push({
      name,
      squadNumber,
      position: posIdx !== -1 ? finalValues[posIdx] : undefined,
      team: teamIdx !== -1 ? finalValues[teamIdx] : undefined,
    });
  }

  if (errors.length > 0 && data.length === 0) {
    return { data: [], error: errors[0] };
  }

  return { data, error: errors.length > 0 ? "Some rows were skipped due to missing data." : undefined };
}
