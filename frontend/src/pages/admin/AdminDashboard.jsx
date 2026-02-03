import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [companies, setCompanies] = useState([])
  const [admin, setAdmin] = useState(null)
  const [clearing, setClearing] = useState(false)
  
  const token = localStorage.getItem('adminToken')
  const config = { headers: { Authorization: `Bearer ${token}` } }
  
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    
    if (!token) {
      navigate('/admin/login')
      return
    }
    
    if (adminUser) {
      setAdmin(JSON.parse(adminUser))
    }
    
    loadData()
  }, [navigate])
  
  const loadData = async () => {
    try {
      const [statsRes, companiesRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/admin/companies', config)
      ])
      
      setStats(statsRes.data)
      setCompanies(companiesRes.data)
    } catch (err) {
      console.error('Failed to load data:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }
  
  const clearTestData = async () => {
    if (!confirm('Delete all incomplete/test intakes? This cannot be undone.')) {
      return
    }
    
    setClearing(true)
    try {
      const response = await axios.delete('/api/admin/clear-test-data', config)
      alert(`Cleared ${response.data.deletedIntakes} test intakes`)
      loadData() // Refresh stats
    } catch (err) {
      console.error('Failed to clear test data:', err)
      alert(err.response?.data?.error || 'Failed to clear test data')
    } finally {
      setClearing(false)
    }
  }
  
  const clearAllData = async () => {
    if (!confirm('⚠️ DELETE ALL INTAKES? This will remove ALL data including completed submissions. This cannot be undone!')) {
      return
    }
    if (!confirm('Are you absolutely sure? Type YES in the next prompt to confirm.')) {
      return
    }
    const confirmation = prompt('Type YES to confirm deletion of all intake data:')
    if (confirmation !== 'YES') {
      alert('Cancelled')
      return
    }
    
    setClearing(true)
    try {
      const response = await axios.delete('/api/admin/clear-all-data', config)
      alert(`Cleared ${response.data.deletedIntakes} intakes`)
      loadData() // Refresh stats
    } catch (err) {
      console.error('Failed to clear data:', err)
      alert(err.response?.data?.error || 'Failed to clear data')
    } finally {
      setClearing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">BP</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">BondProspects Admin</h1>
              <p className="text-sm text-gray-500">Welcome, {admin?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 mb-1">Total Companies</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.companies.total || 0}</div>
            <div className="text-sm text-green-600">{stats?.companies.active || 0} active</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 mb-1">Total Prospects</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.intakes.total || 0}</div>
            <div className="text-sm text-gray-500">{stats?.intakes.today || 0} today</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">{stats?.intakes.completed || 0}</div>
            <div className="text-sm text-gray-500">{stats?.intakes.conversionRate || 0}% rate</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Link 
              to="/admin/companies/new"
              className="flex flex-col items-center justify-center h-full text-blue-600 hover:text-blue-800"
            >
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Add Company</span>
            </Link>
          </div>
        </div>
        
        {/* Data Management */}
        {admin?.role === 'superadmin' && (stats?.intakes.total > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={clearTestData}
                disabled={clearing}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Clear Test Data'}
              </button>
              <button
                onClick={clearAllData}
                disabled={clearing}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Clear All Data'}
              </button>
              <span className="text-sm text-gray-500 self-center">
                Test Data = incomplete intakes | All Data = everything
              </span>
            </div>
          </div>
        )}
        
        {/* Companies List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
            <Link 
              to="/admin/companies/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Company
            </Link>
          </div>
          
          {companies.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No companies yet</p>
              <Link 
                to="/admin/companies/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Add your first company →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {company.logo ? (
                            <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: company.primaryColor || '#3b82f6' }}
                            >
                              {company.name.charAt(0)}
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.bailbooksCompanyId && (
                              <div className="text-xs text-gray-500">
                                Bailbooks #{company.bailbooksCompanyId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={`https://www.bondprospects.com/${company.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          /{company.slug}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium">{company.stats?.total || 0}</span>
                          <span className="text-gray-500"> total</span>
                        </div>
                        <div className="text-xs text-green-600">
                          {company.stats?.completed || 0} completed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.hasApiKey ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Set
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/companies/${company.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
