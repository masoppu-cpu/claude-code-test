'use client'

import { useEffect, useState } from 'react'
import Button from '../ui/Button'

interface LearningDetail {
  lesson_id: string
  lesson_title: string
  section_title: string
  course_id: string
  course_title: string
  completed_at: string
}

interface LearningDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  userId: string
}

export default function LearningDetailModal({ isOpen, onClose, date, userId }: LearningDetailModalProps) {
  const [details, setDetails] = useState<LearningDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchDayDetails = async () => {
    if (!date || !userId) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/learning-history/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date: date.toISOString().split('T')[0] // YYYY-MM-DD format
        }),
      })

      if (!response.ok) {
        throw new Error('学習詳細の取得に失敗しました')
      }

      const data = await response.json()
      setDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '学習詳細の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && date) {
      fetchDayDetails()
    }
  }, [isOpen, date, userId, fetchDayDetails])

  if (!isOpen) return null

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const groupedByCourse = details.reduce((acc, detail) => {
    const courseKey = detail.course_id
    if (!acc[courseKey]) {
      acc[courseKey] = {
        course_title: detail.course_title,
        lessons: []
      }
    }
    acc[courseKey].lessons.push(detail)
    return acc
  }, {} as Record<string, { course_title: string; lessons: LearningDetail[] }>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">学習詳細</h2>
              <p className="text-blue-100">
                {date?.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">詳細を読み込み中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {!loading && !error && details.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">この日は学習記録がありません</p>
              <p className="text-gray-400 text-sm mt-1">他の日を選択してみてください</p>
            </div>
          )}

          {!loading && !error && details.length > 0 && (
            <div className="space-y-6">
              {/* サマリー */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">学習サマリー</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">完了レッスン数:</span>
                    <span className="font-semibold text-blue-900 ml-2">{details.length}レッスン</span>
                  </div>
                  <div>
                    <span className="text-blue-700">学習コース数:</span>
                    <span className="font-semibold text-blue-900 ml-2">{Object.keys(groupedByCourse).length}コース</span>
                  </div>
                </div>
              </div>

              {/* コース別詳細 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">学習詳細</h3>
                {Object.entries(groupedByCourse).map(([courseId, courseData]) => (
                  <div key={courseId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900">{courseData.course_title}</h4>
                      <p className="text-sm text-gray-600">{courseData.lessons.length}レッスン完了</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {courseData.lessons
                        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
                        .map((lesson) => (
                        <div key={lesson.lesson_id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{lesson.lesson_title}</p>
                              <p className="text-sm text-gray-600 mt-1">{lesson.section_title}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-sm text-gray-500">{formatTime(lesson.completed_at)}</span>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}