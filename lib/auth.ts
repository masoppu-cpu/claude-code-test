import { createClient } from '@/lib/supabase-server'

export async function checkAdminAccess() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { isAdmin: false, user: null }
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, user_id') // 必要な最小限のカラムのみ
    .eq('user_id', user.id)
    .single()

  return {
    isAdmin: !adminError && admin,
    user
  }
}