import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User, token?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Recupera la sesión persistida en localStorage si existe
    try {
      const storedUser = localStorage.getItem('framashare_user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch {
      localStorage.removeItem('framashare_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (userData: User, token?: string) => {
    setUser(userData)
    localStorage.setItem('framashare_user', JSON.stringify(userData))
    if (token) {
      localStorage.setItem('framashare_token', token)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('framashare_user')
    localStorage.removeItem('framashare_token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}
