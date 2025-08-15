import { createClient } from './supabase-client'
import { triggerCourseCompletionNotification } from './notifications'

export async function updateCourseAccess(courseId: string, lessonId?: string) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 既存の履歴を確認
    const { data: existingHistory } = await supabase
      .from('user_course_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existingHistory) {
      // 既存の履歴を更新
      await supabase
        .from('user_course_history')
        .update({
          last_accessed_at: new Date().toISOString(),
          last_lesson_id: lessonId || existingHistory.last_lesson_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHistory.id)
    } else {
      // 新しい履歴を作成
      await supabase
        .from('user_course_history')
        .insert({
          user_id: user.id,
          course_id: courseId,
          last_accessed_at: new Date().toISOString(),
          last_lesson_id: lessonId,
          completion_percentage: 0
        })
    }
  } catch (error) {
    console.error('Error updating course access:', error)
  }
}

export async function updateLessonProgress(lessonId: string, completed: boolean) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // レッスンの進捗を更新
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()

    if (existingProgress) {
      await supabase
        .from('user_progress')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', existingProgress.id)
    } else {
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
    }

    // コース全体の進捗を再計算
    await updateCourseCompletionPercentage(lessonId)
  } catch (error) {
    console.error('Error updating lesson progress:', error)
  }
}

async function updateCourseCompletionPercentage(lessonId: string) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // レッスンからセクションとコースを取得
    const { data: lesson } = await supabase
      .from('lessons')
      .select(`
        *,
        sections!inner (
          *,
          courses!inner (*)
        )
      `)
      .eq('id', lessonId)
      .single()

    if (!lesson) return

    const courseId = lesson.sections.course_id

    // コースの全レッスン数を取得
    const { data: allLessons } = await supabase
      .from('lessons')
      .select(`
        id,
        sections!inner (course_id)
      `)
      .eq('sections.course_id', courseId)

    if (!allLessons) return

    // ユーザーの完了レッスン数を取得
    const { data: completedLessons } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', allLessons.map(l => l.id))

    const totalLessons = allLessons.length
    const completedCount = completedLessons?.length || 0
    const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    // コース履歴の進捗を更新
    await supabase
      .from('user_course_history')
      .update({
        completion_percentage: completionPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    // コース完了時に通知を送信
    if (completionPercentage === 100) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (courseData) {
        await triggerCourseCompletionNotification(user.id, courseData.title, courseId)
      }
    }
  } catch (error) {
    console.error('Error updating course completion percentage:', error)
  }
}