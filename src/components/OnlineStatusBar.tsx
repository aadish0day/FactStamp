import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OnlineStatusBar() {
  const [online, setOnline] = useState(navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    const handleOnline = () => {
      setOnline(true)
      setJustReconnected(true)
      clearTimeout(reconnectTimer) // cancel any previous timer
      reconnectTimer = setTimeout(() => setJustReconnected(false), 3000)
    }

    const handleOffline = () => {
      setOnline(false)
      setJustReconnected(false)
      clearTimeout(reconnectTimer) // cancel pending "back online" timer
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(reconnectTimer) // cleanup on unmount
    }
  }, [])

  // When just reconnected, show the success state briefly
  const isVisible = !online || justReconnected

  if (!isVisible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300',
        'animate-dropdown-slide',
        !online
          ? 'bg-[var(--color-v-mislead)] text-white'
          : 'bg-[var(--color-v-true)] text-white'
      )}
    >
      {!online ? (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>
            You're offline — some features may be unavailable.
            <span className="hidden sm:inline"> Check your internet connection.</span>
          </span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>You're back online!</span>
        </>
      )}
    </div>
  )
}
