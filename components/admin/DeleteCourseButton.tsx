'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

interface DeleteCourseButtonProps {
  courseId: string
  courseName: string
  onDelete: (courseId: string) => Promise<void>
}

export default function DeleteCourseButton({ courseId, courseName, onDelete }: DeleteCourseButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      await onDelete(courseId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete course:', error)
      alert('コースの削除に失敗しました')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        onClick={() => setShowConfirm(true)}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        削除
      </Button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">コースを削除</h3>
                  <p className="text-sm text-gray-600">この操作は取り消せません</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800">
                  「<strong>{courseName}</strong>」を完全に削除しますか？
                </p>
                <p className="text-xs text-red-600 mt-2">
                  このコースに関連するセクション、レッスン、進捗データもすべて削除されます。
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>削除中...</span>
                    </div>
                  ) : (
                    '削除する'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}