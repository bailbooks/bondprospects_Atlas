import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CheckCircle, FileText, Download, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function Confirmation() {
  // Handle both route patterns:
  // /i/:linkCode/complete -> { linkCode: 'xxx' }
  // /:companySlug/complete -> { companySlug: 'xxx' }
  const params = useParams()
  const location = useLocation()
  
  // The linkCode might be passed via state from navigation, or we need to get it from somewhere
  // For company slug routes, we need to get the linkCode from session/localStorage
  const linkCode = params.linkCode || sessionStorage.getItem('currentLinkCode')
  
  const [loading, setLoading] = useState(true)
  const [pdfs, setPdfs] = useState([])
  const [defendantName, setDefendantName] = useState('')
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchPdfs = async () => {
      if (!linkCode) {
        console.error('No linkCode available')
        setError('Unable to load documents - missing reference code')
        setLoading(false)
        return
      }
      
      try {
        console.log('Fetching PDFs for:', linkCode)
        const response = await axios.get(`/api/intake/${linkCode}/pdfs`)
        console.log('PDF response:', response.data)
        setPdfs(response.data.pdfs || [])
        setDefendantName(response.data.defendantName || '')
      } catch (err) {
        console.error('Failed to fetch PDFs:', err)
        // Show more helpful error message
        if (err.response?.status === 400) {
          setError('Form not yet completed')
        } else if (err.response?.status === 404) {
          setError('Form not found')
        } else {
          setError(err.response?.data?.error || 'Could not load documents. You can still contact the bail bond agent.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    // Small delay to allow server to finish generating PDFs
    const timer = setTimeout(() => {
      fetchPdfs()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [linkCode])
  
  const downloadPdf = (pdf) => {
    // Create a blob from base64
    const byteCharacters = atob(pdf.data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${defendantName.replace(/\s+/g, '_')}_${pdf.name.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  
  const viewPdf = (pdf) => {
    // Create a blob and open in new tab
    const byteCharacters = atob(pdf.data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  }
  
  const downloadAll = () => {
    pdfs.forEach((pdf, index) => {
      setTimeout(() => downloadPdf(pdf), index * 500) // Stagger downloads
    })
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h1>
          
          <p className="text-gray-600">
            Your bail bond application has been successfully submitted. 
            The bail bond agent will review your information and contact you shortly.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Reference Number</p>
          <p className="font-mono font-semibold text-gray-900">{linkCode?.toUpperCase()}</p>
        </div>
        
        {/* PDF Documents Section */}
        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Completed Documents
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading documents...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : pdfs.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {pdfs.map((pdf) => (
                  <div 
                    key={pdf.key}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{pdf.name}</p>
                        <p className="text-xs text-gray-500">{pdf.size} KB</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewPdf(pdf)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadPdf(pdf)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={downloadAll}
                className="w-full btn btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download All Documents
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">Your application has been submitted successfully!</p>
              <p className="text-sm text-gray-500">
                The bail bond agent will receive your completed forms and contact you shortly.
              </p>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500 border-t pt-4">
          <p className="mb-2 font-medium">What happens next?</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Your completed forms have been sent to the bail bond agent
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              The agent will review your application
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              You will be contacted to discuss next steps
            </li>
          </ul>
        </div>
        
        <p className="mt-6 text-sm text-gray-400 text-center">
          You can close this window or keep it open to download your documents.
        </p>
      </div>
    </div>
  )
}
