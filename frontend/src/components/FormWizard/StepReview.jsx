import { useFormContext } from 'react-hook-form'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function StepReview() {
  const { watch } = useFormContext()
  const formData = watch()
  
  const { defendant, indemnitor, references } = formData
  
  return (
    <div className="space-y-6">
      <section className="form-section">
        <h2 className="section-title">Review Your Information</h2>
        <p className="text-sm text-gray-500 mb-4">
          Please review all the information you've entered before signing.
          You can go back to make changes if needed.
        </p>
        
        {/* Defendant Summary */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Defendant Information
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{defendant?.firstName} {defendant?.lastName}</dd>
            
            <dt className="text-gray-500">Date of Birth</dt>
            <dd className="font-medium">{formatDate(defendant?.dob)}</dd>
            
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium">{defendant?.cellPhone || 'Not provided'}</dd>
            
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium">
              {defendant?.address ? (
                `${defendant.address}, ${defendant.city}, ${defendant.state} ${defendant.zip}`
              ) : 'Not provided'}
            </dd>
            
            {defendant?.jailLocation && (
              <>
                <dt className="text-gray-500">Jail Location</dt>
                <dd className="font-medium">{defendant.jailLocation}</dd>
              </>
            )}
            
            {defendant?.alienNumber && (
              <>
                <dt className="text-gray-500">Alien Number</dt>
                <dd className="font-medium">{defendant.alienNumber}</dd>
              </>
            )}
          </dl>
        </div>
        
        {/* Indemnitor Summary */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Your Information (Co-Signer)
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{indemnitor?.firstName} {indemnitor?.lastName}</dd>
            
            <dt className="text-gray-500">Relationship</dt>
            <dd className="font-medium">{indemnitor?.relationshipToDefendant}</dd>
            
            <dt className="text-gray-500">Date of Birth</dt>
            <dd className="font-medium">{formatDate(indemnitor?.dob)}</dd>
            
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium">{indemnitor?.cellPhone}</dd>
            
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{indemnitor?.email}</dd>
            
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium">
              {indemnitor?.address}, {indemnitor?.city}, {indemnitor?.state} {indemnitor?.zip}
            </dd>
            
            {indemnitor?.employer && (
              <>
                <dt className="text-gray-500">Employer</dt>
                <dd className="font-medium">{indemnitor.employer}</dd>
              </>
            )}
          </dl>
        </div>
        
        {/* References Summary */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            References ({references?.filter(r => r.name).length || 0})
          </h3>
          <div className="space-y-3">
            {references?.filter(r => r.name).map((ref, i) => (
              <div key={i} className="text-sm border-b pb-2 last:border-0">
                <span className="font-medium">{ref.name}</span>
                <span className="text-gray-500"> ({ref.relationship})</span>
                <div className="text-gray-500">{ref.phone}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>
                By proceeding to the next step, you acknowledge that all information 
                provided is true and correct. You authorize the bail bond company to 
                verify this information, including running credit and background checks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not provided'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
