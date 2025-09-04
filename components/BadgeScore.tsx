export function BadgeScore({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-success/20 text-success' : score >= 60 ? 'bg-warning/20 text-warning' : 'bg-white/10 text-white'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`} aria-label={`Score ${score}`}>{score}</span>
}

