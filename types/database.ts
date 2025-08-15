export interface Course {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  category_id?: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface CourseTag {
  id: string
  course_id: string
  tag_id: string
  created_at: string
}

export interface UserBookmark {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

export interface UserCourseHistory {
  id: string
  user_id: string
  course_id: string
  last_accessed_at: string
  last_lesson_id?: string
  completion_percentage: number
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  course_id: string
  title: string
  order: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  section_id: string
  title: string
  youtube_video_id: string
  order: number
  is_preview: boolean
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface Admin {
  id: string
  user_id: string
  email: string
  created_at: string
}

export interface CourseWithSections extends Course {
  sections: SectionWithLessons[]
}

export interface CourseWithDetails extends Course {
  categories?: Category
  course_tags?: { tags: Tag }[]
}

export interface SectionWithLessons extends Section {
  lessons: Lesson[]
}