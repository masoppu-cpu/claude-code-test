import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getUserNotifications, 
  getUnreadNotificationsCount, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification 
} from '@/lib/notifications'

// 通知一覧を取得
export function useNotifications(limit: number = 20) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => getUserNotifications(limit),
    staleTime: 1000 * 30, // 30秒間はデータを新鮮とみなす
    refetchInterval: 1000 * 60, // 1分ごとに自動更新
  })
}

// 未読通知数を取得
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: getUnreadNotificationsCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

// 通知を既読にする
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// すべての通知を既読にする
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// 通知を削除する
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}