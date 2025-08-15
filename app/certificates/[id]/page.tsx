import { createClient } from '@/lib/supabase-server'
import Certificate from '@/components/certificates/Certificate'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

interface CertificatePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }

  // サーバーサイドで証明書データを取得
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses (title, description),
      user_course_history!inner (updated_at)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !certificate) {
    notFound()
  }

  const certificateData = {
    ...certificate,
    user_name: user.email?.split('@')[0] || 'ユーザー',
    course_title: certificate.courses.title,
    course_description: certificate.courses.description,
    completion_date: certificate.user_course_history.updated_at
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← ダッシュボードに戻る
            </Link>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">修了証明書</h1>
              <p className="text-gray-600 mt-2">
                {certificateData.course_title}の修了証明書
              </p>
            </div>
          </div>
        </div>

        {/* 証明書 */}
        <Certificate certificate={certificateData} />

        {/* 追加情報 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">証明書について</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">証明書の詳細</h3>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-600">証明書番号:</dt>
                  <dd className="font-mono">{certificateData.certificate_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">発行日:</dt>
                  <dd>{new Date(certificateData.issued_at).toLocaleDateString('ja-JP')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">検証コード:</dt>
                  <dd className="font-mono text-xs">{certificateData.verification_code}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">証明書の検証</h3>
              <p className="text-gray-600 text-xs mb-2">
                この証明書の真正性は以下のリンクで確認できます:
              </p>
              <Link 
                href={`/certificates/verify/${certificateData.verification_code}`}
                className="text-blue-600 hover:text-blue-800 text-xs break-all"
              >
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/certificates/verify/${certificateData.verification_code}`}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '修了証明書',
  description: 'コース修了証明書を表示・ダウンロードできます'
}