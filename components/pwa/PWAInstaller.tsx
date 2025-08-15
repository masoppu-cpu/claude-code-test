'use client'

import { useEffect, useState } from 'react'
import Button from '../ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Service Worker を登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // PWAとして既に起動されているかチェック
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isStandaloneMode)

    // インストールプロンプトをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // アプリがインストールされた後の処理
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  // PWAとして起動されている場合やインストールボタンが不要な場合は何も表示しない
  if (isStandalone || !showInstallButton) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-semibold mb-1">アプリをインストール</h3>
            <p className="text-xs text-blue-100 mb-3">
              ホーム画面に追加して、いつでも簡単にアクセス
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                インストール
              </Button>
              <Button
                onClick={() => setShowInstallButton(false)}
                size="sm"
                variant="outline"
                className="border-white text-white hover:bg-blue-700"
              >
                後で
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowInstallButton(false)}
            className="flex-shrink-0 text-blue-200 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}