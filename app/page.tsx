import { createClient } from '@/lib/supabase-server'
import CourseCard from '@/components/course/CourseCard'
import { Course } from '@/types/database'
import { Suspense } from 'react'

async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      difficulty_level,
      estimated_hours,
      created_at,
      updated_at,
      sections!inner (
        id,
        lessons (
          id
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(12) // ページネーション: 最初の12件のみ

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }

  return courses || []
}

function CoursesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg animate-pulse">
          <div className="aspect-video w-full bg-gray-200 rounded-t-2xl"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function Home() {
  const courses = await getCourses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <header className="text-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl transform -rotate-6"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-gray-100">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                AI開発オンライン講座
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                YouTubeを活用した実践的なAI開発スキルを身につけましょう。<br />
                初心者から上級者まで、あなたのペースで学習できます。
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>実践的なカリキュラム</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>自分のペースで学習</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>進捗管理機能付き</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Courses Section */}
        <main>
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                  利用可能なコース
                </h2>
                <p className="text-gray-600">あなたに最適なコースを見つけましょう</p>
              </div>
              
              {courses.length > 0 && (
                <div className="text-sm text-gray-500">
                  {courses.length} コース利用可能
                </div>
              )}
            </div>
            
            <Suspense fallback={<CoursesLoading />}>
              {courses.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                    コースは準備中です
                  </h3>
                  <p className="text-gray-500 text-lg mb-6">
                    新しいコースを追加中です。しばらくお待ちください。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </Suspense>
          </section>

          {/* CTA Section */}
          {courses.length > 0 && (
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">
                  今すぐ学習を始めましょう！
                </h3>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  AI開発の基礎から応用まで、体系的に学べるカリキュラムをご用意しています。
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2 text-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>無料で始められます</span>
                  </div>
                  <span className="text-blue-200">•</span>
                  <div className="flex items-center space-x-2 text-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>進捗管理機能付き</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
