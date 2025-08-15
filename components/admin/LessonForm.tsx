'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { extractYouTubeVideoId } from '@/lib/admin'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card, { CardContent, CardHeader } from '../ui/Card'
import { useRouter } from 'next/navigation'

interface LessonFormProps {
  sectionId: string
  courseId: string
  lesson?: {
    id: string
    title: string
    youtube_video_id: string
    order: number
    is_preview: boolean
  }
  isEdit?: boolean
}

export default function LessonForm({ sectionId, courseId, lesson, isEdit = false }: LessonFormProps) {
  const [title, setTitle] = useState(lesson?.title || '')
  const [youtubeUrl, setYoutubeUrl] = useState(lesson?.youtube_video_id || '')
  const [order, setOrder] = useState(lesson?.order || 1)
  const [isPreview, setIsPreview] = useState(lesson?.is_preview || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoPreview, setVideoPreview] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleYouTubeUrlChange = (url: string) => {
    setYoutubeUrl(url)
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      setVideoPreview(videoId)
    } else {
      setVideoPreview('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const videoId = extractYouTubeVideoId(youtubeUrl) || youtubeUrl

      if (!videoId) {
        throw new Error('有効なYouTube URLまたはVideo IDを入力してください')
      }

      if (isEdit && lesson) {
        const { error } = await supabase
          .from('lessons')
          .update({
            title,
            youtube_video_id: videoId,
            order,
            is_preview: isPreview,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({
            section_id: sectionId,
            title,
            youtube_video_id: videoId,
            order,
            is_preview: isPreview
          })

        if (error) throw error
      }

      router.push(`/admin/courses/${courseId}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">
            {isEdit ? 'レッスンを編集' : '新しいレッスンを作成'}
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="レッスンタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例: 1-1 ChatGPT入門動画"
            />
            
            <div>
              <Input
                label="YouTube URL または Video ID"
                value={youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                required
                placeholder="例: https://youtube.com/watch?v=dQw4w9WgXcQ または dQw4w9WgXcQ"
              />
              <p className="text-xs text-gray-500 mt-1">
                YouTube動画のURL全体、または11文字のVideo IDを入力してください
              </p>
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="border rounded-lg overflow-hidden">
                <p className="text-sm font-medium text-gray-700 p-3 bg-gray-50">プレビュー:</p>
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoPreview}`}
                    title="YouTube video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            <Input
              label="順序"
              type="number"
              value={order.toString()}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              min="1"
              required
              placeholder="1"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPreview"
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isPreview" className="text-sm font-medium text-gray-700">
                  プレビュー動画として設定
                </label>
              </div>
              <p className="text-xs text-gray-500">
                プレビュー動画は未登録ユーザーでも視聴できます。通常は最初のレッスンを設定します。
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
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
                disabled={loading || !title.trim() || !youtubeUrl.trim()}
                className="flex-1"
              >
                {loading ? '保存中...' : (isEdit ? '更新' : '作成')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}