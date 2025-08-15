'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { User } from '@supabase/supabase-js'
import Card, { CardContent, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import LearningDetailModal from './LearningDetailModal'
import 'react-calendar/dist/Calendar.css'

interface LearningDay {
  date: string
  lessonsCompleted: number
  lessonTitles: string[]
  courseNames: string[]
}

interface LearningCalendarProps {
  user: User
  onDateSelect?: (date: Date, learningData?: LearningDay) => void
}

export default function LearningCalendar({ user, onDateSelect }: LearningCalendarProps) {
  const [learningData, setLearningData] = useState<Map<string, LearningDay>>(new Map())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)

  const fetchLearningHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/learning-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('学習履歴の取得に失敗しました')
      }

      const data = await response.json()
      const learningMap = new Map<string, LearningDay>()

      data.forEach((item: {
        completed_at: string;
        lesson_title: string;
        course_title: string;
      }) => {
        const dateKey = new Date(item.completed_at).toDateString()
        if (learningMap.has(dateKey)) {
          const existing = learningMap.get(dateKey)!
          existing.lessonsCompleted++
          existing.lessonTitles.push(item.lesson_title)
          if (!existing.courseNames.includes(item.course_title)) {
            existing.courseNames.push(item.course_title)
          }
        } else {
          learningMap.set(dateKey, {
            date: dateKey,
            lessonsCompleted: 1,
            lessonTitles: [item.lesson_title],
            courseNames: [item.course_title]
          })
        }
      })

      setLearningData(learningMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : '学習履歴の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLearningHistory()
  }, [user.id, fetchLearningHistory])

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    
    const dateKey = date.toDateString()
    const learningDay = learningData.get(dateKey)
    
    if (!learningDay) return ''
    
    // 学習レッスン数に応じて色を変える
    if (learningDay.lessonsCompleted >= 5) return 'learning-day-high'
    if (learningDay.lessonsCompleted >= 3) return 'learning-day-medium'
    if (learningDay.lessonsCompleted >= 1) return 'learning-day-low'
    
    return ''
  }

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const dateKey = date.toDateString()
    const learningDay = learningData.get(dateKey)
    
    if (!learningDay) return null
    
    return (
      <div className="learning-indicator">
        <span className="lesson-count">{learningDay.lessonsCompleted}</span>
      </div>
    )
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateKey = date.toDateString()
    const learningDay = learningData.get(dateKey)
    
    // モーダルを開く（学習記録がある場合）
    if (learningDay) {
      setModalDate(date)
      setIsModalOpen(true)
    }
    
    onDateSelect?.(date, learningDay)
  }

  const getSelectedDateData = () => {
    const dateKey = selectedDate.toDateString()
    return learningData.get(dateKey)
  }

  const getTotalStudyDays = () => {
    return learningData.size
  }

  const getTotalLessons = () => {
    return Array.from(learningData.values()).reduce((total, day) => total + day.lessonsCompleted, 0)
  }

  const getCurrentStreak = () => {
    const today = new Date()
    let streak = 0
    const currentDate = new Date(today)
    
    while (true) {
      const dateKey = currentDate.toDateString()
      if (learningData.has(dateKey)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">学習カレンダー</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">カレンダーを読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">学習カレンダー</h3>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedDateData = getSelectedDateData()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>学習カレンダー</span>
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              月表示
            </Button>
            <Button
              variant={viewMode === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('year')}
            >
              年表示
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalStudyDays()}</div>
            <div className="text-sm text-blue-800">学習日数</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{getTotalLessons()}</div>
            <div className="text-sm text-green-800">完了レッスン</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{getCurrentStreak()}</div>
            <div className="text-sm text-orange-800">連続学習日</div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="learning-calendar-wrapper mb-6">
          <Calendar
            onChange={(date) => handleDateClick(date as Date)}
            value={selectedDate}
            view={viewMode}
            locale="ja-JP"
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            showNeighboringMonth={false}
            formatDay={(locale, date) => date.getDate().toString()}
            formatMonthYear={(locale, date) => 
              `${date.getFullYear()}年${date.getMonth() + 1}月`
            }
          />
        </div>

        {/* 凡例 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">凡例</h4>
          <div className="flex flex-wrap items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-green-200"></div>
              <span>1-2レッスン</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
              <span>3-4レッスン</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
              <span>5レッスン以上</span>
            </div>
          </div>
        </div>

        {/* 選択された日の詳細 */}
        {selectedDateData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}の学習記録
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                完了レッスン数: <span className="font-semibold text-gray-900">{selectedDateData.lessonsCompleted}レッスン</span>
              </p>
              <div>
                <p className="text-sm text-gray-600 mb-1">学習したコース:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDateData.courseNames.map((courseName, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {courseName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedDateData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">
              {selectedDate.toLocaleDateString('ja-JP')}は学習記録がありません
            </p>
          </div>
        )}
      </CardContent>

      {/* 学習詳細モーダル */}
      <LearningDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={modalDate}
        userId={user.id}
      />
    </Card>
  )
}