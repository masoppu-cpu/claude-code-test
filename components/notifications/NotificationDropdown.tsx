'use client'

import { useState, useRef, useEffect } from 'react'
import { Notification } from '@/lib/notifications'
import { 
  useNotifications, 
  useUnreadNotificationsCount, 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification 
} from '@/hooks/useNotifications'
import Link from 'next/link'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // React Query hooks
  const { data: notifications = [], isLoading } = useNotifications(10)
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const deleteNotificationMutation = useDeleteNotification()

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
    
    if (notification.action_url) {
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    markAllAsReadMutation.mutate()
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotificationMutation.mutate(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_completion':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-sm">🎉</span>
          </div>
        )
      case 'certificate_generated':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm">📜</span>
          </div>
        )
      case 'learning_reminder':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-sm">📚</span>
          </div>
        )
      case 'new_course':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
        )
      case 'course_recommendation':
        return (
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm">💡</span>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-14.998-1.5A7.5 7.5 0 010 7.5a7.5 7.5 0 018.5-7.45 7.5 7.5 0 016.5 3.45" />
            </svg>
          </div>
        )
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const notificationDate = new Date(dateString)
    const diffInMs = now.getTime() - notificationDate.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `${diffInDays}日前`
    } else if (diffInHours > 0) {
      return `${diffInHours}時間前`
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes > 0 ? `${diffInMinutes}分前` : 'たった今'
    }
  }


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-14.998-1.5A7.5 7.5 0 010 7.5a7.5 7.5 0 018.5-7.45 7.5 7.5 0 016.5 3.45" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">通知</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  全て既読にする
                </button>
              )}
            </div>
          </div>

          {/* 通知リスト */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3a2 2 0 00-2 2v3a2 2 0 01-2-2v-3M3 13h3a2 2 0 012 2v3a2 2 0 01-2-2v-3" />
                </svg>
                <p>通知はありません</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.action_url ? (
                    <Link href={notification.action_url} className="block">
                      <NotificationContent 
                        notification={notification}
                        onDelete={handleDeleteNotification}
                        formatTimeAgo={formatTimeAgo}
                        getNotificationIcon={getNotificationIcon}
                      />
                    </Link>
                  ) : (
                    <NotificationContent 
                      notification={notification}
                      onDelete={handleDeleteNotification}
                      formatTimeAgo={formatTimeAgo}
                      getNotificationIcon={getNotificationIcon}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                すべての通知を見る
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface NotificationContentProps {
  notification: Notification
  onDelete: (id: string, e: React.MouseEvent) => void
  formatTimeAgo: (date: string) => string
  getNotificationIcon: (type: string) => React.ReactElement
}

function NotificationContent({ 
  notification, 
  onDelete, 
  formatTimeAgo, 
  getNotificationIcon 
}: NotificationContentProps) {
  return (
    <div className="flex items-start space-x-3">
      {getNotificationIcon(notification.type)}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
            {notification.title}
          </h4>
          <div className="flex items-center space-x-2 ml-2">
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <button
              onClick={(e) => onDelete(notification.id, e)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  )
}