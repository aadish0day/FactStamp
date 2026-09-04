import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={cn(
        'flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 select-none shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
        isDark
          ? 'bg-zinc-950 border border-zinc-800'
          : 'bg-white border border-zinc-200 shadow-xs',
        className
      )}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleTheme()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            'flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300',
            isDark
              ? 'transform translate-x-0 bg-zinc-800'
              : 'transform translate-x-8 bg-gray-200'
          )}
        >
          {isDark ? (
            <Moon
              className="w-4 h-4 text-white"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Sun
              className="w-4 h-4 text-gray-700"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </div>
        <div
          className={cn(
            'flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300',
            isDark
              ? 'bg-transparent'
              : 'transform -translate-x-8'
          )}
        >
          {isDark ? (
            <Sun
              className="w-4 h-4 text-gray-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Moon
              className="w-4 h-4 text-black"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  )
}
