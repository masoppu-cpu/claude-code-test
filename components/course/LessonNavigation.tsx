import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'

interface LessonNavigationProps {
  courseId: string
  currentLessonId: string
  userId?: string
}

// interface NavigationLesson {
//   id: string
//   title: string
//   order: number
//   is_preview: boolean
//   section: {
//     id: string
//     title: string
//     order: number
//   }
// }

async function getNavigationData(courseId: string, currentLessonId: string, userId?: string) {
  const supabase = await createClient()

  // Get all lessons in the course with section info
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      order,
      is_preview,
      sections!inner (
        id,
        title,
        order,
        course_id
      )
    `)
    .eq('sections.course_id', courseId)
    .order('sections.order', { ascending: true })
    .order('order', { ascending: true })

  if (!lessons) return { previousLesson: null, nextLesson: null, allLessons: [] }

  // Get user progress if userId is provided
  let userProgress: { lesson_id: string; completed: boolean }[] = []
  if (userId) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('lesson_id', lessons.map(l => l.id))
    
    userProgress = progress || []
  }

  const sortedLessons = lessons.map(lesson => ({
    ...lesson,
    section: Array.isArray(lesson.sections) ? lesson.sections[0] : lesson.sections,
    completed: userProgress.some(p => p.lesson_id === lesson.id && p.completed)
  }))

  const currentIndex = sortedLessons.findIndex(lesson => lesson.id === currentLessonId)
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

  return {
    previousLesson,
    nextLesson,
    allLessons: sortedLessons,
    currentIndex
  }
}

export default async function LessonNavigation({ courseId, currentLessonId, userId }: LessonNavigationProps) {
  const { previousLesson, nextLesson, allLessons, currentIndex } = await getNavigationData(courseId, currentLessonId, userId)

  return (
    <div className="space-y-6">
      {/* Previous/Next Navigation */}
      <Card className="group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              レッスンナビゲーション
            </h3>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous Lesson */}
            {previousLesson ? (
              <Link 
                href={`/courses/${courseId}/lessons/${previousLesson.id}`}
                className="group/nav bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 p-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover/nav:bg-blue-200 transition-colors duration-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">前のレッスン</p>
                    <p className="font-semibold text-gray-900 group-hover/nav:text-blue-700 transition-colors duration-200 line-clamp-2">
                      {previousLesson.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {previousLesson.section.title}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">前のレッスン</p>
                    <p className="text-gray-400">最初のレッスンです</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Lesson */}
            {nextLesson ? (
              <Link 
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="group/nav bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 p-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-1 text-right">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">次のレッスン</p>
                    <p className="font-semibold text-gray-900 group-hover/nav:text-green-700 transition-colors duration-200 line-clamp-2">
                      {nextLesson.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {nextLesson.section.title}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover/nav:bg-green-200 transition-colors duration-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 text-right">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">次のレッスン</p>
                    <p className="text-gray-400">最後のレッスンです</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Progress Overview */}
      <Card className="group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                コース進捗
              </h3>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">
{(currentIndex ?? 0) + 1} / {allLessons.length} レッスン
              </div>
              <div className="text-xs text-gray-500">
{Math.round((((currentIndex ?? 0) + 1) / allLessons.length) * 100)}% 完了
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {allLessons.map((lesson, index) => {
              const isCurrentLesson = lesson.id === currentLessonId
              const isPrevious = index < (currentIndex ?? 0)
              
              return (
                <Link
                  key={lesson.id}
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isCurrentLesson
                      ? 'bg-blue-100 border border-blue-200'
                      : isPrevious
                      ? 'bg-green-50 hover:bg-green-100 border border-green-100'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    isCurrentLesson
                      ? 'bg-blue-500 text-white'
                      : isPrevious
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isPrevious ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isCurrentLesson ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                      </svg>
                    ) : (
                      lesson.order
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isCurrentLesson
                        ? 'text-blue-900'
                        : isPrevious
                        ? 'text-green-900'
                        : 'text-gray-700'
                    }`}>
                      {lesson.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span>{lesson.section.title}</span>
                      {lesson.is_preview && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          プレビュー
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isCurrentLesson && (
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                      </svg>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}