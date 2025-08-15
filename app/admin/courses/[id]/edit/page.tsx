import { checkAdminAccess } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import CourseForm from '@/components/admin/CourseForm'
import SectionManager from '@/components/admin/SectionManager'
import ExportImport from '@/components/admin/ExportImport'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'

interface CourseEditPageProps {
  params: Promise<{
    id: string
  }>
}

async function getCourseData(id: string) {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !course) {
    return null
  }

  return course
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    redirect('/login')
  }

  const { id } = await params
  const course = await getCourseData(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header>
        <nav className="mb-4">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← 管理画面に戻る
          </Link>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          コース編集: {course.title}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* コース基本情報編集 */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">基本情報</h2>
            </CardHeader>
            <CardContent>
              <CourseForm course={course} isEdit={true} />
            </CardContent>
          </Card>
        </div>

        {/* セクション管理 */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">セクション管理</h2>
            </CardHeader>
            <CardContent>
              <SectionManager courseId={course.id} />
            </CardContent>
          </Card>
        </div>

        {/* エクスポート機能 */}
        <div>
          <ExportImport courseId={course.id} />
        </div>
      </div>
    </div>
  )
}