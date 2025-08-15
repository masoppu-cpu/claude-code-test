'use client'

import { useState } from 'react'
import { generateCertificate, CertificateData } from '@/lib/certificates'
import Button from '../ui/Button'
import Link from 'next/link'

interface CertificateGeneratorProps {
  courseId: string
  courseName: string
  completionPercentage: number
  className?: string
}

export default function CertificateGenerator({ 
  courseId, 
  courseName, 
  completionPercentage,
  className = ''
}: CertificateGeneratorProps) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerateCertificate = async () => {
    if (completionPercentage < 100) {
      setError('コースを完了してから証明書を生成してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cert = await generateCertificate(courseId)
      if (cert) {
        setCertificate(cert)
      } else {
        setError('証明書の生成に失敗しました')
      }
    } catch (err) {
      setError('証明書の生成中にエラーが発生しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (completionPercentage < 100) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 17.333 3.924 19 5.464 19z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">証明書を取得するには</p>
            <p className="text-sm text-yellow-700">
              「{courseName}」を100%完了してください（現在{completionPercentage}%）
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (certificate) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">🎉 おめでとうございます！</h3>
              <p className="text-sm text-green-700 mb-2">
                「{courseName}」の修了証明書が生成されました
              </p>
              <p className="text-xs text-green-600">
                証明書番号: {certificate.certificate_number}
              </p>
            </div>
          </div>
          <Link href={`/certificates/${certificate.id}`}>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              証明書を表示
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">修了証明書を取得</h3>
            <p className="text-sm text-blue-700">
              「{courseName}」の正式な修了証明書を生成できます
            </p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateCertificate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>生成中...</span>
            </div>
          ) : (
            '証明書を生成'
          )}
        </Button>
      </div>
    </div>
  )
}