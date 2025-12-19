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
      // Handle auth callback links containing access_token/refresh_token in the URL hash
      const hash = window.location.hash
      const pathname = window.location.pathname
      
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const type = params.get('type')
        
        console.log('[AuthContext] Auth callback detected:', { type, hasToken: !!access_token, pathname })
        
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          console.log('[AuthContext] setSession result:', { 
            hasSession: !!data.session, 
            error,
            user: data.session?.user?.email 
          })
          
          if (!isMounted) return
          
          // Update state immediately with the new session
          if (data.session && !error) {
            setSession(data.session)
            setUser(data.session.user)
            setUserFullName(data.session.user.user_metadata?.full_name ?? null)
            console.log('[AuthContext] User logged in after email verification:', data.session.user.email)
          }
          
          // Check if this is a password recovery - show reset modal
          if (type === 'recovery' && isMounted) {
            console.log('[AuthContext] Password recovery detected - showing reset modal')
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

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
      } as any)
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
