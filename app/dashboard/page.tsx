import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserDashboard from '@/components/dashboard/UserDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserDashboard user={user} />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'ダッシュボード | オンライン学習プラットフォーム',
  description: '学習進捗とコース管理のダッシュボード'
}