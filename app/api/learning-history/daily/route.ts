import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json()

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'ユーザーIDと日付が必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ユーザーの認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      )
    }

    // 指定された日の開始と終了時刻を計算
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // 指定日の学習詳細を取得
    const { data: dailyLearning, error } = await supabase
      .from('user_progress')
      .select(`
        completed_at,
        lessons!inner (
          id,
          title,
          sections!inner (
            id,
            title,
            courses!inner (
              id,
              title
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('completed', true)
      .not('completed_at', 'is', null)
      .gte('completed_at', startOfDay.toISOString())
      .lte('completed_at', endOfDay.toISOString())
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('日別学習履歴取得エラー:', error)
      return NextResponse.json(
        { error: '学習履歴の取得に失敗しました' },
        { status: 500 }
      )
    }

    // データを整形
    const formattedData = dailyLearning.map((item: {
      completed_at: string;
      lessons: {
        id: string;
        title: string;
        sections: {
          id: string;
          title: string;
          courses: {
            id: string;
            title: string;
          };
        };
      };
    }) => ({
      lesson_id: item.lessons.id,
      lesson_title: item.lessons.title,
      section_title: item.lessons.sections.title,
      course_id: item.lessons.sections.courses.id,
      course_title: item.lessons.sections.courses.title,
      completed_at: item.completed_at
    }))

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('API エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}