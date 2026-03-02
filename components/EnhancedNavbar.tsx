'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/userStore'
import { useAuthStatus } from './AuthProvider'
import LoginModal from './LoginModal'
import UserProfile from './UserProfile'

// TypeScript interfaces for the component
export interface EnhancedNavbarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onSearchSubmit?: () => void
  className?: string
}

interface UserMenuProps {
  user: any
  onLogout: () => void
  onNavigate: (path: string) => void
}

interface SearchBarProps {
  query: string
  onChange: (query: string) => void
  onSubmit: () => void
  placeholder?: string
}

interface LogoProps {
  onClick?: () => void
}

// Logo component
const Logo: React.FC<LogoProps> = ({ onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:bg-teal-600 transition-colors">
        📊
      </div>
      <span className="text-xl font-bold text-teal-500 group-hover:text-teal-600 transition-colors">
        知识图谱
      </span>
    </div>
  )
}

// Search bar component
const SearchBar: React.FC<SearchBarProps> = ({ 
  query, 
  onChange, 
  onSubmit, 
  placeholder = "搜索知识图谱" 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <div className="flex-1 max-w-2xl mx-8">
      <div className="relative flex bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-6 py-3 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
        />
        <button
          onClick={onSubmit}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-r-full transition-colors"
        >
          🔍
        </button>
      </div>
    </div>
  )
}

// User avatar component
const UserAvatar: React.FC<{ user: any; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  // Generate avatar from username first letter
  const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || 'U'
  
  // Generate consistent color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const index = username?.charCodeAt(0) % colors.length || 0
    return colors[index]
  }

  return (
    <div className={`${sizeClasses[size]} ${getAvatarColor(user?.username || '')} rounded-full flex items-center justify-center text-white font-semibold`}>
      {avatarLetter}
    </div>
  )
}

// User menu dropdown component
const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-user-menu]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" data-user-menu>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <UserAvatar user={user} size="md" />
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
            {user?.username || '用户'}
          </span>
          <span className="text-xs text-gray-500">在线</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* User info header */}
          <div className="px-4 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="lg" />
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-800">
                  {user?.username || '用户'}
                </div>
                <div className="text-sm text-gray-600">
                  {user?.email || 'user@example.com'}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">在线</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={() => {
                onNavigate('/profile')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600">👤</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">个人资料</div>
                <div className="text-xs text-gray-500">查看和编辑个人信息</div>
              </div>
            </button>

            <button
              onClick={() => {
                onNavigate('/my-works')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-green-600">📚</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">我的作品</div>
                <div className="text-xs text-gray-500">管理已创建的知识图谱</div>
              </div>
            </button>

            <button
              onClick={() => {
                onNavigate('/settings')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-purple-600">⚙️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">设置</div>
                <div className="text-xs text-gray-500">账户和偏好设置</div>
              </div>
            </button>

            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={() => {
                  onLogout()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors group"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <span className="text-red-600">🚪</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-600">退出登录</div>
                  <div className="text-xs text-gray-500">安全退出当前账户</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main EnhancedNavbar component
const EnhancedNavbar: React.FC<EnhancedNavbarProps> = ({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  className = ''
}) => {
  const router = useRouter()
  const { logout } = useUserStore()
  const { isLoggedIn, user, isInitialized } = useAuthStatus()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Initialize user state on mount - now handled by AuthProvider
  // Remove the old initialization logic since AuthProvider handles it

  // Listen for login state changes
  useEffect(() => {
    const handleLoginStateChange = () => {
      // Force re-render when login state changes
      setIsMobileMenuOpen(false) // Close mobile menu on login state change
    }

    window.addEventListener('loginStateChange', handleLoginStateChange)
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
    }
  }, [])

  // Update local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query)
    onSearchChange?.(query)
  }

  const handleSearchSubmit = () => {
    onSearchSubmit?.()
  }

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const handleLogout = () => {
    logout()
  }

  const handleNavigate = (path: string) => {
    if (path === '/profile') {
      setIsUserProfileOpen(true)
      return
    }
    router.push(path)
  }

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      alert('请先登录后再开始创作')
      setIsLoginModalOpen(true)
      return
    }
    
    try {
      router.push('/creation')
    } catch (error) {
      console.error('Navigation failed:', error)
      window.location.href = '/creation'
    }
  }

  return (
    <>
      {/* Main navbar */}
      <nav className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo section */}
            <div className="flex-shrink-0">
              <Logo onClick={handleLogoClick} />
            </div>

            {/* Desktop search bar */}
            <div className="hidden md:flex flex-1">
              <SearchBar
                query={localSearchQuery}
                onChange={handleSearchChange}
                onSubmit={handleSearchSubmit}
              />
            </div>

            {/* Desktop user actions */}
            <div className="hidden md:flex items-center gap-3">
              {!isLoggedIn ? (
                <button
                  onClick={handleLoginClick}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  登录
                </button>
              ) : (
                <UserMenu
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                />
              )}
              
              <button
                onClick={handleCreateClick}
                disabled={!isLoggedIn}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  isLoggedIn
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm hover:shadow-md hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                }`}
              >
                开始创作
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile search */}
              <SearchBar
                query={localSearchQuery}
                onChange={handleSearchChange}
                onSubmit={handleSearchSubmit}
              />

              {/* Mobile user actions */}
              <div className="flex flex-col gap-3">
                {!isLoggedIn ? (
                  <button
                    onClick={handleLoginClick}
                    className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
                  >
                    登录
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Mobile user info */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl">
                      <UserAvatar user={user} size="md" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {user?.username || '用户'}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">在线</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile menu items */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          handleNavigate('/profile')
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600">👤</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">个人资料</div>
                          <div className="text-xs text-gray-500">查看和编辑个人信息</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigate('/my-works')
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600">📚</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">我的作品</div>
                          <div className="text-xs text-gray-500">管理已创建的知识图谱</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigate('/settings')
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600">⚙️</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">设置</div>
                          <div className="text-xs text-gray-500">账户和偏好设置</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <button
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600">🚪</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-red-600">退出登录</div>
                            <div className="text-xs text-gray-500">安全退出当前账户</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleCreateClick}
                  disabled={!isLoggedIn}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    isLoggedIn
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  开始创作
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />
    </>
  )
}

export default EnhancedNavbar