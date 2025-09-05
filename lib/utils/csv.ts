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

/**
 * Dedupe considering multiple phone fields (e.g., primary + alt).
 * Keeps the first occurrence of any normalized phone across provided fields.
 */
export function dedupeByPhones(
  rows: Array<Record<string, string>>,
  phoneFields: string[],
  normalize: (p?: string | null) => string | null
) {
  const seen = new Set<string>()
  const out: Array<Record<string, string>> = []
  for (const r of rows) {
    const keys: string[] = []
    for (const f of phoneFields) {
      const n = normalize(r[f])
      if (n) keys.push(n)
    }
    if (keys.length === 0) continue
    if (keys.some(k => seen.has(k))) continue
    keys.forEach(k => seen.add(k))
    out.push(r)
  }
  return out
}
