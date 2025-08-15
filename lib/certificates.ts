import { createClient } from './supabase-client'
import { triggerCertificateGeneratedNotification } from './notifications'

export interface CertificateData {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  issued_at: string
  verification_code: string
  template_design: Record<string, unknown>
  user_name?: string
  course_title?: string
  course_description?: string
  completion_date?: string
}

export async function generateCertificate(courseId: string): Promise<CertificateData | null> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('認証が必要です')

    // コースの完了状況を確認
    const { data: courseHistory } = await supabase
      .from('user_course_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .gte('completion_percentage', 100)
      .single()

    if (!courseHistory) {
      throw new Error('コースが完了していません')
    }

    // 既存の証明書を確認
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existingCert) {
      return existingCert
    }

    // コース情報を取得
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (!course) throw new Error('コースが見つかりません')

    // 証明書番号と検証コードを生成
    const certificateNumber = generateCertificateNumber()
    const verificationCode = generateVerificationCode()

    // 証明書を作成
    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        template_design: {
          theme: 'modern',
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#f59e0b'
          }
        }
      })
      .select()
      .single()

    if (error) throw error

    // 証明書生成通知を送信
    await triggerCertificateGeneratedNotification(user.id, course.title, certificate.id)

    return {
      ...certificate,
      user_name: user.email?.split('@')[0] || 'ユーザー',
      course_title: course.title,
      course_description: course.description,
      completion_date: courseHistory.updated_at
    }

  } catch (error) {
    console.error('Certificate generation error:', error)
    return null
  }
}

export async function getCertificate(certificateId: string): Promise<CertificateData | null> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (title, description),
        user_course_history!inner (updated_at)
      `)
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single()

    if (error || !certificate) return null

    return {
      ...certificate,
      user_name: user.email?.split('@')[0] || 'ユーザー',
      course_title: certificate.courses.title,
      course_description: certificate.courses.description,
      completion_date: certificate.user_course_history.updated_at
    }

  } catch (error) {
    console.error('Get certificate error:', error)
    return null
  }
}

export async function getUserCertificates(): Promise<CertificateData[]> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (title, description),
        user_course_history!inner (updated_at)
      `)
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })

    if (error) throw error

    return (certificates || []).map(cert => ({
      ...cert,
      user_name: user.email?.split('@')[0] || 'ユーザー',
      course_title: cert.courses.title,
      course_description: cert.courses.description,
      completion_date: cert.user_course_history.updated_at
    }))

  } catch (error) {
    console.error('Get user certificates error:', error)
    return []
  }
}

export async function verifyCertificate(verificationCode: string): Promise<CertificateData | null> {
  const supabase = createClient()
  
  try {
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (title, description)
      `)
      .eq('verification_code', verificationCode)
      .single()

    if (error || !certificate) return null

    // ユーザー名を取得（公開情報として）
    const { data: userData } = await supabase.auth.admin.getUserById(certificate.user_id)
    
    return {
      ...certificate,
      user_name: userData.user?.email?.split('@')[0] || 'ユーザー',
      course_title: certificate.courses.title,
      course_description: certificate.courses.description
    }

  } catch (error) {
    console.error('Verify certificate error:', error)
    return null
  }
}

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CERT-${timestamp.slice(-8)}-${random}`
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}