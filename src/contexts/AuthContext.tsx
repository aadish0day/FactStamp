import { createContext, useContext, useState, type ReactNode } from 'react'
import { MOCK_USERS, type User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  login: (email: string) => Promise<void>
  signup: (name: string, email: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  isLoading: false,
}

const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start logged out — user must pick an account from the LoginModal
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string) => {
    setIsLoading(true)
    // Simulate async auth
    await new Promise((r) => setTimeout(r, 800))
    const found = MOCK_USERS.find((u) => u.email === email)
    if (!found) throw new Error('No account found with this email')
    setUser(found)
    setIsLoading(false)
  }

  const signup = async (name: string, email: string) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    // Check if email already exists
    const exists = MOCK_USERS.find((u) => u.email === email)
    if (exists) {
      setIsLoading(false)
      throw new Error('An account with this email already exists')
    }
    const newUser: User = {
      uid: `u${MOCK_USERS.length + 1}`,
      displayName: name,
      email,
      reputation: 50,
      totalVerifications: 0,
      joinedAt: new Date().toISOString(),
    }
    // Add to MOCK_USERS (for demo purposes)
    MOCK_USERS.push(newUser)
    setUser(newUser)
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context || defaultAuthContext
}
