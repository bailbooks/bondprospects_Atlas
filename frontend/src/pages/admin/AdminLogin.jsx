import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [isSetup, setIsSetup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const endpoint = isSetup ? '/api/admin/setup' : '/api/admin/login'
      const payload = isSetup 
        ? formData 
        : { email: formData.email, password: formData.password }
      
      const response = await axios.post(endpoint, payload)
      
      // Save token
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminUser', JSON.stringify(response.data.admin))
      
      // Redirect to dashboard
      navigate('/admin/dashboard')
      
    } catch (err) {
      console.error('Login error:', err)
      
      // If login fails with "admin not found" type error, show setup option
      if (err.response?.status === 401 && !isSetup) {
        setError(err.response?.data?.error || 'Invalid credentials')
      } else if (err.response?.status === 403) {
        setError('Admin already exists. Please login.')
        setIsSetup(false)
      } else {
        setError(err.response?.data?.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSetup ? 'Setup Admin Account' : 'Admin Login'}
          </h1>
          <p className="text-gray-500 mt-2">
            BondProspects Administration
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSetup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Gary Casso"
                required={isSetup}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@bailbooks.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
              minLength={isSetup ? 8 : undefined}
            />
            {isSetup && (
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSetup ? 'Creating Account...' : 'Logging In...'}
              </>
            ) : (
              isSetup ? 'Create Admin Account' : 'Login'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSetup(!isSetup)
              setError(null)
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isSetup ? '← Back to Login' : 'First time? Setup Admin Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
