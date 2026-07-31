import { useMemo, useState } from 'react'
import { Sun, Moon, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { runCheck, type PairResult } from '@/lib/apca'

/** Color swatch showing a hex color */
function Swatch({ hex, size = 'md' }: { hex: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div
      className={cn(dim, 'rounded-[4px] border border-[var(--color-border-soft)] shrink-0')}
      style={{ backgroundColor: hex }}
      title={hex}
    />
  )
}

/** Pass/fail badge */
function Badge({ pass }: { pass: boolean }) {
  if (pass) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-v-true-bg)] text-[var(--color-v-true)] text-xs font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        Pass
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-v-false-bg)] text-[var(--color-v-false)] text-xs font-semibold">
      <XCircle className="w-3 h-3" />
      Fail
    </span>
  )
}

/** Single row in the contrast table */
function ContrastRow({ result, index }: { result: PairResult; index: number }) {
  const lcColor =
    result.lc >= 75
      ? 'text-[var(--color-v-true)]'
      : result.lc >= 60
        ? 'text-[var(--color-accent)]'
        : result.lc >= 45
          ? 'text-[var(--color-v-mislead)]'
          : 'text-[var(--color-v-false)]'

  return (
    <tr className={cn('border-b border-[var(--color-border-soft)]', index % 2 === 1 && 'bg-[var(--color-surface-2)]/30')}>
      <td className="py-2.5 px-3 text-xs text-[var(--color-fg)]">
        {result.label}
        {result.note && (
          <span className="block text-[10px] text-[var(--color-fg-muted)] font-mono mt-0.5">
            {result.note}
          </span>
        )}
      </td>
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-1.5">
          <Swatch hex={result.fgHex} size="sm" />
          <code className="text-[10px] font-mono text-[var(--color-fg-2)]">{result.fgHex}</code>
        </div>
      </td>
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-1.5">
          <Swatch hex={result.bgHex} size="sm" />
          <code className="text-[10px] font-mono text-[var(--color-fg-2)]">{result.bgHex}</code>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <code className={cn('text-sm font-mono font-semibold tabular-nums', lcColor)}>
          {result.lc.toFixed(1)}
        </code>
      </td>
      <td className="py-2.5 px-2">
        <span className="text-[10px] font-mono text-[var(--color-fg-muted)]">
          ≥ {result.threshold}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <Badge pass={result.pass} />
      </td>
    </tr>
  )
}

export function ContrastChecker() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

  const results = useMemo(() => runCheck(mode), [mode])

  const totalPairs = results.length
  const passed = results.filter((r) => r.pass).length
  const failed = totalPairs - passed
  const allPass = failed === 0

  return (
    <div className="hairline-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-fg)]">APCA Contrast Audit</h2>
            <p className="text-xs text-[var(--color-fg-2)]">
              {allPass ? 'All pairs pass' : `${passed}/${totalPairs} pass`} —{' '}
              <span className={cn(allPass ? 'text-[var(--color-v-true)]' : 'text-[var(--color-v-false)]')}>
                {allPass ? '✅ design tokens are solid' : '⚠️ some pairs need attention'}
              </span>
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-[var(--radius-md)] p-0.5 border border-[var(--color-border)]">
          <button
            onClick={() => setMode('light')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors',
              mode === 'light'
                ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-2)]',
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors',
              mode === 'dark'
                ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-2)]',
            )}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 text-xs text-[var(--color-fg-2)]">
        <span>Passed: <strong className="text-[var(--color-v-true)]">{passed}</strong></span>
        <span>Failed: <strong className="text-[var(--color-v-false)]">{failed}</strong></span>
        <span className="font-mono tabular-nums">
          Score: <strong className={cn(allPass ? 'text-[var(--color-v-true)]' : 'text-[var(--color-v-false)]')}>
            {Math.round((passed / totalPairs) * 100)}%
          </strong>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
              <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)]">Pair</th>
              <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)]">FG</th>
              <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)]">BG</th>
              <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)]">Lc</th>
              <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)]">Min</th>
              <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-2)] text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <ContrastRow key={`${mode}-${i}`} result={result} index={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-fg-muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-v-true)' }} />
          Lc ≥ 75: body text
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
          Lc ≥ 60: large text
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-v-mislead)' }} />
          Lc ≥ 45: non-text UI
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-v-false)' }} />
          Lc &lt; 45: fail
        </span>
      </div>
    </div>
  )
}
