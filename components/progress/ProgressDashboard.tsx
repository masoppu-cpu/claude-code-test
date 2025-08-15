import { calculateCourseProgress, getSectionProgress, getStudyMetrics } from '@/lib/progress'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import ProgressIndicator from './ProgressIndicator'
import ProgressBar from './ProgressBar'

interface ProgressDashboardProps {
  courseId: string
  userId: string
  courseName: string
}

export default async function ProgressDashboard({ 
  courseId, 
  userId, 
  courseName 
}: ProgressDashboardProps) {
  const [progressStats, sectionProgress, studyMetrics] = await Promise.all([
    calculateCourseProgress(courseId, userId),
    getSectionProgress(courseId, userId),
    getStudyMetrics(userId, courseId, 30)
  ])

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card className="group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                コース進捗
              </h3>
              <p className="text-sm text-gray-600">{courseName}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Circular Progress */}
            <div className="flex flex-col items-center space-y-4">
              <ProgressIndicator
                percentage={progressStats.progressPercentage}
                size="lg"
                animated
                color="blue"
              />
              <div className="text-center">
                <p className="text-sm text-gray-600">全体進捗</p>
                <p className="text-xs text-gray-500">
                  {progressStats.completedLessons} / {progressStats.totalLessons} レッスン
                </p>
              </div>
            </div>
            
            {/* Progress Stats */}
            <div className="col-span-2 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100/50">
                <ProgressBar
                  percentage={progressStats.progressPercentage}
                  height="lg"
                  animated
                  showLabel={false}
                />
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {progressStats.completedLessons}
                    </div>
                    <div className="text-sm text-gray-600">完了レッスン</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {progressStats.completedSections}
                    </div>
                    <div className="text-sm text-gray-600">完了セクション</div>
                  </div>
                </div>
              </div>
              
              {/* Achievement Badges */}
              <div className="flex flex-wrap gap-2">
                {progressStats.progressPercentage >= 25 && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>スタート</span>
                  </span>
                )}
                
                {progressStats.progressPercentage >= 50 && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586L14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    <span>ハーフウェイ</span>
                  </span>
                )}
                
                {progressStats.progressPercentage >= 100 && (
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>完了</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Progress */}
      <Card className="group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              セクション別進捗
            </h3>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {sectionProgress.map((section, index) => (
              <div key={section.sectionId} className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900">{section.sectionTitle}</h4>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {section.completedCount} / {section.totalCount}
                  </span>
                </div>
                
                <ProgressBar
                  percentage={section.progressPercentage}
                  height="sm"
                  animated
                  color="blue"
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Metrics */}
      <Card className="group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              学習統計 (過去30日)
            </h3>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {studyMetrics.totalStudyDays}
              </div>
              <div className="text-sm text-gray-600">学習日数</div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {studyMetrics.averageLessonsPerDay}
              </div>
              <div className="text-sm text-gray-600">平均レッスン/日</div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {studyMetrics.currentStreak}
              </div>
              <div className="text-sm text-gray-600">現在の連続日数</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {studyMetrics.longestStreak}
              </div>
              <div className="text-sm text-gray-600">最長連続日数</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}