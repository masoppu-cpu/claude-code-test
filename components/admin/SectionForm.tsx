'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { extractYouTubeVideoId } from '@/lib/admin'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card, { CardContent, CardHeader } from '../ui/Card'
import { useRouter } from 'next/navigation'

interface SectionFormProps {
  courseId: string
  section?: {
    id: string
    title: string
    order: number
    lessons?: Array<{
      id: string
      title: string
      youtube_video_id: string
      order: number
      is_preview: boolean
    }>
  }
  isEdit?: boolean
}

export default function SectionForm({ courseId, section, isEdit = false }: SectionFormProps) {
  const [title, setTitle] = useState(section?.title || '')
  const [order, setOrder] = useState(section?.order || 1)
  const [lessons, setLessons] = useState(section?.lessons || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const addLesson = () => {
    const newLesson = {
      id: `temp-${Date.now()}`,
      title: '',
      youtube_video_id: '',
      order: lessons.length + 1,
      is_preview: false
    }
    setLessons([...lessons, newLesson])
  }

  const updateLesson = (index: number, field: string, value: string | boolean) => {
    const updatedLessons = [...lessons]
    if (field === 'youtube_url') {
      // Extract video ID from URL
      const videoId = extractYouTubeVideoId(value as string)
      updatedLessons[index].youtube_video_id = videoId || (value as string)
    } else {
      (updatedLessons[index] as Record<string, unknown>)[field] = value
    }
    setLessons(updatedLessons)
  }

  const removeLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index)
    setLessons(updatedLessons)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let sectionId = section?.id

      if (isEdit && section) {
        // Update existing section
        const { error: sectionError } = await supabase
          .from('sections')
          .update({
            title,
            order,
            updated_at: new Date().toISOString()
          })
          .eq('id', section.id)

        if (sectionError) throw sectionError
      } else {
        // Create new section
        const { data: newSection, error: sectionError } = await supabase
          .from('sections')
          .insert({
            course_id: courseId,
            title,
            order
          })
          .select()
          .single()

        if (sectionError) throw sectionError
        sectionId = newSection.id
      }

      // Handle lessons
      for (const lesson of lessons) {
        if (lesson.id.startsWith('temp-')) {
          // Create new lesson
          await supabase
            .from('lessons')
            .insert({
              section_id: sectionId,
              title: lesson.title,
              youtube_video_id: lesson.youtube_video_id,
              order: lesson.order,
              is_preview: lesson.is_preview
            })
        } else {
          // Update existing lesson
          await supabase
            .from('lessons')
            .update({
              title: lesson.title,
              youtube_video_id: lesson.youtube_video_id,
              order: lesson.order,
              is_preview: lesson.is_preview,
              updated_at: new Date().toISOString()
            })
            .eq('id', lesson.id)
        }
      }

      router.push(`/admin/courses/${courseId}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">
            {isEdit ? 'セクションを編集' : '新しいセクションを作成'}
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="セクションタイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="例: 第1章 基礎知識"
              />
              
              <Input
                label="順序"
                type="number"
                value={order.toString()}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                min="1"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1"
              >
                {loading ? '保存中...' : (isEdit ? '更新' : '作成')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lessons Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">レッスン管理</h3>
            <Button type="button" onClick={addLesson} size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              レッスンを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">まだレッスンがありません</p>
              <Button type="button" onClick={addLesson}>
                最初のレッスンを追加
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Card key={lesson.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">レッスン {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          削除
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="レッスンタイトル"
                          value={lesson.title}
                          onChange={(e) => updateLesson(index, 'title', e.target.value)}
                          placeholder="例: 1-1 ChatGPT入門"
                          required
                        />
                        
                        <Input
                          label="YouTube URL または Video ID"
                          value={lesson.youtube_video_id}
                          onChange={(e) => updateLesson(index, 'youtube_url', e.target.value)}
                          placeholder="例: https://youtube.com/watch?v=..."
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={lesson.is_preview}
                            onChange={(e) => updateLesson(index, 'is_preview', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">プレビュー動画として設定</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}