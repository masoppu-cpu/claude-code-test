'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card, { CardContent, CardHeader } from '../ui/Card'
import { useRouter } from 'next/navigation'

interface CourseFormProps {
  course?: {
    id: string
    title: string
    description: string
    thumbnail_url?: string
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
    estimated_hours?: number
    category_id?: string
  }
  isEdit?: boolean
}

export default function CourseForm({ course, isEdit = false }: CourseFormProps) {
  const [title, setTitle] = useState(course?.title || '')
  const [description, setDescription] = useState(course?.description || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || '')
  const [difficultyLevel, setDifficultyLevel] = useState(course?.difficulty_level || 'beginner')
  const [estimatedHours, setEstimatedHours] = useState(course?.estimated_hours || 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEdit && course) {
        const { error } = await supabase
          .from('courses')
          .update({
            title,
            description,
            thumbnail_url: thumbnailUrl || null,
            difficulty_level: difficultyLevel,
            estimated_hours: estimatedHours,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.id)

        if (error) throw error
        router.push('/admin')
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            title,
            description,
            thumbnail_url: thumbnailUrl || null,
            difficulty_level: difficultyLevel,
            estimated_hours: estimatedHours
          })

        if (error) throw error
        router.push('/admin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">
          {isEdit ? 'コースを編集' : '新しいコースを作成'}
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="コースタイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例: AI開発入門コース"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              コース説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="コースの内容について詳しく説明してください"
            />
          </div>
          
          <Input
            label="サムネイル画像URL（オプション）"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              難易度レベル
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>
          
          <Input
            label="推定学習時間（時間）"
            type="number"
            value={estimatedHours.toString()}
            onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
            required
            placeholder="10"
          />

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
  )
}