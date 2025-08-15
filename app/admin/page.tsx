import { checkAdminAccess } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

async function getAdminData() {
  const supabase = await createClient()
  
  const [coursesResult, sectionsResult, lessonsResult, usersResult, completedResult] = await Promise.all([
    // 管理画面では必要最小限のカラムのみ取得
    supabase.from('courses').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('sections').select('id, course_id').limit(1000), // 統計用のみ
    supabase.from('lessons').select('id, section_id, is_preview').limit(1000), // 統計用のみ
    // 最近の進捗は最適化されたクエリで取得
    supabase.from('user_progress').select(`
      id,
      created_at,
      completed_at,
      lessons!inner (
        title,
        sections!inner (
          title,
          courses!inner (title)
        )
      )
    `).eq('completed', true).order('completed_at', { ascending: false }).limit(5),
    // 完了済みレッスン数のカウント用
    supabase.from('user_progress').select('id', { count: 'exact' }).eq('completed', true)
  ])

  return {
    courses: coursesResult.data || [],
    sections: sectionsResult.data || [],
    lessons: lessonsResult.data || [],
    recentProgress: usersResult.data || [],
    completedLessons: completedResult.data || [],
    completedCount: completedResult.count || 0
  }
}

export default async function AdminPage() {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    redirect('/login')
  }

  const { courses, sections, lessons, recentProgress, completedLessons } = await getAdminData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <header className="mb-12">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                    管理者ダッシュボード
                  </h1>
                  <p className="text-lg text-gray-600">
                    コースやレッスンを管理し、学習プラットフォームを最適化しましょう
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総コース数</p>
                  <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総セクション数</p>
                  <p className="text-3xl font-bold text-purple-600">{sections.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総レッスン数</p>
                  <p className="text-3xl font-bold text-orange-600">{lessons.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">完了済み学習</p>
                  <p className="text-3xl font-bold text-green-600">{completedLessons.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">クイックアクション</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/courses/new">
              <Button className="w-full">
                新しいコースを作成
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" className="w-full">
                統計レポート表示
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">コンテンツ統計</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>平均セクション/コース:</span>
                <span className="font-medium">
                  {courses.length > 0 ? (sections.length / courses.length).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>平均レッスン/セクション:</span>
                <span className="font-medium">
                  {sections.length > 0 ? (lessons.length / sections.length).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>プレビュー動画:</span>
                <span className="font-medium">
                  {lessons.filter(lesson => lesson.is_preview).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">学習進捗</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>完了率:</span>
                <span className="font-medium">
                  {lessons.length > 0 ? 
                    `${((completedLessons.length / lessons.length) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: lessons.length > 0 ? 
                      `${(completedLessons.length / lessons.length) * 100}%` : 
                      '0%' 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {completedLessons.length} / {lessons.length} レッスン完了
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-xl font-semibold">コース管理</h3>
            <Link href="/admin/courses">
              <Button variant="outline" size="sm">
                すべて表示
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-gray-500">まだコースがありません</p>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-600">
                        作成日: {new Date(course.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm">
                          表示
                        </Button>
                      </Link>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">
                          編集
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">最近の学習進捗</h3>
          </CardHeader>
          <CardContent>
            {recentProgress.length === 0 ? (
              <p className="text-gray-500">まだ学習進捗がありません</p>
            ) : (
              <div className="space-y-3">
                {recentProgress.slice(0, 5).map((progress) => (
                  <div key={progress.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">
                      {'レッスン完了'}
                    </p>
                    <p className="text-xs text-gray-600">
                      学習進捗が記録されました
                    </p>
                    <p className="text-xs text-gray-500">
                      完了日: {new Date(progress.completed_at || progress.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}