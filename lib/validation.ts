// YouTube動画IDのバリデーション
export function validateYouTubeVideoId(videoId: string): { isValid: boolean; error?: string } {
  if (!videoId || videoId.trim() === '') {
    return { isValid: false, error: 'YouTube動画IDは必須です' }
  }

  // YouTube動画IDの正規表現パターン
  const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/
  
  if (!youtubeRegex.test(videoId.trim())) {
    return { isValid: false, error: '有効なYouTube動画IDを入力してください（11文字の英数字）' }
  }

  return { isValid: true }
}

// YouTube URLから動画IDを抽出
export function extractYouTubeVideoId(url: string): string {
  if (!url) return ''
  
  // 既に動画IDの場合はそのまま返す
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim()
  }

  // YouTube URLから動画IDを抽出
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return url.trim()
}

// コースタイトルのバリデーション
export function validateCourseTitle(title: string): { isValid: boolean; error?: string } {
  if (!title || title.trim() === '') {
    return { isValid: false, error: 'コースタイトルは必須です' }
  }

  if (title.trim().length < 3) {
    return { isValid: false, error: 'コースタイトルは3文字以上で入力してください' }
  }

  if (title.trim().length > 100) {
    return { isValid: false, error: 'コースタイトルは100文字以内で入力してください' }
  }

  return { isValid: true }
}

// セクションタイトルのバリデーション
export function validateSectionTitle(title: string): { isValid: boolean; error?: string } {
  if (!title || title.trim() === '') {
    return { isValid: false, error: 'セクションタイトルは必須です' }
  }

  if (title.trim().length < 2) {
    return { isValid: false, error: 'セクションタイトルは2文字以上で入力してください' }
  }

  if (title.trim().length > 80) {
    return { isValid: false, error: 'セクションタイトルは80文字以内で入力してください' }
  }

  return { isValid: true }
}

// レッスンタイトルのバリデーション
export function validateLessonTitle(title: string): { isValid: boolean; error?: string } {
  if (!title || title.trim() === '') {
    return { isValid: false, error: 'レッスンタイトルは必須です' }
  }

  if (title.trim().length < 2) {
    return { isValid: false, error: 'レッスンタイトルは2文字以上で入力してください' }
  }

  if (title.trim().length > 80) {
    return { isValid: false, error: 'レッスンタイトルは80文字以内で入力してください' }
  }

  return { isValid: true }
}

// URLのバリデーション
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { isValid: true } // URLは任意
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: '有効なURLを入力してください' }
  }
}

// 複合バリデーション
export function validateCourseForm(data: {
  title: string
  description?: string
  thumbnail_url?: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const titleValidation = validateCourseTitle(data.title)
  if (!titleValidation.isValid && titleValidation.error) {
    errors.title = titleValidation.error
  }

  if (data.description && data.description.length > 500) {
    errors.description = '説明文は500文字以内で入力してください'
  }

  if (data.thumbnail_url) {
    const urlValidation = validateUrl(data.thumbnail_url)
    if (!urlValidation.isValid && urlValidation.error) {
      errors.thumbnail_url = urlValidation.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateLessonForm(data: {
  title: string
  youtube_video_id: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const titleValidation = validateLessonTitle(data.title)
  if (!titleValidation.isValid && titleValidation.error) {
    errors.title = titleValidation.error
  }

  const videoIdValidation = validateYouTubeVideoId(data.youtube_video_id)
  if (!videoIdValidation.isValid && videoIdValidation.error) {
    errors.youtube_video_id = videoIdValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}