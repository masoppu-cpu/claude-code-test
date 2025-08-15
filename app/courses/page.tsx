'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import SearchAndFilter from '@/components/course/SearchAndFilter'
import EnhancedCourseCard from '@/components/course/EnhancedCourseCard'
import { CourseWithDetails, UserBookmark, UserCourseHistory } from '@/types/database'

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithDetails[]>([])
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([])
  const [userProgress, setUserProgress] = useState<UserCourseHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('created_at_desc')

  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          course_tags (
            tags (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      setCourses(coursesData || [])
      setFilteredCourses(coursesData || [])

      // ユーザーが認証されている場合、ブックマークと進捗を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [bookmarksResult, progressResult] = await Promise.all([
          supabase
            .from('user_bookmarks')
            .select('*')
            .eq('user_id', user.id),
          supabase
            .from('user_course_history')
            .select('*')
            .eq('user_id', user.id)
        ])

        if (bookmarksResult.data) setBookmarks(bookmarksResult.data)
        if (progressResult.data) setUserProgress(progressResult.data)
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'コースの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const filterAndSortCourses = () => {
    let filtered = [...courses]

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      )
    }

    // カテゴリーフィルター
    if (selectedCategory) {
      filtered = filtered.filter(course => course.category_id === selectedCategory)
    }

    // 難易度フィルター
    if (selectedDifficulty) {
      filtered = filtered.filter(course => course.difficulty_level === selectedDifficulty)
    }

    // タグフィルター
    if (selectedTags.length > 0) {
      filtered = filtered.filter(course =>
        course.course_tags?.some(courseTag =>
          selectedTags.includes(courseTag.tags.id)
        )
      )
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        case 'estimated_hours_asc':
          return a.estimated_hours - b.estimated_hours
        case 'estimated_hours_desc':
          return b.estimated_hours - a.estimated_hours
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  const handleBookmarkChange = (courseId: string, isBookmarked: boolean) => {
    if (isBookmarked) {
      setBookmarks(prev => [...prev, { id: '', user_id: '', course_id: courseId, created_at: '' }])
    } else {
      setBookmarks(prev => prev.filter(b => b.course_id !== courseId))
    }
  }

  const getCourseProgress = (courseId: string) => {
    const progress = userProgress.find(p => p.course_id === courseId)
    return progress?.completion_percentage || 0
  }

  const isCourseBookmarked = (courseId: string) => {
    return bookmarks.some(b => b.course_id === courseId)
  }

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, selectedTags, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">コースを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">コース一覧</h1>
          <p className="text-gray-600">
            {filteredCourses.length}件のコースが見つかりました
          </p>
        </div>

        {/* 検索・フィルター */}
        <SearchAndFilter
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onDifficultyChange={setSelectedDifficulty}
          onTagsChange={setSelectedTags}
          onSortChange={setSortBy}
        />

        {/* コース一覧 */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1 6.064-2.686l1.414 1.414m-1.414-1.414L15 11.414m-4-4.414L9.586 8.586M7.293 5.707l1.414-1.414" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">コースが見つかりません</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory || selectedDifficulty || selectedTags.length > 0
                ? '検索条件を変更してお試しください'
                : 'まだコースが登録されていません'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <EnhancedCourseCard
                key={course.id}
                course={course}
                isBookmarked={isCourseBookmarked(course.id)}
                completionPercentage={getCourseProgress(course.id)}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}