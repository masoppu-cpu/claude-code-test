import { checkAdminAccess } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import LessonManager from '@/components/admin/LessonManager'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'

interface SectionPageProps {
  params: Promise<{
    id: string
  }>
}

async function getSectionData(id: string) {
  const supabase = await createClient()
  
  const { data: section, error } = await supabase
    .from('sections')
    .select(`
      *,
      courses (*)
    `)
    .eq('id', id)
    .single()

  if (error || !section) {
    return null
  }

  return section
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    redirect('/login')
  }

  const { id } = await params
  const section = await getSectionData(id)

  if (!section) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="mb-4">
          <Link 
            href={`/admin/courses/${section.courses.id}/edit`} 
            className="text-blue-600 hover:text-blue-800"
          >
            ← {section.courses.title} に戻る
          </Link>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {section.title}
        </h1>
        <p className="text-gray-600">
          コース: {section.courses.title}
        </p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">レッスン管理</h2>
        </CardHeader>
        <CardContent>
          <LessonManager sectionId={section.id} />
        </CardContent>
      </Card>
    </div>
  )
}