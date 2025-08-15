'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import Button from './Button'
import NotificationDropdown from '../notifications/NotificationDropdown'
import type { User } from '@supabase/supabase-js'

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    const confirmed = window.confirm('ログアウトしますか？')
    if (confirmed) {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent hidden sm:block">
              AI開発オンライン講座
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:hidden">
              AI講座
            </span>
          </Link>
          
          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-6">
            {/* ナビゲーションリンク */}
            <div className="flex items-center space-x-8">
              <Link href="/courses" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 group">
                <span>コース</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {user && (
                <Link href="/dashboard" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 group">
                  <span>ダッシュボード</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                
                <div className="flex items-center space-x-4 bg-gradient-to-r from-gray-50 to-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="relative">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email}
                        className="w-10 h-10 rounded-full ring-2 ring-blue-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="text-left">
                    {user.user_metadata?.full_name && (
                      <div className="text-sm font-semibold text-gray-900">
                        {user.user_metadata.full_name}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ログアウト
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    サインアップ
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* モバイルハンバーガーメニューボタン */}
          <div className="flex items-center space-x-3 md:hidden">
            {!loading && user && (
              <div className="flex items-center space-x-2">
                <NotificationDropdown />
                
                <div className="relative">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || user.email}
                      className="w-8 h-8 rounded-full ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="メニューを開く"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-6 space-y-4">
              <Link 
                href="/courses" 
                className="block py-3 px-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>コース</span>
                </div>
              </Link>
              
              {user && (
                <Link 
                  href="/dashboard" 
                  className="block py-3 px-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>ダッシュボード</span>
                  </div>
                </Link>
              )}
              
              {loading ? (
                <div className="flex items-center space-x-3 py-3 px-4">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : user ? (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {user.user_metadata?.avatar_url ? (
                          <img 
                            src={user.user_metadata.avatar_url}
                            alt={user.user_metadata?.full_name || user.email}
                            className="w-12 h-12 rounded-full ring-2 ring-blue-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {user.user_metadata?.full_name && (
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.user_metadata.full_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>ログアウト</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <Link 
                    href="/login" 
                    className="block w-full py-3 px-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 font-medium text-center shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    サインアップ
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}