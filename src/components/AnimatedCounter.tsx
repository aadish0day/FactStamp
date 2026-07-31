import { memo, useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export const AnimatedCounter = memo(function AnimatedCounter({ value, duration = 400, suffix = '', className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const start = 0
    const end = value
    const increment = (end - start) / (duration / 16)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <span className={`font-mono tabular-nums ${className || ''}`}>
      {count.toLocaleString()}{suffix}
    </span>
  )
})
