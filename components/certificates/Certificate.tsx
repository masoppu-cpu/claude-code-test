'use client'

import { useState } from 'react'
import { CertificateData } from '@/lib/certificates'
import Button from '../ui/Button'

interface CertificateProps {
  certificate: CertificateData
  showActions?: boolean
}

export default function Certificate({ certificate, showActions = true }: CertificateProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const downloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // PDF生成のロジック（実際の実装では外部ライブラリを使用）
      const element = document.getElementById(`certificate-${certificate.id}`)
      if (!element) return

      // 簡易的なPDF生成（実際にはjsPDFやhtml2canvasを使用）
      window.print()
    } catch (error) {
      console.error('PDF generation error:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const shareLink = `${window.location.origin}/certificates/verify/${certificate.verification_code}`

  return (
    <div className="bg-white">
      {/* 証明書本体 */}
      <div
        id={`certificate-${certificate.id}`}
        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-12 border-8 border-blue-600 print:border-4 print:p-8"
        style={{ aspectRatio: '4/3', minHeight: '500px' }}
      >
        {/* 装飾的な背景パターン */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* ヘッダー */}
        <div className="relative text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">修了証明書</h1>
          <p className="text-lg text-blue-700">Certificate of Completion</p>
        </div>

        {/* 内容 */}
        <div className="relative text-center space-y-6">
          <div>
            <p className="text-lg text-gray-700 mb-2">これは次のことを証明します</p>
            <p className="text-lg text-gray-600 italic">This certifies that</p>
          </div>

          <div className="border-b-2 border-blue-300 pb-2 mb-6">
            <h2 className="text-3xl font-bold text-blue-900">
              {certificate.user_name}
            </h2>
          </div>

          <div>
            <p className="text-lg text-gray-700 mb-2">以下のコースを修了しました</p>
            <p className="text-sm text-gray-600 italic mb-4">has successfully completed the course</p>
            
            <div className="bg-white/50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">
                {certificate.course_title}
              </h3>
              {certificate.course_description && (
                <p className="text-gray-700 text-sm">
                  {certificate.course_description}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="text-left">
              <p className="text-sm text-gray-600 mb-1">発行日</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatDate(certificate.issued_at)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-32 border-b-2 border-blue-300 mb-2"></div>
              <p className="text-sm text-gray-600">
                AI開発オンライン講座
              </p>
            </div>
          </div>

          {/* 証明書番号と検証コード */}
          <div className="absolute bottom-4 left-4 text-xs text-gray-500">
            <p>証明書番号: {certificate.certificate_number}</p>
            <p>検証コード: {certificate.verification_code}</p>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      {showActions && (
        <div className="mt-6 flex flex-wrap gap-4 justify-center print:hidden">
          <Button
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
            </svg>
            <span>{isGeneratingPDF ? 'PDF生成中...' : 'PDFダウンロード'}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(shareLink)}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>共有リンクをコピー</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>印刷</span>
          </Button>
        </div>
      )}
    </div>
  )
}