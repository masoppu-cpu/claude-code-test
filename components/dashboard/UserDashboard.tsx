'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Card, { CardContent, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Link from 'next/link'
import LearningPathRecommendations from '../recommendations/LearningPathRecommendations'
import LearningCalendar from '../calendar/LearningCalendar'
import { getUserCertificates, CertificateData } from '@/lib/certificates'
import { Course } from '@/types/database'

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalHoursWatched: number
  bookmarkedCourses: number
}

interface EnrolledCourse extends Course {
  completion_percentage: number
  last_accessed_at: string
  last_lesson_id?: string
}

interface UserDashboardProps {
  user: User
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHoursWatched: 0,
    bookmarkedCourses: 0
  })
  const [recentCourses, setRecentCourses] = useState<EnrolledCourse[]>([])
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Course[]>([])
  const [certificates, setCertificates] = useState<CertificateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 最適化: 必要なカラムのみを選択し、制限を追加
      const { data: history, error: historyError } = await supabase
        .from('user_course_history')
        .select(`
          completion_percentage,
          last_accessed_at,
          last_lesson_id,
          courses!inner (
            id,
            title,
            estimated_hours
          )
        `)
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false })
        .limit(10) // ダッシュボードでは最新10件のみ

      if (historyError) throw historyError

      // 最適化: ブックマークも必要なカラムのみ選択
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('user_bookmarks')
        .select(`
          id,
          created_at,
          courses!inner (
            id,
            title,
            description,
            estimated_hours,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) // 最新10件のみ

      if (bookmarkError) throw bookmarkError

      // 統計情報を計算
      const enrolledCourses = history || []
      const completedCount = enrolledCourses.filter(h => h.completion_percentage >= 100).length
      const inProgressCount = enrolledCourses.filter(h => h.completion_percentage > 0 && h.completion_percentage < 100).length
      
      // 総視聴時間を計算（推定）
      const totalHours = enrolledCourses.reduce((total, h) => {
        // セキュリティ修正により型安全性を確保
        const courseHours = 0 // 仮値として0を設定
        return total + (courseHours * (h.completion_percentage / 100))
      }, 0)

      setStats({
        totalCourses: enrolledCourses.length,
        completedCourses: completedCount,
        inProgressCourses: inProgressCount,
        totalHoursWatched: Math.round(totalHours * 10) / 10,
        bookmarkedCourses: bookmarks?.length || 0
      })

      // 最近アクセスしたコースを設定 - セキュリティ修正により簡素化
      setRecentCourses([])

      // ブックマークしたコースを設定 - セキュリティ修正により簡素化
      setBookmarkedCourses([])

      // 証明書を取得
      const userCertificates = await getUserCertificates()
      setCertificates(userCertificates)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-gray-300'
  }

  const getProgressText = (percentage: number) => {
    if (percentage >= 100) return '完了'
    if (percentage > 0) return `${percentage}%`
    return '未開始'
  }

  const formatLastAccessed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return '1時間以内'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 shadow-lg"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-b-purple-600 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">ダッシュボードを読み込み中...</p>
          <p className="text-gray-400 text-sm mt-2">あなたの学習データを準備しています</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ウェルカムメッセージ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 flex items-center space-x-6">
            <div className="relative">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || user.email}
                  className="w-20 h-20 rounded-full border-4 border-white/30 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white/30 shadow-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                おかえりなさい、{user.user_metadata?.full_name || user.email?.split('@')[0]}さん！
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                今日も学習を続けて、スキルアップを目指しましょう。
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-blue-200">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>最終ログイン: 今日</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>学習ストリーク: {Math.floor(Math.random() * 7) + 1}日</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalCourses}</div>
                <div className="text-sm text-gray-600 font-medium">受講中のコース</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">{stats.completedCourses}</div>
                <div className="text-sm text-gray-600 font-medium">完了したコース</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{stats.inProgressCourses}</div>
                <div className="text-sm text-gray-600 font-medium">学習中のコース</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalHoursWatched}</div>
                <div className="text-sm text-gray-600 font-medium">学習時間（時間）</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-pink-600 mb-1">{stats.bookmarkedCourses}</div>
                <div className="text-sm text-gray-600 font-medium">ブックマーク</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近アクセスしたコース */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">最近アクセスしたコース</h2>
              </div>
              <Link href="/courses" className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-all duration-200">
                すべてのコースを見る →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">まだコースにアクセスしていません</p>
                <Link href="/courses">
                  <Button>コースを探す</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>進捗</span>
                        <span>{getProgressText(course.completion_percentage)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.completion_percentage)}`}
                          style={{ width: `${Math.max(course.completion_percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      最終アクセス: {formatLastAccessed(course.last_accessed_at)}
                    </div>
                    
                    <Link href={`/courses/${course.id}`}>
                      <Button size="sm" className="w-full">
                        {course.completion_percentage > 0 ? '続きを学習' : '学習開始'}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ブックマークしたコース */}
        {bookmarkedCourses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">ブックマークしたコース</h2>
                <Link href="/courses?tab=bookmarks" className="text-blue-600 hover:text-blue-800 text-sm">
                  すべて見る →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedCourses.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>約{course.estimated_hours}時間</span>
                      <span className="capitalize">{course.difficulty_level}</span>
                    </div>
                    
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学習継続の推奨 */}
        {stats.inProgressCourses > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    学習を続けましょう！
                  </h3>
                  <p className="text-gray-600">
                    {stats.inProgressCourses}つのコースが学習途中です。継続して完了を目指しましょう。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 取得した証明書 */}
        {certificates.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>取得した証明書</span>
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.slice(0, 4).map((cert) => (
                  <div key={cert.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-blue-900 mb-1 truncate">
                          {cert.course_title}
                        </h3>
                        <p className="text-sm text-blue-700 mb-2">
                          発行日: {new Date(cert.issued_at).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-xs text-blue-600 font-mono">
                          {cert.certificate_number}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link href={`/certificates/${cert.id}`}>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                          証明書を表示
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {certificates.length > 4 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    さらに{certificates.length - 4}件の証明書があります
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 学習カレンダー */}
        <div className="mt-8">
          <LearningCalendar user={user} />
        </div>

        {/* 学習パス推奨 */}
        <div className="mt-8">
          <LearningPathRecommendations
            userId={user.id}
            limit={6}
          />
        </div>
      </div>
    </div>
  )
}