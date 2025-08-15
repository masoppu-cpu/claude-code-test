'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'

interface ProgressButtonProps {
  lessonId: string
  initialCompleted: boolean
  onToggle: (lessonId: string, completed: boolean) => Promise<void>
}

export default function ProgressButton({ 
  lessonId, 
  initialCompleted, 
  onToggle 
}: ProgressButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    setCompleted(initialCompleted)
  }, [initialCompleted])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const newCompleted = !completed
      await onToggle(lessonId, newCompleted)
      setCompleted(newCompleted)
      
      // Show celebration animation when marking as completed
      if (newCompleted) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full"
      >
        <Button
          onClick={handleToggle}
          disabled={loading}
          variant={completed ? 'secondary' : 'primary'}
          className={`w-full relative overflow-hidden transition-all duration-300 ${
            completed 
              ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>更新中...</span>
              </>
            ) : completed ? (
              <>
                <motion.svg 
                  className="w-5 h-5" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </motion.svg>
                <span>完了済み</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>完了にする</span>
              </>
            )}
          </div>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </Button>
      </motion.div>

      {/* Celebration Animation */}
      {showCelebration && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.6,
                repeat: 2
              }}
            >
              🎉
            </motion.div>
            <span className="text-sm font-semibold">レッスン完了！</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}