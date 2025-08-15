'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Lesson } from '@/types/database'
import { 
  extractYouTubeVideoId, 
  validateLessonForm 
} from '@/lib/validation'

interface LessonManagerProps {
  sectionId: string
}

export default function LessonManager({ sectionId }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    youtube_video_id: '',
    is_preview: false
  })
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const supabase = createClient()

  const fetchLessons = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('section_id', sectionId)
        .order('order', { ascending: true })

      if (error) throw error
      setLessons(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'レッスンの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const addLesson = async () => {
    // バリデーション
    const validation = validateLessonForm({
      title: formData.title,
      youtube_video_id: formData.youtube_video_id
    })

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors({})
    setLoading(true)
    
    try {
      const nextOrder = lessons.length + 1
      
      const { error } = await supabase
        .from('lessons')
        .insert({
          section_id: sectionId,
          title: formData.title.trim(),
          youtube_video_id: formData.youtube_video_id.trim(),
          order: nextOrder,
          is_preview: formData.is_preview
        })

      if (error) throw error
      
      setFormData({ title: '', youtube_video_id: '', is_preview: false })
      setShowAddForm(false)
      await fetchLessons()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'レッスンの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('このレッスンを削除しますか？')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
      await fetchLessons()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'レッスンの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateLessonOrder = async (lessonId: string, newOrder: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ order: newOrder })
        .eq('id', lessonId)

      if (error) throw error
      await fetchLessons()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'レッスンの並び替えに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const togglePreview = async (lessonId: string, currentPreview: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_preview: !currentPreview })
        .eq('id', lessonId)

      if (error) throw error
      await fetchLessons()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'プレビュー設定の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoIdChange = (value: string) => {
    const extractedId = extractYouTubeVideoId(value)
    setFormData({ ...formData, youtube_video_id: extractedId })
    
    // リアルタイムバリデーション
    if (extractedId && validationErrors.youtube_video_id) {
      const validation = validateLessonForm({
        title: formData.title,
        youtube_video_id: extractedId
      })
      if (validation.isValid || !validation.errors.youtube_video_id) {
        const newErrors = { ...validationErrors }
        delete newErrors.youtube_video_id
        setValidationErrors(newErrors)
      }
    }
  }

  useEffect(() => {
    fetchLessons()
  }, [sectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && lessons.length === 0) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* レッスン一覧 */}
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {lesson.order}. {lesson.title}
                  </h3>
                  {lesson.is_preview && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      プレビュー
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>YouTube ID: {lesson.youtube_video_id}</p>
                  <p>作成日: {new Date(lesson.created_at).toLocaleDateString('ja-JP')}</p>
                </div>

                {/* YouTube埋め込みプレビュー */}
                <div className="mt-3">
                  <div className="aspect-video w-32 bg-gray-100 rounded overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${lesson.youtube_video_id}`}
                      className="w-full h-full"
                      title={lesson.title}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLessonOrder(lesson.id, lesson.order - 1)}
                    disabled={lesson.order === 1 || loading}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLessonOrder(lesson.id, lesson.order + 1)}
                    disabled={lesson.order === lessons.length || loading}
                  >
                    ↓
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePreview(lesson.id, lesson.is_preview)}
                  disabled={loading}
                  className={lesson.is_preview ? 'text-green-600' : 'text-gray-600'}
                >
                  {lesson.is_preview ? 'プレビュー解除' : 'プレビューに'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteLesson(lesson.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800"
                >
                  削除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新しいレッスン追加 */}
      {showAddForm ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">新しいレッスンを追加</h4>
          <div className="space-y-3">
            <Input
              label="レッスンタイトル"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例: 1-1：ChatGPT入門動画"
              error={validationErrors.title}
            />
            
            <Input
              label="YouTube動画URL/ID"
              value={formData.youtube_video_id}
              onChange={(e) => handleVideoIdChange(e.target.value)}
              placeholder="例: https://youtube.com/watch?v=dQw4w9WgXcQ または dQw4w9WgXcQ"
              error={validationErrors.youtube_video_id}
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_preview"
                checked={formData.is_preview}
                onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_preview" className="text-sm text-gray-700">
                プレビュー動画（未認証ユーザーも視聴可能）
              </label>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={addLesson}
                disabled={loading}
                size="sm"
              >
                追加
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ title: '', youtube_video_id: '', is_preview: false })
                  setValidationErrors({})
                }}
                size="sm"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={loading}
          className="w-full"
        >
          + 新しいレッスンを追加
        </Button>
      )}
    </div>
  )
}