import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import YouTubePlayer from '@/components/course/YouTubePlayer'
import ProgressButton from '@/components/course/ProgressButton'
import CourseAccessTracker from '@/components/course/CourseAccessTracker'
import LessonNavigation from '@/components/course/LessonNavigation'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'

interface LessonPageProps {
  params: Promise<{
    id: string
    lessonId: string
  }>
}

async function getLessonData(courseId: string, lessonId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      sections (
        *,
        courses (*)
      )
    `)
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) {
    return null
  }

  if (lesson.sections.courses.id !== courseId) {
    return null
  }

  if (!lesson.is_preview && !user) {
    return { lesson, requiresAuth: true, userProgress: null }
  }

  let userProgress = null
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()
    
    userProgress = progress
  }

  return { lesson, requiresAuth: false, userProgress }
}

async function updateProgress(lessonId: string, completed: boolean) {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('認証が必要です')
  }

  if (completed) {
    await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString()
      })
  } else {
    await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, lessonId } = await params
  const result = await getLessonData(id, lessonId)

  if (!result) {
    notFound()
  }

  const { lesson, requiresAuth, userProgress } = result

  if (requiresAuth) {
    redirect('/login')
  }

  // Get current user for navigation
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        <CourseAccessTracker courseId={lesson.sections.courses.id} lessonId={lesson.id} />
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
              ホーム
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link 
              href={`/courses/${id}`} 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              {lesson.sections.courses.title}
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600">{lesson.title}</span>
          </div>
        </nav>

        {/* Lesson Header */}
        <header className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {lesson.title}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {lesson.sections.title} • レッスン {lesson.order}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {lesson.is_preview && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>プレビュー動画</span>
                  </span>
                )}
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {lesson.youtube_video_id ? 'YouTube動画' : 'コンテンツ'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player Card */}
            <Card className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className="p-0 relative z-10">
                <div className="aspect-video bg-black rounded-t-2xl overflow-hidden relative">
                  <YouTubePlayer 
                    videoId={lesson.youtube_video_id} 
                    title={lesson.title}
                  />
                  
                  {/* Video overlay info */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-white text-sm font-medium">{lesson.title}</span>
                    </div>
                    {lesson.is_preview && (
                      <div className="bg-green-500/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-xs font-semibold">📺 プレビュー</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Description Card */}
            <Card className="group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">レッスン内容</h2>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100/50">
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    このレッスンでは、<span className="font-semibold text-blue-700">{lesson.title}</span>について学習します。
                  </p>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">
                          動画を最後まで視聴したら、右側の<span className="font-semibold text-blue-600">「学習進捗」</span>エリアから「完了にする」ボタンを押して進捗を記録しましょう。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Button */}
            <Card className="group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">学習進捗</h3>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100/50">
                  <ProgressButton
                    lessonId={lesson.id}
                    initialCompleted={userProgress?.completed || false}
                    onToggle={updateProgress}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Lesson Navigation */}
            <LessonNavigation
              courseId={id}
              currentLessonId={lessonId}
              userId={user?.id || undefined}
            />
          </div>
        </main>
      </div>
    </div>
  )
}