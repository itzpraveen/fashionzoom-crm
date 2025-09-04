"use client"
import { useState } from 'react'
import { importLeads } from '@/actions/leads'
import { normalizePhone } from '@/lib/phone'

type Stage = 'upload'|'map'|'dedupe'|'assign'|'summary'

export function ImportWizard() {
  const [stage, setStage] = useState<Stage>('upload')
  const [rows, setRows] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string,string>>({})
  const [preview, setPreview] = useState<any[]>([])
  const [summary, setSummary] = useState<any | null>(null)

  const parse = async (file: File) => {
    const text = await file.text()
    const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const cols = header.split(',')
    const data = lines.map(l => {
      const vals = l.split(',')
      const obj: any = {}
      cols.forEach((c,i) => obj[c.trim()] = vals[i]?.trim())
      return obj
    })
    setRows(data)
    setStage('map')
  }

  const doMap = () => {
    const mapped = rows.map(r => ({
      full_name: r[mapping['full_name'] || 'name'] || '',
      primary_phone: r[mapping['primary_phone'] || 'phone'] || '',
      city: r[mapping['city'] || 'city'] || '',
      source: r[mapping['source'] || 'source'] || 'Other',
      primary_phone_norm: normalizePhone(r[mapping['primary_phone'] || 'phone'])
    }))
    // Dedupe by normalized phone
    const seen = new Set<string>()
    const deduped: any[] = []
    for (const m of mapped) {
      if (!m.primary_phone_norm) continue
      if (seen.has(m.primary_phone_norm)) continue
      seen.add(m.primary_phone_norm)
      deduped.push(m)
    }
    setPreview(deduped)
    setStage('dedupe')
  }

  const doImport = async () => {
    const res = await importLeads(preview)
    setSummary(res)
    setStage('summary')
  }

  return (
    <div className="space-y-4">
      {stage === 'upload' && (
        <div className="border rounded border-white/10 p-4">
          <p className="mb-2">Upload CSV with columns: name, phone, city, source</p>
          <input type="file" accept="text/csv" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) parse(f) }} />
        </div>
      )}
      {stage === 'map' && (
        <div className="space-y-2">
          <p className="text-sm">Map your file columns to fields</p>
          {['full_name','primary_phone','city','source'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <label className="w-32 text-sm">{f}</label>
              <input className="rounded bg-white/5 border border-white/10 px-2 py-1" placeholder={`Column for ${f}`} value={mapping[f] || ''} onChange={e=>setMapping({ ...mapping, [f]: e.target.value })} />
            </div>
          ))}
          <button className="rounded bg-primary text-white px-3 py-2" onClick={doMap}>Next: Dedupe</button>
        </div>
      )}
      {stage === 'dedupe' && (
        <div>
          <p className="mb-2 text-sm">Preview ({preview.length}) unique by normalized phone. Duplicates removed.</p>
          <div className="max-h-64 overflow-auto border border-white/10 rounded">
            <table className="w-full text-xs">
              <thead className="text-muted"><tr><th className="p-2">Name</th><th>Phone</th><th>City</th><th>Source</th></tr></thead>
              <tbody>
                {preview.slice(0,50).map((r,i)=>(<tr key={i} className="border-t border-white/5"><td className="p-2">{r.full_name}</td><td>{r.primary_phone}</td><td>{r.city}</td><td>{r.source}</td></tr>))}
              </tbody>
            </table>
          </div>
          <button className="mt-3 rounded bg-success text-black px-3 py-2" onClick={doImport}>Import</button>
        </div>
      )}
      {stage === 'summary' && summary && (
        <div className="border rounded border-white/10 p-4">
          <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
          <p className="text-sm">Inserted: {summary.inserted} | Duplicates skipped: {summary.duplicates}</p>
        </div>
      )}
    </div>
  )
}
