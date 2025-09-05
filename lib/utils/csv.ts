import Papa from 'papaparse'

export type ParsedCsv = {
  header: string[]
  rows: string[][]
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  })
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || 'Failed to parse CSV')
  }
  const data = result.data as string[][]
  if (!data.length) return { header: [], rows: [] }
  const [header, ...rows] = data
  return { header, rows }
}

export function dedupeByNormalizedPhone(
  rows: Array<Record<string, string>>, 
  phoneField: string,
  normalize: (p?: string | null) => string | null
) {
  const seen = new Set<string>()
  const out: Array<Record<string, string>> = []
  for (const r of rows) {
    const norm = normalize(r[phoneField])
    if (!norm) continue
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(r)
  }
  return out
}

