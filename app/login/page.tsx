import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI開発オンライン講座
          </h1>
          <p className="text-gray-600">
            アカウントにログインしてレッスンを続けましょう
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800">
              こちらからサインアップ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}