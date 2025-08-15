'use client'

import { useEffect } from 'react'
import { updateCourseAccess } from '@/lib/course-progress'

interface CourseAccessTrackerProps {
  courseId: string
  lessonId?: string
}

export default function CourseAccessTracker({ courseId, lessonId }: CourseAccessTrackerProps) {
  useEffect(() => {
    updateCourseAccess(courseId, lessonId)
  }, [courseId, lessonId])

  return null
}