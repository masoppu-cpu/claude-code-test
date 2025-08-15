import { createClient } from './supabase-client'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  read: boolean
  action_url?: string
  created_at: string
  updated_at: string
}

export type NotificationType = 
  | 'course_completion' 
  | 'new_course' 
  | 'certificate_generated' 
  | 'learning_reminder'
  | 'course_recommendation'

export async function createNotification(
  userId: string, 
  type: NotificationType, 
  title: string, 
  message: string, 
  data: Record<string, unknown> = {},
  actionUrl?: string
): Promise<Notification | null> {
  const supabase = createClient()
  
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        action_url: actionUrl
      })
      .select()
      .single()

    if (error) throw error
    return notification
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

export async function getUserNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get notifications error:', error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return false
  }
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Get unread notifications count error:', error)
    return 0
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete notification error:', error)
    return false
  }
}

// 自動通知トリガー関数
export async function triggerCourseCompletionNotification(userId: string, courseName: string, courseId: string) {
  await createNotification(
    userId,
    'course_completion',
    '🎉 コース完了！',
    `「${courseName}」を修了しました。おめでとうございます！`,
    { course_id: courseId, course_name: courseName },
    `/courses/${courseId}`
  )
}

export async function triggerCertificateGeneratedNotification(
  userId: string, 
  courseName: string, 
  certificateId: string
) {
  await createNotification(
    userId,
    'certificate_generated',
    '📜 修了証明書が生成されました',
    `「${courseName}」の修了証明書が発行されました。`,
    { course_name: courseName, certificate_id: certificateId },
    `/certificates/${certificateId}`
  )
}

export async function triggerLearningReminderNotification(userId: string, courseName: string, courseId: string) {
  await createNotification(
    userId,
    'learning_reminder',
    '📚 学習を続けましょう',
    `「${courseName}」の学習を続けませんか？`,
    { course_id: courseId, course_name: courseName },
    `/courses/${courseId}`
  )
}

export async function triggerNewCourseNotification(userId: string, courseName: string, courseId: string) {
  await createNotification(
    userId,
    'new_course',
    '✨ 新しいコースが追加されました',
    `「${courseName}」が新しく追加されました。チェックしてみましょう！`,
    { course_id: courseId, course_name: courseName },
    `/courses/${courseId}`
  )
}

export async function triggerCourseRecommendationNotification(
  userId: string, 
  courseName: string, 
  courseId: string, 
  reason: string
) {
  await createNotification(
    userId,
    'course_recommendation',
    '💡 おすすめのコースがあります',
    `${reason}に基づいて「${courseName}」をおすすめします。`,
    { course_id: courseId, course_name: courseName, reason },
    `/courses/${courseId}`
  )
}