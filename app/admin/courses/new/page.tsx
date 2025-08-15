import { checkAdminAccess } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CourseForm from '@/components/admin/CourseForm'

export default async function NewCoursePage() {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="mb-4">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← 管理画面に戻る
          </Link>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          新しいコースを作成
        </h1>
      </header>

      <CourseForm />
    </div>
  )
}