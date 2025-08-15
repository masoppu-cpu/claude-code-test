import { checkAdminAccess } from '@/lib/auth'
import { CourseManager } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DeleteCourseButton from '@/components/admin/DeleteCourseButton'

async function deleteCourse(courseId: string) {
  'use server'
  
  const { isAdmin } = await checkAdminAccess()
  if (!isAdmin) {
    throw new Error('管理者権限が必要です')
  }

  const courseManager = await CourseManager.create()
  await courseManager.deleteCourse(courseId)
  revalidatePath('/admin/courses')
}

export default async function CoursesPage() {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    redirect('/login')
  }

  const courseManager = await CourseManager.create()
  const courses = await courseManager.getAllCourses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <nav className="mb-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
              ← 管理画面に戻る
            </Link>
          </nav>
          
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                  コース管理
                </h1>
                <p className="text-lg text-gray-600">
                  すべてのコースを管理し、編集・削除することができます
                </p>
              </div>
              
              <Link href="/admin/courses/new">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新規コース作成
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Courses Grid */}
        <div className="space-y-6">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  まだコースがありません
                </h3>
                <p className="text-gray-500 mb-6">
                  最初のコースを作成して学習プラットフォームを構築しましょう
                </p>
                <Link href="/admin/courses/new">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    新規コース作成
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {courses.map((course) => {
                const totalSections = course.sections?.length || 0
                const totalLessons = course.sections?.reduce((sum: number, section: { lessons?: unknown[] }) => 
                  sum + (section.lessons?.length || 0), 0) || 0

                return (
                  <Card key={course.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                                {course.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                {course.description}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  <span>{totalSections} セクション</span>
                                </span>
                                
                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H20" />
                                  </svg>
                                  <span>{totalLessons} レッスン</span>
                                </span>
                                
                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{course.estimated_hours || 1}時間</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              course.difficulty_level === 'beginner' 
                                ? 'bg-green-100 text-green-700'
                                : course.difficulty_level === 'intermediate'
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {course.difficulty_level === 'beginner' ? '初級' :
                               course.difficulty_level === 'intermediate' ? '中級' : '上級'}
                            </span>
                            
                            <span className="text-xs text-gray-500">
                              作成日: {new Date(course.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          <Link href={`/courses/${course.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              表示
                            </Button>
                          </Link>
                          
                          <Link href={`/admin/courses/${course.id}/edit`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              編集
                            </Button>
                          </Link>
                          
                          <DeleteCourseButton courseId={course.id} courseName={course.title} onDelete={deleteCourse} />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}