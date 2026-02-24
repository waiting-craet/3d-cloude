import { useCallback } from 'react'
import useSWR from 'swr'
import { Notification } from '@/lib/types/homepage-gallery'

interface UseNotificationsOptions {
  userId?: string
  limit?: number
  pollInterval?: number
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('获取通知失败')
  return res.json()
})

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { userId, limit = 10, pollInterval = 30000 } = options

  // 使用 SWR 进行通知数据缓存和轮询
  const { data, error, isLoading, mutate } = useSWR<{ data: NotificationsResponse }>(
    userId ? `/api/gallery/notifications?userId=${userId}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 秒内不重复请求
      refreshInterval: pollInterval, // 定期轮询
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  )

  const notifications = data?.data.notifications || []
  const unreadCount = data?.data.unreadCount || 0

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch('/api/gallery/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId }),
        })

        if (!response.ok) {
          throw new Error('标记通知失败')
        }

        // 重新验证数据
        mutate()
      } catch (err) {
        console.error('标记通知失败:', err)
      }
    },
    [mutate]
  )

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/gallery/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error('标记所有通知失败')
      }

      // 重新验证数据
      mutate()
    } catch (err) {
      console.error('标记所有通知失败:', err)
    }
  }, [mutate])

  return {
    notifications,
    unreadCount,
    isLoading,
    error: error?.message || null,
    markAsRead,
    markAllAsRead,
    refetch: mutate,
  }
}
