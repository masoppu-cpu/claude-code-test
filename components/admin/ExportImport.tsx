'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import Button from '../ui/Button'
import Card, { CardContent, CardHeader } from '../ui/Card'

interface ExportImportProps {
  courseId: string
}

export default function ExportImport({ courseId }: ExportImportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const supabase = createClient()

  const exportCourse = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // コース全体の構造を取得
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          sections (
            *,
            lessons (*)
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // セクションとレッスンをソート
      const sortedCourse = {
        ...course,
        sections: course.sections
          .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
          .map((section: { lessons: { order: number }[]; [key: string]: unknown }) => ({
            ...section,
            lessons: section.lessons.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
          }))
      }

      // JSONファイルとしてダウンロード
      const dataStr = JSON.stringify(sortedCourse, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `course-${course.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setSuccess('コースデータをエクスポートしました')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const exportAsCSV = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          sections (
            *,
            lessons (*)
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // CSV形式に変換
      let csvContent = 'コース,セクション,セクション順序,レッスン,レッスン順序,YouTube動画ID,プレビュー\n'
      
      course.sections
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .forEach((section: { title: string; order: number; lessons: { order: number; title: string; youtube_video_id: string; is_preview: boolean }[] }) => {
          section.lessons
            .sort((a, b) => a.order - b.order)
            .forEach((lesson) => {
              csvContent += `"${course.title}","${section.title}",${section.order},"${lesson.title}",${lesson.order},"${lesson.youtube_video_id}","${lesson.is_preview ? 'はい' : 'いいえ'}"\n`
            })
        })

      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(csvBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `course-${course.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setSuccess('コースデータをCSVでエクスポートしました')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'CSVエクスポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">エクスポート機能</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">JSON形式でエクスポート</h4>
            <p className="text-sm text-gray-600 mb-3">
              コース全体の構造をJSON形式でダウンロードします。他のシステムでの再利用に便利です。
            </p>
            <Button
              onClick={exportCourse}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'エクスポート中...' : 'JSONでエクスポート'}
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">CSV形式でエクスポート</h4>
            <p className="text-sm text-gray-600 mb-3">
              レッスン一覧をCSV形式でダウンロードします。Excelなどの表計算ソフトで開けます。
            </p>
            <Button
              onClick={exportAsCSV}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'エクスポート中...' : 'CSVでエクスポート'}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">バックアップについて</h4>
          <p className="text-sm text-gray-600">
            定期的にコースデータをエクスポートしてバックアップを作成することをお勧めします。
            エクスポートしたファイルは安全な場所に保管してください。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}