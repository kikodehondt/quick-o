import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userFullName: string | null
  isPasswordRecovery: boolean
  signUp: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (fullName?: string, password?: string, email?: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string, captchaToken?: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  clearAuthEvent: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userFullName, setUserFullName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initSession = async () => {
      // Check local development mode first
      if (isLocal()) {
        const localUser = localStorage.getItem('local_auth_user')
        if (localUser && isMounted) {
          try {
            const user = JSON.parse(localUser)
            setUser(user)
            setUserFullName(user.user_metadata?.full_name ?? null)
          } catch (e) {
            console.error('Failed to parse local user:', e)
          }
        }
        setLoading(false)
        return
      }

      // Production mode - use Supabase
      // Handle auth callback links containing access_token/refresh_token in the URL hash
      const hash = window.location.hash
      const pathname = window.location.pathname
      
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const type = params.get('type')
        
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Auth callback detected:', { type, hasToken: !!access_token, pathname })
        }
        
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (import.meta.env.DEV) {
            console.log('[AuthContext] setSession result:', { 
              hasSession: !!data.session, 
              error,
              user: data.session?.user?.email 
            })
          }
          
          if (!isMounted) return
          
          // Update state immediately with the new session
          if (data.session && !error) {
            setSession(data.session)
            setUser(data.session.user)
            setUserFullName(data.session.user.user_metadata?.full_name ?? null)
            if (import.meta.env.DEV) {
              console.log('[AuthContext] User logged in after email verification:', data.session.user.email)
            }
          }
          
          // Check if this is a password recovery - show reset modal
          if (type === 'recovery' && isMounted) {
            if (import.meta.env.DEV) {
              console.log('[AuthContext] Password recovery detected - showing reset modal')
            }
            setIsPasswordRecovery(true)
          }
          
          // Clean the URL after processing
          window.history.replaceState({}, '', '/')
          return // Don't getSession again, we already have it
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setUserFullName(session?.user?.user_metadata?.full_name ?? null)
      setLoading(false)
    }

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setUserFullName(session?.user?.user_metadata?.full_name ?? null)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Check if running locally
  const isLocal = () => {
    if (typeof window === 'undefined') return false
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  }

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    // Local development mode - bypass Supabase auth
    if (isLocal()) {
      try {
        // Store user in localStorage for local development
        const mockUser = {
          id: `local-${Date.now()}`,
          email,
          user_metadata: { full_name: fullName },
          created_at: new Date().toISOString(),
        }
        localStorage.setItem('local_auth_user', JSON.stringify(mockUser))
        localStorage.setItem('local_auth_password', password)
        
        // Set the user state
        setUser(mockUser as any)
        setUserFullName(fullName)
        
        return { error: null }
      } catch (err: any) {
        return { error: err }
      }
    }

    // Production mode - use Supabase
    const options: any = {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    }
    
    // Only add captchaToken if it exists
    if (captchaToken) {
      options.captchaToken = captchaToken
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    })
    
    // Ignore "already seen response" captcha errors
    if (error && error.message?.includes('already seen response')) {
      return { error: null }
    }
    
    return { error }
  }

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    // Local development mode - bypass Supabase auth
    if (isLocal()) {
      try {
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem('local_auth_user')
        const storedPassword = localStorage.getItem('local_auth_password')
        
        if (storedUser) {
          const user = JSON.parse(storedUser)
          
          // Verify password
          if (storedPassword !== password) {
            return { error: { message: 'Wachtwoord is incorrect.' } as any }
          }
          
          // Set the user state
          setUser(user)
          setUserFullName(user.user_metadata?.full_name)
          
          return { error: null }
        }
        
        // User not found in localStorage - create a new local user for development
        // In development mode, accept any email/password combination
        const mockUser = {
          id: `local-${Date.now()}`,
          email,
          user_metadata: { full_name: email.split('@')[0] },
          created_at: new Date().toISOString(),
        }
        localStorage.setItem('local_auth_user', JSON.stringify(mockUser))
        localStorage.setItem('local_auth_password', password)
        
        // Set the user state
        setUser(mockUser as any)
        setUserFullName(mockUser.user_metadata.full_name)
        
        return { error: null }
      } catch (err: any) {
        return { error: err }
      }
    }

    // Production mode - use Supabase
    const options: any = {}
    
    // Only add captchaToken if it exists
    if (captchaToken) {
      options.captchaToken = captchaToken
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options,
    })
    
    // Ignore "already seen response" captcha errors
    if (error && error.message?.includes('already seen response')) {
      return { error: null }
    }
    
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    // Local development mode
    if (isLocal()) {
      localStorage.removeItem('local_auth_user')
      localStorage.removeItem('local_auth_password')
      setUser(null)
      setUserFullName(null)
      return
    }
    
    // Production mode - use Supabase
    await supabase.auth.signOut()
  }

  const updateProfile = async (fullName?: string, password?: string, email?: string) => {
    const payload: any = {}
    if (fullName) {
      payload.data = { full_name: fullName }
    }
    if (password) {
      payload.password = password
    }
    if (email) {
      payload.email = email
    }
    const { error } = await supabase.auth.updateUser(payload)
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setUser(session?.user ?? null)
    setUserFullName(session?.user?.user_metadata?.full_name ?? null)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    userFullName,
    isPasswordRecovery,
    updateProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword: async (email: string, captchaToken?: string) => {
      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
      
      // Only add captchaToken if it exists
      if (captchaToken) {
        options.captchaToken = captchaToken
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, options as any)
      
      // Ignore "already seen response" captcha errors
      if (error && error.message?.includes('already seen response')) {
        return { error: null }
      }
      
      // If captcha verification failed locally, retry without captcha
      if (error && isLocal() && error.message?.includes('captcha')) {
        const { error: retryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        } as any)
        return { error: retryError }
      }
      
      return { error }
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (!error) setIsPasswordRecovery(false)
      return { error }
    },
    clearAuthEvent: () => setIsPasswordRecovery(false),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
