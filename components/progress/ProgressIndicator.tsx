'use client'

import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-20 h-20'
}

const strokeWidthMap = {
  sm: 4,
  md: 6,
  lg: 8
}

const colorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  orange: 'text-orange-500'
}

export default function ProgressIndicator({
  percentage,
  size = 'md',
  showLabel = true,
  animated = true,
  color = 'blue',
  className = ''
}: ProgressIndicatorProps) {
  const radius = 45
  const strokeWidth = strokeWidthMap[size]
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        className="w-full h-full transform -rotate-90"
        width="100"
        height="100"
      >
        {/* Background circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={normalizedRadius}
          cx="50"
          cy="50"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={animated ? strokeDashoffset : circumference - (percentage / 100) * circumference}
          r={normalizedRadius}
          cx="50"
          cy="50"
          className={`${colorClasses[color]} transition-colors duration-300`}
          strokeLinecap="round"
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={animated ? { strokeDashoffset } : false}
          transition={animated ? { duration: 1, ease: "easeInOut" } : undefined}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${
            size === 'sm' ? 'text-xs' : 
            size === 'md' ? 'text-sm' : 
            'text-base'
          } ${colorClasses[color]}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}