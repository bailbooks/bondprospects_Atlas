import { Clock } from 'lucide-react'

export default function ExpiredLink() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Link Expired
        </h1>
        
        <p className="text-gray-600 mb-6">
          This form link has expired. Please contact your bail bond agent 
          to request a new link.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          <p>
            Form links are valid for 7 days for security purposes. 
            If you need to complete your application, please reach out 
            to your bail bond agent for a new link.
          </p>
        </div>
      </div>
    </div>
  )
}
