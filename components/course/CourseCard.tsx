import Link from 'next/link'
import Image from 'next/image'
import Card, { CardContent, CardHeader } from '../ui/Card'
import { Course } from '@/types/database'

interface CourseCardProps {
  course: Course
}

function getDifficultyInfo(difficulty: Course['difficulty_level']) {
  switch (difficulty) {
    case 'beginner':
      return { label: '初級', color: 'bg-green-100 text-green-700', icon: '🌱' }
    case 'intermediate':
      return { label: '中級', color: 'bg-yellow-100 text-yellow-700', icon: '⚡' }
    case 'advanced':
      return { label: '上級', color: 'bg-red-100 text-red-700', icon: '🚀' }
    default:
      return { label: '初級', color: 'bg-gray-100 text-gray-700', icon: '📚' }
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  const difficulty = getDifficultyInfo(course.difficulty_level)
  
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          {course.thumbnail_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-t-2xl relative">
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              {/* Difficulty badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficulty.color} backdrop-blur-sm`}>
                  {difficulty.icon} {difficulty.label}
                </span>
              </div>
              
              {/* Duration badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-sm">
                  約{course.estimated_hours}時間
                </span>
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center relative">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              
              {/* Badges for no thumbnail */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficulty.color}`}>
                  {difficulty.icon} {difficulty.label}
                </span>
              </div>
              
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                  約{course.estimated_hours}時間
                </span>
              </div>
            </div>
          )}
          
          <div className="p-6">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">
                {course.title}
              </h3>
            </CardHeader>
            
            {course.description && (
              <CardContent className="p-0 mb-4">
                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            )}
            
            {/* Course metadata */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{course.estimated_hours}時間</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{difficulty.label}</span>
                </div>
              </div>
              
              <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                <span className="text-sm font-semibold">詳細を見る</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}