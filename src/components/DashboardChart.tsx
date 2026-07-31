import { useState, useEffect, type JSX } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  health: 'oklch(0.48 0.16 25)',
  political: 'oklch(0.44 0.10 195)',
  religious: 'oklch(0.62 0.13 65)',
  financial: 'oklch(0.42 0.12 145)',
  other: 'oklch(0.55 0.014 55)',
}

interface DashboardChartProps {
  categoryData: Array<{ name: string; count: number }>
}

export function DashboardChart({ categoryData }: DashboardChartProps) {
  const [PieComp, setPieComp] = useState<{
    PieChart: (...args: any[]) => JSX.Element | null
    Pie: (...args: any[]) => JSX.Element | null
    Cell: (...args: any[]) => JSX.Element | null
    Tooltip: (...args: any[]) => JSX.Element | null
    ResponsiveContainer: (...args: any[]) => JSX.Element | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    import('recharts').then((mod) => {
      if (cancelled) return
      setPieComp({
        PieChart: mod.PieChart as any,
        Pie: mod.Pie as any,
        Cell: mod.Cell as any,
        Tooltip: mod.Tooltip as any,
        ResponsiveContainer: mod.ResponsiveContainer as any,
      })
    })
    return () => { cancelled = true }
  }, [])

  if (!PieComp) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-lg bg-[var(--color-surface-2)] animate-shimmer">
        <span className="text-sm text-[var(--color-fg-muted)]">Loading chart…</span>
      </div>
    )
  }

  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = PieComp

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={categoryData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={({ name, percent }: { name: string; percent: number }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {categoryData.map((entry: { name: string }) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#888'}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
