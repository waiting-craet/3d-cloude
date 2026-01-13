'use client'

interface LoadingSpinnerProps {
  message?: string
  submessage?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  message = '正在加载中...', 
  submessage,
  fullScreen = true 
}: LoadingSpinnerProps) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClass}>
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium text-gray-700">{message}</p>
        {submessage && (
          <p className="text-sm text-gray-500 mt-2">{submessage}</p>
        )}
      </div>
    </div>
  )
}
