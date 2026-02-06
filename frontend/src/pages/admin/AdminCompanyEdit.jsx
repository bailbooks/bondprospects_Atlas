import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function AdminCompanyEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'
  
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [apiKey, setApiKey] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  
  const [company, setCompany] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    logo: '',
    primaryColor: '#3b82f6',
    bailbooksCompanyId: '',
    wizardType: 'medium',
    isActive: true
  })
  
  const token = localStorage.getItem('adminToken')
  const config = { headers: { Authorization: `Bearer ${token}` } }
  
  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    
    if (!isNew) {
      loadCompany()
    }
  }, [id, token, navigate, isNew])
  
  const loadCompany = async () => {
    try {
      const response = await axios.get(`/api/admin/companies/${id}`, config)
      const data = response.data
      setCompany({
        name: data.name || '',
        slug: data.slug || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        logo: data.logo || '',
        primaryColor: data.primaryColor || '#3b82f6',
        bailbooksCompanyId: data.bailbooksCompanyId || '',
        wizardType: data.wizardType || 'medium',
        isActive: data.isActive
      })
      if (data.apiKeyMasked) {
        setApiKey({ masked: data.apiKeyMasked, createdAt: data.apiKeyCreatedAt })
      }
    } catch (err) {
      console.error('Failed to load company:', err)
      setError('Failed to load company')
    } finally {
      setLoading(false)
    }
  }
  
  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }
    
    setCheckingSlug(true)
    try {
      const response = await axios.get(`/api/admin/check-slug/${slug}`, config)
      setSlugAvailable(response.data)
    } catch (err) {
      console.error('Slug check failed:', err)
    } finally {
      setCheckingSlug(false)
    }
  }
  
  const handleSlugChange = (value) => {
    // Clean slug: lowercase, replace spaces with hyphens, remove special chars
    const cleanSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    setCompany({ ...company, slug: cleanSlug })
    
    // Debounce check
    clearTimeout(window.slugCheckTimeout)
    window.slugCheckTimeout = setTimeout(() => {
      if (!isNew || cleanSlug !== company.slug) {
        checkSlugAvailability(cleanSlug)
      }
    }, 500)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (isNew) {
        console.log('Creating new company:', company)
        const response = await axios.post('/api/admin/companies', company, config)
        console.log('Create response:', response.data)
        const newId = response.data.id
        if (newId) {
          setSuccess('Company created successfully!')
          setTimeout(() => {
            navigate('/admin/dashboard')
          }, 500)
        } else {
          setError('Company created but ID not returned')
        }
      } else {
        await axios.put(`/api/admin/companies/${id}`, company, config)
        setSuccess('Company updated successfully!')
        setTimeout(() => {
          navigate('/admin/dashboard')
        }, 500)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setError(err.response?.data?.error || 'Failed to save company')
    } finally {
      setSaving(false)
    }
  }
  
  const generateApiKey = async () => {
    if (!confirm('Generate a new API key? This will invalidate any existing key.')) {
      return
    }
    
    try {
      const response = await axios.post(`/api/admin/companies/${id}/api-key`, {}, config)
      setApiKey({ 
        full: response.data.apiKey, 
        createdAt: response.data.createdAt 
      })
      setShowApiKey(true)
      setSuccess('API key generated! Copy it now - it will only be shown once.')
    } catch (err) {
      console.error('API key generation failed:', err)
      setError('Failed to generate API key')
    }
  }
  
  const revokeApiKey = async () => {
    if (!confirm('Revoke API key? This company will no longer be able to authenticate.')) {
      return
    }
    
    try {
      await axios.delete(`/api/admin/companies/${id}/api-key`, config)
      setApiKey(null)
      setShowApiKey(false)
      setSuccess('API key revoked')
    } catch (err) {
      console.error('API key revoke failed:', err)
      setError('Failed to revoke API key')
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(null), 2000)
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <h1 className="font-bold text-gray-900">
              {isNew ? 'Add New Company' : 'Edit Company'}
            </h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="A Better Bail Bonds"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug * 
                  <span className="text-gray-500 font-normal ml-2">
                    bondprospects.com/<span className="text-blue-600">{company.slug || 'your-company'}</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={company.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      slugAvailable?.available === false ? 'border-red-300' : 
                      slugAvailable?.available === true ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="abetterbailbonds"
                    required
                  />
                  {checkingSlug && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {slugAvailable && (
                  <p className={`text-sm mt-1 ${slugAvailable.available ? 'text-green-600' : 'text-red-600'}`}>
                    {slugAvailable.available ? '✓ This URL is available' : `✗ ${slugAvailable.reason}`}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Denver"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CO"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    value={company.zip}
                    onChange={(e) => setCompany({ ...company, zip: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80202"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Branding */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={company.logo}
                  onChange={(e) => setCompany({ ...company, logo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={company.primaryColor}
                    onChange={(e) => setCompany({ ...company, primaryColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={company.primaryColor}
                    onChange={(e) => setCompany({ ...company, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                {company.logo ? (
                  <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: company.primaryColor }}
                  >
                    {company.name.charAt(0) || 'A'}
                  </div>
                )}
                <span className="font-medium">{company.name || 'Company Name'}</span>
              </div>
            </div>
          </div>
          
          {/* Bailbooks Integration */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bailbooks Integration</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bailbooks Company ID
              </label>
              <input
                type="number"
                value={company.bailbooksCompanyId}
                onChange={(e) => setCompany({ ...company, bailbooksCompanyId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="4228"
              />
              <p className="text-xs text-gray-500 mt-1">
                The CompanyID from your Bailbooks database
              </p>
            </div>
          </div>

          {/* Wizard Type Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Wizard Type</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose which form wizard clients will see when filling out their application.
            </p>

            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${company.wizardType === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="wizardType"
                  value="basic"
                  checked={company.wizardType === 'basic'}
                  onChange={(e) => setCompany({ ...company, wizardType: e.target.value })}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Basic Wizard</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Quick form with essential info only: defendant name, co-signer contact, and charges.
                    Best for simple bonds or initial contact.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${company.wizardType === 'medium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="wizardType"
                  value="medium"
                  checked={company.wizardType === 'medium'}
                  onChange={(e) => setCompany({ ...company, wizardType: e.target.value })}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Medium Wizard</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Recommended</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Standard form with defendant info, co-signer details, references, and signatures.
                    Best balance of thoroughness and completion rate.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${company.wizardType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="wizardType"
                  value="full"
                  checked={company.wizardType === 'full'}
                  onChange={(e) => setCompany({ ...company, wizardType: e.target.value })}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Full Wizard</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive form with all details: personal info, features, employment,
                    spouse info, emergency contacts, and more. Best for larger bonds or underwriting.
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* API Key Section (only for existing companies) */}
          {!isNew && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key</h2>
              
              {apiKey?.full && showApiKey ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2 font-medium">
                      ⚠️ Save this API key now - it will only be shown once!
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white p-3 rounded border border-yellow-300 text-sm font-mono break-all">
                        {apiKey.full}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiKey.full)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Agent Wizard Link */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-2 font-medium">
                      🔗 Agent E-Sign Wizard URL:
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white p-2 rounded border border-blue-200 text-xs font-mono break-all">
                        {window.location.origin}/agent/create?apiKey={apiKey.full}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${window.location.origin}/agent/create?apiKey=${apiKey.full}`)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
                      >
                        Copy
                      </button>
                      <a
                        href={`/agent/create?apiKey=${apiKey.full}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowApiKey(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Hide API Key
                  </button>
                </div>
              ) : apiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <code className="bg-gray-100 px-4 py-2 rounded text-sm font-mono">
                      {apiKey.masked}
                    </code>
                    <span className="text-sm text-gray-500">
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    For security, the full API key is only shown when first generated. 
                    Click "Regenerate Key" to create a new one and see the full key.
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateApiKey}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Regenerate Key
                    </button>
                    <button
                      type="button"
                      onClick={revokeApiKey}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                    >
                      Revoke Key
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-3">No API key configured for this company.</p>
                  <button
                    type="button"
                    onClick={generateApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Generate API Key
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Status */}
          {!isNew && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={company.isActive}
                  onChange={(e) => setCompany({ ...company, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Company is active</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">
                Inactive companies cannot accept new prospects
              </p>
            </div>
          )}
          
          {/* Form URL Preview */}
          {company.slug && (
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-medium text-blue-900 mb-2">Your BondProspects URL</h3>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white px-4 py-2 rounded border border-blue-200 text-blue-800">
                  https://www.bondprospects.com/{company.slug}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`https://www.bondprospects.com/${company.slug}`)}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                >
                  Copy
                </button>
                {!isNew && (
                  <a
                    href={`https://www.bondprospects.com/${company.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Open →
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || (slugAvailable?.available === false)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (isNew ? 'Create Company' : 'Save Changes')}
            </button>
            <Link
              to="/admin/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
