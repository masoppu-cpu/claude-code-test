'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface YouTubePlayerProps {
  videoId: string
  title: string
  onProgressUpdate?: (currentTime: number, duration: number) => void
  onVideoEnd?: () => void
}

interface YouTubePlayerInstance {
  playVideo: () => void
  pauseVideo: () => void
  setPlaybackRate: (rate: number) => void
  getPlaybackRate: () => number
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  addEventListener: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: {
      Player: new (elementId: string, config: unknown) => YouTubePlayerInstance
      PlayerState: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
  }
}

export default function YouTubePlayer({ videoId, onProgressUpdate, onVideoEnd }: YouTubePlayerProps) {
  const [isApiReady, setIsApiReady] = useState(false)
  const [player, setPlayer] = useState<YouTubePlayerInstance | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true)
      }
    } else {
      setIsApiReady(true)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startProgressTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    intervalRef.current = setInterval(() => {
      if (player) {
        const current = player.getCurrentTime()
        const total = player.getDuration()
        setCurrentTime(current)
        setDuration(total)
        onProgressUpdate?.(current, total)
      }
    }, 1000)
  }, [player, onProgressUpdate])

  useEffect(() => {
    if (isApiReady && playerRef.current && !player) {
      // Create a unique div for the player - XSS対策
      const playerId = `youtube-player-${videoId.replace(/[^a-zA-Z0-9_-]/g, '')}`
      
      // innerHTML の代わりに DOM 操作を使用してXSS攻撃を防止
      const playerContainer = document.createElement('div')
      playerContainer.id = playerId
      playerRef.current.innerHTML = ''
      playerRef.current.appendChild(playerContainer)
      
      const ytPlayer = new window.YT.Player(playerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 0,
          fs: 1,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: () => {
            setDuration(ytPlayer.getDuration())
            setPlaybackRate(ytPlayer.getPlaybackRate())
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgressTracking()
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              stopProgressTracking()
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              stopProgressTracking()
              onVideoEnd?.()
            }
          }
        }
      })
      
      setPlayer(ytPlayer)
    }
  }, [isApiReady, videoId, player, onVideoEnd, startProgressTracking])

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const togglePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (player) {
      player.setPlaybackRate(rate)
      setPlaybackRate(rate)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!isApiReady) {
    return (
      <div className="aspect-video w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">動画を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative aspect-video w-full bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div ref={playerRef} className="w-full h-full" />
      
      {/* カスタムコントロール */}
      <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* 進捗バー */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="w-full bg-gray-600 h-1 rounded-full">
            <div 
              className="bg-red-600 h-1 rounded-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* コントロールバー */}
        <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              {/* 再生/一時停止ボタン */}
              <button
                onClick={togglePlayPause}
                className="hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m7 4 10 6-10 6V4z" />
                  </svg>
                )}
              </button>

              {/* 時間表示 */}
              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 再生速度コントロール */}
              <div className="relative group/speed">
                <button className="hover:bg-white/20 rounded px-3 py-1 text-sm transition-colors">
                  {playbackRate}x
                </button>
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 opacity-0 group-hover/speed:opacity-100 transition-opacity">
                  <div className="flex flex-col space-y-1 min-w-[80px]">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          playbackRate === rate
                            ? 'bg-red-600 text-white'
                            : 'hover:bg-white/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* フルスクリーンボタン */}
              <button
                onClick={() => {
                  const iframe = playerRef.current?.querySelector('iframe')
                  if (iframe) {
                    iframe.requestFullscreen?.()
                  }
                }}
                className="hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 中央の再生ボタン（一時停止時） */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="bg-red-600 hover:bg-red-700 rounded-full p-4 text-white transition-colors"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6-10 6V4z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}