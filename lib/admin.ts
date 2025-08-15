import { createClient } from './supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if the current user is an admin (データベースベース)
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }
  
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  return !error && !!admin
}

/**
 * Check if a specific user ID is an admin
 */
export async function isAdminByUserId(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  return !error && !!admin
}

/**
 * Get the current admin user
 */
export async function getAdminUser() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const isUserAdmin = await isAdminByUserId(user.id)
  
  if (!isUserAdmin) {
    return null
  }
  
  return user
}

/**
 * Ensure the current user is an admin, redirect if not
 */
export async function requireAdmin() {
  const adminUser = await getAdminUser()
  
  if (!adminUser) {
    throw new Error('管理者権限が必要です')
  }
  
  return adminUser
}

/**
 * CRUD operations for courses
 */
export class CourseManager {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  static async create() {
    const supabase = await createClient()
    return new CourseManager(supabase)
  }

  async getAllCourses() {
    const { data, error } = await this.supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        difficulty_level,
        estimated_hours,
        created_at,
        sections!inner (
          id,
          title,
          order,
          lessons (
            id,
            title,
            order,
            is_preview
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createCourse(courseData: {
    title: string
    description: string
    thumbnail_url?: string
    difficulty_level: 'beginner' | 'intermediate' | 'advanced'
    estimated_hours: number
    category_id?: string
  }) {
    const { data, error } = await this.supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCourse(courseId: string, courseData: Partial<{
    title: string
    description: string
    thumbnail_url: string
    difficulty_level: 'beginner' | 'intermediate' | 'advanced'
    estimated_hours: number
    category_id: string
  }>) {
    const { data, error } = await this.supabase
      .from('courses')
      .update({ ...courseData, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCourse(courseId: string) {
    // Get section IDs first
    const { data: sections } = await this.supabase
      .from('sections')
      .select('id')
      .eq('course_id', courseId)

    const sectionIds = sections?.map(s => s.id) || []

    if (sectionIds.length > 0) {
      // Get lesson IDs
      const { data: lessons } = await this.supabase
        .from('lessons')
        .select('id')
        .in('section_id', sectionIds)

      const lessonIds = lessons?.map(l => l.id) || []

      if (lessonIds.length > 0) {
        // Delete user progress
        await this.supabase
          .from('user_progress')
          .delete()
          .in('lesson_id', lessonIds)
      }

      // Delete lessons
      await this.supabase
        .from('lessons')
        .delete()
        .in('section_id', sectionIds)
    }

    // Delete user course history
    await this.supabase
      .from('user_course_history')
      .delete()
      .eq('course_id', courseId)

    // Delete sections
    await this.supabase
      .from('sections')
      .delete()
      .eq('course_id', courseId)

    // Finally delete the course
    const { data, error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .select()

    if (error) throw error
    return data
  }
}

/**
 * CRUD operations for sections
 */
export class SectionManager {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  static async create() {
    const supabase = await createClient()
    return new SectionManager(supabase)
  }

  async createSection(sectionData: {
    course_id: string
    title: string
    order: number
  }) {
    const { data, error } = await this.supabase
      .from('sections')
      .insert(sectionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSection(sectionId: string, sectionData: Partial<{
    title: string
    order: number
  }>) {
    const { data, error } = await this.supabase
      .from('sections')
      .update({ ...sectionData, updated_at: new Date().toISOString() })
      .eq('id', sectionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteSection(sectionId: string) {
    // Get lesson IDs first
    const { data: lessons } = await this.supabase
      .from('lessons')
      .select('id')
      .eq('section_id', sectionId)

    const lessonIds = lessons?.map(l => l.id) || []

    if (lessonIds.length > 0) {
      // Delete related progress data
      await this.supabase
        .from('user_progress')
        .delete()
        .in('lesson_id', lessonIds)
    }

    // Delete lessons in this section
    await this.supabase
      .from('lessons')
      .delete()
      .eq('section_id', sectionId)

    // Delete the section
    const { data, error } = await this.supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)
      .select()

    if (error) throw error
    return data
  }

  async getSectionsByCourse(courseId: string) {
    const { data, error } = await this.supabase
      .from('sections')
      .select(`
        id,
        title,
        order,
        course_id,
        lessons (
          id,
          title,
          youtube_video_id,
          order,
          is_preview
        )
      `)
      .eq('course_id', courseId)
      .order('order', { ascending: true })

    if (error) throw error
    return data
  }
}

/**
 * CRUD operations for lessons
 */
export class LessonManager {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  static async create() {
    const supabase = await createClient()
    return new LessonManager(supabase)
  }

  async createLesson(lessonData: {
    section_id: string
    title: string
    youtube_video_id: string
    order: number
    is_preview: boolean
  }) {
    const { data, error } = await this.supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateLesson(lessonId: string, lessonData: Partial<{
    title: string
    youtube_video_id: string
    order: number
    is_preview: boolean
  }>) {
    const { data, error } = await this.supabase
      .from('lessons')
      .update({ ...lessonData, updated_at: new Date().toISOString() })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteLesson(lessonId: string) {
    // Delete related progress data
    await this.supabase
      .from('user_progress')
      .delete()
      .eq('lesson_id', lessonId)

    // Delete the lesson
    const { data, error } = await this.supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .select()

    if (error) throw error
    return data
  }

  async getLessonsBySection(sectionId: string) {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('id, title, youtube_video_id, order, is_preview, section_id')
      .eq('section_id', sectionId)
      .order('order', { ascending: true })

    if (error) throw error
    return data
  }
}

/**
 * Utility function to extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}