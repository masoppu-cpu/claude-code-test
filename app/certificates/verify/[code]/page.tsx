import { createClient } from '@/lib/supabase-server'
import Certificate from '@/components/certificates/Certificate'

interface VerifyCertificatePageProps {
  params: Promise<{
    code: string
  }>
}

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const { code } = await params
  
  const supabase = await createClient()

  // 検証コードで証明書を検索（公開情報として）
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses (title, description)
    `)
    .eq('verification_code', code)
    .single()

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">証明書が見つかりません</h1>
            <p className="text-gray-600 mb-4">
              指定された検証コードに対応する証明書が存在しないか、無効です。
            </p>
            <p className="text-sm text-gray-500">
              検証コード: <code className="bg-gray-100 px-2 py-1 rounded">{code}</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ユーザー情報を取得（匿名化）
  const userName = certificate.user_id ? `ユーザー${certificate.user_id.slice(-4)}` : 'ユーザー'

  const certificateData = {
    ...certificate,
    user_name: userName,
    course_title: certificate.courses.title,
    course_description: certificate.courses.description
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">証明書の検証</h1>
          <p className="text-gray-600">
            以下の証明書は正当なものであることが確認されました
          </p>
        </div>

        {/* 証明書 */}
        <Certificate certificate={certificateData} showActions={false} />

        {/* 検証情報 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-2a11.962 11.962 0 00-.826-4.5 9.968 9.968 0 00-2.361-3.139m-8.628 13.278A11.988 11.988 0 002.99 10.5 9.968 9.968 0 002.99 10.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">検証済み</h3>
              <p className="text-gray-700 mb-4">
                この証明書は AI開発オンライン講座プラットフォームによって発行された正当な証明書です。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-900">証明書番号</dt>
                  <dd className="text-gray-600 font-mono">{certificate.certificate_number}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">発行日</dt>
                  <dd className="text-gray-600">
                    {new Date(certificate.issued_at).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">検証日時</dt>
                  <dd className="text-gray-600">
                    {new Date().toLocaleDateString('ja-JP')} {new Date().toLocaleTimeString('ja-JP')}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            この検証は AI開発オンライン講座プラットフォーム により提供されています。
          </p>
          <p className="mt-1">
            証明書の詳細について質問がある場合は、発行者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '証明書の検証',
  description: 'コース修了証明書の真正性を検証します'
}