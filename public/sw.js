const CACHE_NAME = 'ai-course-platform-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/courses',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Service Worker インストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// キャッシュからのレスポンス
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにある場合はキャッシュから返す
        if (response) {
          return response
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(
          (response) => {
            // レスポンスが有効でない場合は何もしない
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          }
        )
      })
    )
})

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: '表示'
        },
        {
          action: 'dismiss',
          title: '閉じる'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 通知クリックの処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 既に開いているタブがあるかチェック
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // 新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  }
})