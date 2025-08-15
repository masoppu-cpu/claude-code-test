'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  percentage: number
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gradient'
  className?: string
  labelPosition?: 'inside' | 'outside'
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gradient: 'bg-gradient-to-r from-blue-500 to-purple-600'
}

export default function ProgressBar({
  percentage,
  height = 'md',
  showLabel = true,
  animated = true,
  color = 'gradient',
  className = '',
  labelPosition = 'outside'
}: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">進捗</span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]} relative overflow-hidden`}>
        <motion.div
          className={`${heightClasses[height]} rounded-full ${colorClasses[color]} relative`}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${Math.max(percentage, 0)}%` }}
          transition={animated ? { duration: 1, ease: "easeInOut" as const } : undefined}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </motion.div>
        
        {showLabel && labelPosition === 'inside' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white drop-shadow-sm">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Milestone markers */}
      <div className="relative mt-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
        
        {/* Achievement badges */}
        {percentage >= 25 && (
          <motion.div
            className="absolute left-1/4 top-2 transform -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-yellow-400 rounded-full border border-yellow-500" />
          </motion.div>
        )}
        
        {percentage >= 50 && (
          <motion.div
            className="absolute left-1/2 top-2 transform -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-orange-400 rounded-full border border-orange-500" />
          </motion.div>
        )}
        
        {percentage >= 75 && (
          <motion.div
            className="absolute left-3/4 top-2 transform -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full border border-blue-500" />
          </motion.div>
        )}
        
        {percentage >= 100 && (
          <motion.div
            className="absolute right-0 top-2 transform translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          >
            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-green-500 flex items-center justify-center">
              <svg className="w-2 h-2 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}