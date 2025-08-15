import { createClient } from './supabase-server'

export interface ProgressStats {
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  completedSections: number
  totalSections: number
}

export interface LessonProgress {
  lessonId: string
  completed: boolean
  completedAt: string | null
}

export interface SectionProgress {
  sectionId: string
  sectionTitle: string
  lessons: LessonProgress[]
  completedCount: number
  totalCount: number
  progressPercentage: number
}

/**
 * Calculate progress statistics for a course
 */
export async function calculateCourseProgress(
  courseId: string,
  userId?: string
): Promise<ProgressStats> {
  const supabase = await createClient()
  
  // Get all lessons for the course
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      id,
      title,
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  const allLessons = sections?.flatMap(section => section.lessons) || []
  const totalLessons = allLessons.length
  const totalSections = sections?.length || 0

  if (!userId) {
    return {
      totalLessons,
      completedLessons: 0,
      progressPercentage: 0,
      completedSections: 0,
      totalSections
    }
  }

  // Get user progress
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, completed')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', allLessons.map(lesson => lesson.id))

  const completedLessons = userProgress?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Calculate completed sections (sections where all lessons are completed)
  let completedSections = 0
  if (sections && userProgress) {
    const completedLessonIds = new Set(userProgress.map(p => p.lesson_id))
    
    completedSections = sections.filter(section => {
      const sectionLessons = section.lessons || []
      return sectionLessons.length > 0 && 
             sectionLessons.every(lesson => completedLessonIds.has(lesson.id))
    }).length
  }

  return {
    totalLessons,
    completedLessons,
    progressPercentage,
    completedSections,
    totalSections
  }
}

/**
 * Get detailed section progress for a course
 */
export async function getSectionProgress(
  courseId: string,
  userId: string
): Promise<SectionProgress[]> {
  const supabase = await createClient()
  
  // Get all sections with lessons
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      id,
      title,
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (!sections) return []

  // Get all lesson IDs
  const allLessonIds = sections.flatMap(section => 
    section.lessons.map(lesson => lesson.id)
  )

  // Get user progress for all lessons
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, completed, completed_at')
    .eq('user_id', userId)
    .in('lesson_id', allLessonIds)

  const progressMap = new Map(
    userProgress?.map(p => [p.lesson_id, p]) || []
  )

  return sections.map(section => {
    const lessons: LessonProgress[] = section.lessons.map(lesson => {
      const progress = progressMap.get(lesson.id)
      return {
        lessonId: lesson.id,
        completed: progress?.completed || false,
        completedAt: progress?.completed_at || null
      }
    })

    const completedCount = lessons.filter(l => l.completed).length
    const totalCount = lessons.length
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return {
      sectionId: section.id,
      sectionTitle: section.title,
      lessons,
      completedCount,
      totalCount,
      progressPercentage
    }
  })
}

/**
 * Check if a specific lesson is completed by a user
 */
export async function isLessonCompleted(
  lessonId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('completed', true)
    .single()

  return !!data
}

/**
 * Get the next uncompleted lesson in a course
 */
export async function getNextLesson(
  courseId: string,
  userId: string,
  currentLessonId?: string
): Promise<{ sectionId: string; lessonId: string; lessonTitle: string } | null> {
  const supabase = await createClient()
  
  // Get all sections with lessons ordered correctly
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      id,
      title,
      order,
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (!sections) return null

  // Get user progress
  const allLessonIds = sections.flatMap(section => 
    section.lessons.map(lesson => lesson.id)
  )

  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', allLessonIds)

  const completedLessonIds = new Set(userProgress?.map(p => p.lesson_id) || [])

  // Find the next uncompleted lesson
  for (const section of sections) {
    const sortedLessons = section.lessons.sort((a, b) => a.order - b.order)
    
    for (const lesson of sortedLessons) {
      if (!completedLessonIds.has(lesson.id)) {
        // Skip if this is the current lesson (unless it's completed)
        if (currentLessonId && lesson.id === currentLessonId) {
          continue
        }
        
        return {
          sectionId: section.id,
          lessonId: lesson.id,
          lessonTitle: lesson.title
        }
      }
    }
  }

  return null // All lessons completed
}

/**
 * Calculate study time and engagement metrics
 */
export async function getStudyMetrics(
  userId: string,
  courseId?: string,
  timeframeInDays: number = 30
): Promise<{
  totalStudyDays: number
  averageLessonsPerDay: number
  currentStreak: number
  longestStreak: number
}> {
  const supabase = await createClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - timeframeInDays)

  let query = supabase
    .from('user_progress')
    .select(`
      completed_at,
      lessons (
        sections (
          course_id
        )
      )
    `)
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: true })

  if (courseId) {
    // Filter by specific course if provided
    query = query.eq('lessons.sections.course_id', courseId)
  }

  const { data: completedLessons } = await query

  if (!completedLessons || completedLessons.length === 0) {
    return {
      totalStudyDays: 0,
      averageLessonsPerDay: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  }

  // Group by date
  const studyDays = new Map<string, number>()
  completedLessons.forEach(lesson => {
    if (lesson.completed_at) {
      const date = new Date(lesson.completed_at).toDateString()
      studyDays.set(date, (studyDays.get(date) || 0) + 1)
    }
  })

  const totalStudyDays = studyDays.size
  const averageLessonsPerDay = totalStudyDays > 0 ? 
    Math.round((completedLessons.length / totalStudyDays) * 10) / 10 : 0

  // Calculate streaks
  const sortedDates = Array.from(studyDays.keys()).sort()
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i])
    
    if (i === 0) {
      tempStreak = 1
    } else {
      const prevDate = new Date(sortedDates[i - 1])
      const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    
    // Check if this extends to today
    const today = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (sortedDates[i] === today || sortedDates[i] === yesterday.toDateString()) {
      currentStreak = tempStreak
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    totalStudyDays,
    averageLessonsPerDay,
    currentStreak,
    longestStreak
  }
}