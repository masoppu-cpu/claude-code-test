import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
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

    // 学習履歴を取得（過去1年間）
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: learningHistory, error } = await supabase
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
      .gte('completed_at', oneYearAgo.toISOString())
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('学習履歴取得エラー:', error)
      return NextResponse.json(
        { error: '学習履歴の取得に失敗しました' },
        { status: 500 }
      )
    }

    // データを整形
    const formattedData = learningHistory.map((item: {
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
      completed_at: item.completed_at,
      lesson_id: item.lessons.id,
      lesson_title: item.lessons.title,
      section_title: item.lessons.sections.title,
      course_id: item.lessons.sections.courses.id,
      course_title: item.lessons.sections.courses.title
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

// GET メソッドでも学習履歴を取得できるようにする（クエリパラメータ使用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
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

    // 学習統計を取得
    const { data: stats, error: statsError } = await supabase
      .from('user_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .not('completed_at', 'is', null)

    if (statsError) {
      console.error('統計取得エラー:', statsError)
      return NextResponse.json(
        { error: '統計データの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 日別の学習統計を計算
    const dailyStats = new Map<string, number>()
    stats.forEach((item: { completed_at: string }) => {
      if (item.completed_at) {
        const date = new Date(item.completed_at).toDateString()
        dailyStats.set(date, (dailyStats.get(date) || 0) + 1)
      }
    })

    // 連続学習日数を計算
    const today = new Date()
    let currentStreak = 0
    const checkDate = new Date(today)
    
    while (true) {
      const dateKey = checkDate.toDateString()
      if (dailyStats.has(dateKey)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    const statisticsData = {
      totalStudyDays: dailyStats.size,
      totalLessons: stats.length,
      currentStreak,
      dailyLessonCounts: Object.fromEntries(dailyStats)
    }

    return NextResponse.json(statisticsData)

  } catch (error) {
    console.error('API エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}