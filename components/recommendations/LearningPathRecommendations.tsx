'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { CourseWithDetails } from '@/types/database'
import Link from 'next/link'
import Card, { CardContent, CardHeader } from '../ui/Card'
import Button from '../ui/Button'

interface LearningPathRecommendationsProps {
  userId?: string
  currentCourseId?: string
  currentCategoryId?: string
  limit?: number
}

interface RecommendationReason {
  type: 'category' | 'difficulty' | 'completion' | 'popular'
  description: string
}

interface RecommendedCourse extends CourseWithDetails {
  reason: RecommendationReason
  score: number
}

export default function LearningPathRecommendations({ 
  userId, 
  currentCourseId, 
  currentCategoryId,
  limit = 6 
}: LearningPathRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      // Get all courses with their details
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          course_tags (
            tags (*)
          )
        `)
        .neq('id', currentCourseId || '')

      if (coursesError) throw coursesError

      let userProgress: { course_id: string; completion_percentage: number }[] = []
      let userBookmarks: { course_id: string }[] = []

      if (userId) {
        // Get user's progress and bookmarks
        const [progressResult, bookmarksResult] = await Promise.all([
          supabase
            .from('user_course_history')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('user_bookmarks')
            .select('*')
            .eq('user_id', userId)
        ])

        userProgress = progressResult.data || []
        userBookmarks = bookmarksResult.data || []
      }

      // Generate recommendations
      const recommendedCourses = generateRecommendations(
        allCourses || [],
        userProgress,
        userBookmarks,
        currentCategoryId
      )

      setRecommendations(recommendedCourses.slice(0, limit))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '推奨コースの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (
    courses: CourseWithDetails[],
    userProgress: { course_id: string; completion_percentage: number }[],
    userBookmarks: { course_id: string }[],
    categoryId?: string
  ): RecommendedCourse[] => {
    const recommendations: RecommendedCourse[] = []

    // Filter out courses user has already completed
    const completedCourseIds = userProgress
      .filter(p => p.completion_percentage >= 100)
      .map(p => p.course_id)

    const availableCourses = courses.filter(course => 
      !completedCourseIds.includes(course.id)
    )

    availableCourses.forEach(course => {
      let score = 0
      let reason: RecommendationReason = {
        type: 'popular',
        description: '人気のコース'
      }

      // Category-based recommendations (highest priority)
      if (categoryId && course.category_id === categoryId) {
        score += 50
        reason = {
          type: 'category',
          description: '同じカテゴリのコース'
        }
      }

      // User progress-based recommendations
      const userCourseProgress = userProgress.find(p => p.course_id === course.id)
      if (userCourseProgress) {
        if (userCourseProgress.completion_percentage > 0 && userCourseProgress.completion_percentage < 100) {
          score += 40
          reason = {
            type: 'completion',
            description: '学習中のコース'
          }
        }
      }

      // Bookmark-based recommendations
      const isBookmarked = userBookmarks.some(b => b.course_id === course.id)
      if (isBookmarked) {
        score += 30
        reason = {
          type: 'completion',
          description: 'ブックマークしたコース'
        }
      }

      // Difficulty progression recommendations
      if (userProgress.length > 0) {
        const userDifficulties = userProgress
          .filter(p => p.completion_percentage >= 100)
          .map(p => {
            const progressCourse = courses.find(c => c.id === p.course_id)
            return progressCourse?.difficulty_level
          })
          .filter(Boolean)

        if (userDifficulties.includes('beginner') && course.difficulty_level === 'intermediate') {
          score += 20
          reason = {
            type: 'difficulty',
            description: '次のレベルのコース'
          }
        } else if (userDifficulties.includes('intermediate') && course.difficulty_level === 'advanced') {
          score += 20
          reason = {
            type: 'difficulty',
            description: '次のレベルのコース'
          }
        } else if (course.difficulty_level === 'beginner') {
          score += 10
          reason = {
            type: 'difficulty',
            description: '基礎コース'
          }
        }
      } else {
        // For new users, recommend beginner courses
        if (course.difficulty_level === 'beginner') {
          score += 25
          reason = {
            type: 'difficulty',
            description: '初心者におすすめ'
          }
        }
      }

      // Add some randomness to avoid always showing same courses
      score += Math.random() * 10

      recommendations.push({
        ...course,
        reason,
        score
      })
    })

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初級'
      case 'intermediate': return '中級'
      case 'advanced': return '上級'
      default: return difficulty
    }
  }

  const getReasonIcon = (type: string) => {
    switch (type) {
      case 'category':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'difficulty':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'completion':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [userId, currentCourseId, currentCategoryId, limit]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">おすすめコース</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">おすすめコース</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">おすすめコース</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">現在おすすめできるコースがありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">あなたへのおすすめコース</h3>
        <p className="text-sm text-gray-600">
          学習履歴と興味に基づいたコースをご提案します
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* 推奨理由 */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-blue-600">
                  {getReasonIcon(course.reason.type)}
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  {course.reason.description}
                </span>
              </div>

              {/* コース情報 */}
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h4>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {course.description}
              </p>

              {/* メタ情報 */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                  {getDifficultyLabel(course.difficulty_level)}
                </span>
                <span className="text-xs text-gray-500">
                  約{course.estimated_hours}時間
                </span>
              </div>

              {/* カテゴリーとタグ */}
              <div className="mb-3">
                {course.categories && (
                  <span 
                    className="inline-block px-2 py-1 rounded text-xs text-white mr-2"
                    style={{ backgroundColor: course.categories.color }}
                  >
                    {course.categories.name}
                  </span>
                )}
                {course.course_tags && course.course_tags.slice(0, 2).map((courseTag) => (
                  <span
                    key={courseTag.tags.id}
                    className="inline-block px-2 py-1 rounded text-xs text-white mr-1"
                    style={{ backgroundColor: courseTag.tags.color }}
                  >
                    {courseTag.tags.name}
                  </span>
                ))}
              </div>

              {/* アクションボタン */}
              <Link href={`/courses/${course.id}`}>
                <Button size="sm" className="w-full">
                  詳細を見る
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {recommendations.length >= limit && (
          <div className="mt-6 text-center">
            <Link href="/courses">
              <Button variant="outline">
                すべてのコースを見る
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}