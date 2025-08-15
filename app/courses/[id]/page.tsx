import { createClient } from '@/lib/supabase-server'
import { SectionWithLessons, Lesson } from '@/types/database'
import Link from 'next/link'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import CourseAccessTracker from '@/components/course/CourseAccessTracker'
import LearningPathRecommendations from '@/components/recommendations/LearningPathRecommendations'
import CertificateGenerator from '@/components/certificates/CertificateGenerator'
import ProgressDashboard from '@/components/progress/ProgressDashboard'
import { notFound } from 'next/navigation'

interface CoursePageProps {
  params: Promise<{
    id: string
  }>
}

async function getCourseWithSections(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (courseError || !course) {
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select(`
      *,
      lessons (*)
    `)
    .eq('course_id', id)
    .order('order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError)
    return { course, sections: [], userProgress: [] }
  }

  const sectionsWithLessons: SectionWithLessons[] = (sections || []).map(section => ({
    ...section,
    lessons: section.lessons.sort((a: Lesson, b: Lesson) => a.order - b.order)
  }))

  let userProgress: { lesson_id: string; completed: boolean }[] = []
  if (user) {
    const allLessonIds = sectionsWithLessons.flatMap(section => 
      section.lessons.map(lesson => lesson.id)
    )
    
    if (allLessonIds.length > 0) {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', allLessonIds)
      
      userProgress = progress || []
    }
  }

  return {
    course: { ...course, sections: sectionsWithLessons },
    userProgress
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params
  const result = await getCourseWithSections(id)

  if (!result) {
    notFound()
  }

  const { course, userProgress } = result
  
  // Get user for recommendations
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isLessonCompleted = (lessonId: string) => {
    return userProgress.some(progress => 
      progress.lesson_id === lessonId && progress.completed
    )
  }

  const getTotalLessons = () => {
    return course.sections.reduce((total: number, section: SectionWithLessons) => total + section.lessons.length, 0)
  }

  const getCompletedLessons = () => {
    const allLessonIds = course.sections.flatMap((section: SectionWithLessons) => 
      section.lessons.map((lesson: Lesson) => lesson.id)
    )
    return allLessonIds.filter((lessonId: string) => isLessonCompleted(lessonId)).length
  }

  const totalLessons = getTotalLessons()
  const completedLessons = getCompletedLessons()
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        <CourseAccessTracker courseId={course.id} />
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
              ホーム
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600">{course.title}</span>
          </div>
        </nav>

        {/* Course Header */}
        <header className="mb-12">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                    {course.title}
                  </h1>
                  {course.description && (
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-4xl">
                      {course.description}
                    </p>
                  )}
                </div>
                
                {/* Course metadata badges */}
                <div className="flex flex-col items-end space-y-2 ml-6">
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    約{course.estimated_hours}時間
                  </span>
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
                    {course.difficulty_level === 'beginner' ? '初級' : 
                     course.difficulty_level === 'intermediate' ? '中級' : '上級'}
                  </span>
                </div>
              </div>
              
              {/* Progress Section */}
              {totalLessons > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100/50 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">学習進捗</h3>
                        <p className="text-sm text-gray-600">あなたの学習状況を確認しましょう</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(progressPercentage)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {completedLessons} / {totalLessons} レッスン完了
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.max(progressPercentage, 5)}%` }}
                    ></div>
                  </div>
                  
                  {progressPercentage > 0 && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-600">継続して学習を進めましょう！</span>
                      {progressPercentage >= 100 && (
                        <span className="text-green-600 font-semibold flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          コース完了！おめでとうございます🎉
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Certificate Generation Section */}
              {user && (
                <CertificateGenerator
                  courseId={course.id}
                  courseName={course.title}
                  completionPercentage={Math.round(progressPercentage)}
                  className="mb-6"
                />
              )}
            </div>
          </div>
        </header>

        {/* Curriculum Section */}
        <main>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                カリキュラム
              </h2>
              <p className="text-gray-600">順番に学習して効率的にスキルを身につけましょう</p>
            </div>
            
            {course.sections.length > 0 && (
              <div className="text-sm text-gray-500">
                {course.sections.length} セクション • {totalLessons} レッスン
              </div>
            )}
          </div>

          {course.sections.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                コンテンツは準備中です
              </h3>
              <p className="text-gray-500 text-lg">
                このコースの内容を現在準備しています。しばらくお待ちください。
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {course.sections.map((section: SectionWithLessons, sectionIndex: number) => {
                const sectionCompletedLessons = section.lessons.filter(lesson => 
                  isLessonCompleted(lesson.id)
                ).length
                const sectionProgress = section.lessons.length > 0 
                  ? (sectionCompletedLessons / section.lessons.length) * 100 
                  : 0
                
                return (
                  <Card key={section.id} className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <CardHeader className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold">
                            {sectionIndex + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                              {section.title}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">
                                {section.lessons.length} レッスン
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {sectionCompletedLessons} / {section.lessons.length} 完了
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-700">
                            {Math.round(sectionProgress)}% 完了
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(sectionProgress, 5)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative z-10">
                      {section.lessons.length === 0 ? (
                        <p className="text-gray-500 py-4">このセクションにはレッスンがありません</p>
                      ) : (
                        <ul className="space-y-3">
                          {section.lessons.map((lesson: Lesson) => {
                            const completed = isLessonCompleted(lesson.id)
                            
                            return (
                              <li key={lesson.id}>
                                <Link
                                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                                  className="group/lesson flex items-center justify-between p-4 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-200 border border-gray-100/50"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                      completed 
                                        ? 'bg-green-100 text-green-600 group-hover/lesson:bg-green-200' 
                                        : 'bg-blue-100 text-blue-600 group-hover/lesson:bg-blue-200'
                                    }`}>
                                      {completed ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                                        </svg>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center space-x-3">
                                        <span className={`text-lg font-medium group-hover/lesson:text-blue-700 transition-colors duration-200 ${
                                          completed ? 'text-green-900' : 'text-gray-900'
                                        }`}>
                                          {lesson.title}
                                        </span>
                                        
                                        <div className="flex space-x-2">
                                          {lesson.is_preview && (
                                            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                                              📺 プレビュー
                                            </span>
                                          )}
                                          {completed && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">
                                              ✅ 完了済み
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="text-sm text-gray-500 mt-1">
                                        レッスン {lesson.order}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-blue-600 group-hover/lesson:text-blue-700 transform group-hover/lesson:translate-x-1 transition-all duration-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Detailed Progress Dashboard */}
          {user && (
            <div className="mt-12">
              <ProgressDashboard
                courseId={course.id}
                userId={user.id}
                courseName={course.title}
              />
            </div>
          )}

          {/* Related Courses Recommendations */}
          <div className="mt-12">
            <LearningPathRecommendations
              userId={user?.id || undefined}
              currentCourseId={course.id}
              currentCategoryId={course.category_id}
              limit={3}
            />
          </div>
        </main>
      </div>
    </div>
  )
}