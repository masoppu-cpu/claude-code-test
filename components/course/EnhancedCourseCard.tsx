'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Card, { CardContent, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import { CourseWithDetails, Category, Tag } from '@/types/database'
import { createClient } from '@/lib/supabase-client'

interface EnhancedCourseCardProps {
  course: CourseWithDetails & {
    categories?: Category
    course_tags?: { tags: Tag }[]
  }
  isBookmarked?: boolean
  completionPercentage?: number
  onBookmarkChange?: (courseId: string, isBookmarked: boolean) => void
}

export default function EnhancedCourseCard({ 
  course, 
  isBookmarked = false,
  completionPercentage = 0,
  onBookmarkChange 
}: EnhancedCourseCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (bookmarked) {
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', course.id)
      } else {
        await supabase
          .from('user_bookmarks')
          .insert({
            user_id: user.id,
            course_id: course.id
          })
      }

      setBookmarked(!bookmarked)
      onBookmarkChange?.(course.id, !bookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* サムネイル */}
        <div className="relative">
          {course.thumbnail_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">プレビュー画像なし</p>
              </div>
            </div>
          )}
          
          {/* ブックマークボタン */}
          <button
            onClick={handleBookmarkToggle}
            disabled={loading}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
          >
            <svg 
              className={`w-5 h-5 ${bookmarked ? 'text-red-500' : 'text-gray-400'}`} 
              fill={bookmarked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* 進捗バー */}
          {completionPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                {course.title}
              </h3>
            </div>
            
            {/* カテゴリーと難易度 */}
            <div className="flex items-center gap-2 mb-2">
              {course.categories && (
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: course.categories.color }}
                >
                  {course.categories.name}
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                {getDifficultyLabel(course.difficulty_level)}
              </span>
            </div>

            {/* タグ */}
            {course.course_tags && course.course_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {course.course_tags.slice(0, 3).map((courseTag) => (
                  <span
                    key={courseTag.tags.id}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: courseTag.tags.color }}
                  >
                    {courseTag.tags.name}
                  </span>
                ))}
                {course.course_tags.length > 3 && (
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                    +{course.course_tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            {course.description && (
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {course.description}
              </p>
            )}
            
            <div className="space-y-3">
              {/* 学習時間と進捗 */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>約{course.estimated_hours}時間</span>
                </div>
                {completionPercentage > 0 && (
                  <span className="text-green-600 font-medium">
                    {completionPercentage}% 完了
                  </span>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {completionPercentage > 0 ? '続きを学習' : '学習開始'}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}