export function BadgeScore({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-success/15 text-success'
      : score >= 60
      ? 'bg-warning/15 text-warning'
      : 'bg-black/5 text-fg/70 dark:bg-white/10 dark:text-white/90'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-line ${color}`}
      aria-label={`Score ${score}`}
    >
      {score}
    </span>
  )
}
