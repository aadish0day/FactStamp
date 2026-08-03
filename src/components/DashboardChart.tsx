import { useState, useEffect, type JSX } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  health: '#16a34a',     // Emerald Green
  political: '#dc2626',  // Crimson Red
  financial: '#d97706',  // Warm Amber
  religious: '#7c3aed',  // Royal Purple
  other: '#0284c7',      // Vibrant Blue
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
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            {categoryData.map((entry: { name: string }) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#888'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-soft)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-fg)',
              boxShadow: 'var(--shadow-md)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Visual Category Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full mt-3 pt-3 border-t border-[var(--color-border-soft)]">
        {categoryData.map((item) => {
          const color = CATEGORY_COLORS[item.name.toLowerCase()] || '#888'
          return (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[var(--color-fg-2)] truncate">{item.name}</span>
              <span className="font-mono font-bold text-[var(--color-fg)] me-auto">{item.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
