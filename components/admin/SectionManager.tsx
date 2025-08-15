'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { SectionWithLessons } from '@/types/database'

interface SectionManagerProps {
  courseId: string
}

export default function SectionManager({ courseId }: SectionManagerProps) {
  const [sections, setSections] = useState<SectionWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [error, setError] = useState('')
  
  const supabase = createClient()

  const fetchSections = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', courseId)
        .order('order', { ascending: true })

      if (error) throw error
      
      const sectionsWithLessons = (data || []).map(section => ({
        ...section,
        lessons: section.lessons.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      }))
      
      setSections(sectionsWithLessons)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'セクションの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const addSection = async () => {
    if (!newSectionTitle.trim()) return

    setLoading(true)
    try {
      const nextOrder = sections.length + 1
      
      const { error } = await supabase
        .from('sections')
        .insert({
          course_id: courseId,
          title: newSectionTitle.trim(),
          order: nextOrder
        })

      if (error) throw error
      
      setNewSectionTitle('')
      setShowAddForm(false)
      await fetchSections()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'セクションの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('このセクションとすべてのレッスンを削除しますか？')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error
      await fetchSections()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'セクションの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateSectionOrder = async (sectionId: string, newOrder: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sections')
        .update({ order: newOrder })
        .eq('id', sectionId)

      if (error) throw error
      await fetchSections()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'セクションの並び替えに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSections()
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && sections.length === 0) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* セクション一覧 */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {section.order}. {section.title}
              </h3>
              <div className="flex items-center space-x-2">
                <a
                  href={`/admin/sections/${section.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  レッスン管理
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSectionOrder(section.id, section.order - 1)}
                  disabled={section.order === 1 || loading}
                >
                  ↑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSectionOrder(section.id, section.order + 1)}
                  disabled={section.order === sections.length || loading}
                >
                  ↓
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800"
                >
                  削除
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              レッスン数: {section.lessons.length}
            </p>
            
            {section.lessons.length > 0 && (
              <div className="mt-2 space-y-1">
                {section.lessons.map((lesson: { id: string; order: number; title: string; is_preview: boolean }) => (
                  <div key={lesson.id} className="text-xs text-gray-500 pl-4">
                    • {lesson.order}. {lesson.title}
                    {lesson.is_preview && <span className="text-green-600"> (プレビュー)</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 新しいセクション追加 */}
      {showAddForm ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">新しいセクションを追加</h4>
          <div className="space-y-3">
            <Input
              label="セクションタイトル"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="例: 第2章：応用編"
            />
            <div className="flex space-x-2">
              <Button
                onClick={addSection}
                disabled={!newSectionTitle.trim() || loading}
                size="sm"
              >
                追加
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewSectionTitle('')
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
          + 新しいセクションを追加
        </Button>
      )}
    </div>
  )
}