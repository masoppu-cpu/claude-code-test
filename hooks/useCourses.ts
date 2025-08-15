import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { CourseWithDetails } from '@/types/database'

const supabase = createClient()

// コース一覧を取得
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<CourseWithDetails[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          course_tags (
            tags (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5分間はデータを新鮮とみなす
  })
}

// 特定のコースを取得
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          course_tags (
            tags (*)
          )
        `)
        .eq('id', courseId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10, // 10分間はデータを新鮮とみなす
  })
}

// コースのセクションとレッスンを取得
export function useCourseSections(courseId: string) {
  return useQuery({
    queryKey: ['course-sections', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', courseId)
        .order('order', { ascending: true })

      if (error) throw error
      return data?.map(section => ({
        ...section,
        lessons: section.lessons.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      })) || []
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10,
  })
}

// ユーザーの進捗を取得
export function useUserProgress(courseId?: string) {
  return useQuery({
    queryKey: ['user-progress', courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const query = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)

      if (courseId) {
        // 特定のコースのレッスンIDを取得してフィルタリング
        const { data: lessons } = await supabase
          .from('lessons')
          .select(`
            id,
            sections!inner (course_id)
          `)
          .eq('sections.course_id', courseId)

        if (lessons) {
          const lessonIds = lessons.map(l => l.id)
          query.in('lesson_id', lessonIds)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 30, // 30秒間はデータを新鮮とみなす
  })
}

// ユーザーのブックマークを取得
export function useUserBookmarks() {
  return useQuery({
    queryKey: ['user-bookmarks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60, // 1分間はデータを新鮮とみなす
  })
}

// ブックマークの切り替え
export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ courseId, isBookmarked }: { courseId: string; isBookmarked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      if (isBookmarked) {
        // ブックマークを削除
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId)

        if (error) throw error
      } else {
        // ブックマークを追加
        const { error } = await supabase
          .from('user_bookmarks')
          .insert({
            user_id: user.id,
            course_id: courseId
          })

        if (error) throw error
      }

      return !isBookmarked
    },
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}