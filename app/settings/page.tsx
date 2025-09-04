import Link from 'next/link'

export default function SettingsIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Settings</h1>
      <ul className="list-disc pl-5 text-sm">
        <li><Link className="underline" href="/settings/templates">Templates</Link></li>
        <li><Link className="underline" href="/settings/assignment-rules">Assignment Rules</Link></li>
        <li><Link className="underline" href="/settings/teams">Teams</Link></li>
      </ul>
    </div>
  )
}

