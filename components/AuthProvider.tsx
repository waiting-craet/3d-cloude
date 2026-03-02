'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/lib/userStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initializeFromStorage, checkTokenExpiration, refreshAuthToken, isLoading, isLoggedIn, authToken } = useUserStore()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize from storage first
        initializeFromStorage()
        
        // If we have a token, validate it with the server
        const state = useUserStore.getState()
        if (state.isLoggedIn && state.authToken) {
          await validateTokenWithServer()
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initialize()
  }, [initializeFromStorage])

  // Validate token with server
  const validateTokenWithServer = async () => {
    const state = useUserStore.getState()
    if (!state.authToken?.token) return

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.authToken.token}`
        }
      })

      if (!response.ok) {
        // Token is invalid, try to refresh or logout
        if (state.authToken.refreshToken) {
          const refreshSuccess = await refreshAuthToken()
          if (!refreshSuccess) {
            console.log('Token validation failed and refresh failed, logging out')
          }
        } else {
          state.logout()
        }
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      // Don't logout on network errors, just log the issue
    }
  }

  // Set up periodic token validation
  useEffect(() => {
    if (!isInitialized) return

    const validatePeriodically = async () => {
      const state = useUserStore.getState()
      if (state.isLoggedIn && state.authToken) {
        // Check token expiration first
        const isValid = checkTokenExpiration()
        
        // If token is still valid, validate with server
        if (isValid) {
          await validateTokenWithServer()
        }
      }
    }

    // Validate immediately
    validatePeriodically()

    // Set up periodic validation (every 10 minutes)
    const interval = setInterval(validatePeriodically, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isInitialized, checkTokenExpiration, refreshAuthToken])

  // Handle page visibility change - validate when page becomes visible
  useEffect(() => {
    if (!isInitialized) return

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const state = useUserStore.getState()
        if (state.isLoggedIn && state.authToken) {
          // Check if token expired while page was hidden
          const isValid = checkTokenExpiration()
          if (isValid) {
            await validateTokenWithServer()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isInitialized, checkTokenExpiration])

  // Handle storage events (for multi-tab synchronization)
  useEffect(() => {
    if (!isInitialized) return

    const handleStorageChange = (e: StorageEvent) => {
      // Re-initialize when storage changes in another tab
      if (e.key === 'currentUser' || e.key === 'authToken') {
        initializeFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isInitialized, initializeFromStorage])

  // Handle network status changes
  useEffect(() => {
    if (!isInitialized) return

    const handleOnline = async () => {
      // When coming back online, validate the current session
      const state = useUserStore.getState()
      if (state.isLoggedIn && state.authToken) {
        await validateTokenWithServer()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [isInitialized])

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook for components that need auth status
export function useAuthStatus() {
  const { isLoggedIn, user, isLoading } = useUserStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Mark as initialized after first render
    setIsInitialized(true)
  }, [])

  return {
    isLoggedIn,
    user,
    isLoading,
    isInitialized
  }
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isLoggedIn, isInitialized } = useAuthStatus()
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    useEffect(() => {
      if (isInitialized && !isLoggedIn) {
        setShowLoginPrompt(true)
      }
    }, [isInitialized, isLoggedIn])

    if (!isInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在验证登录状态...</p>
          </div>
        </div>
      )
    }

    if (!isLoggedIn) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">需要登录</h2>
            <p className="text-gray-600 mb-6">请登录后访问此页面</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}