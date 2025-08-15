import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = true }: CardProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-xl ${hover ? 'hover:shadow-2xl hover:scale-[1.02]' : ''} transition-all duration-300 ease-in-out ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-6 border-b border-gray-100/50 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-6 border-t border-gray-100/50 ${className}`}>
      {children}
    </div>
  )
}