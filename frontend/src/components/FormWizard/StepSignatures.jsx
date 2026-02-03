import { useRef, useState, useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { Trash2, Check, ChevronDown, ChevronUp, FileText, Eye, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

// Form definitions with their required signatures
const FORMS = [
  {
    id: 'preApplication',
    name: 'Pre-Application',
    description: 'Basic information about the co-signer and defendant',
    signatures: [
      { id: 'coSigner', label: 'Co-Signer Signature', required: true },
      { id: 'defendant', label: 'Defendant Signature', required: false, hint: 'Optional if defendant is in custody' }
    ]
  },
  {
    id: 'referenceForm',
    name: 'Reference Form',
    description: 'List of personal references',
    signatures: [
      { id: 'applicant', label: 'Applicant Signature', required: true }
    ]
  },
  {
    id: 'immigrationWaiver',
    name: 'Immigration Waiver',
    description: 'Waiver regarding citizenship status',
    signatures: [
      { id: 'coSigner', label: 'Co-Signer Signature', required: true }
    ]
  },
  {
    id: 'indemnitorApplication',
    name: 'Bail Bond Application - Indemnitor',
    description: 'Detailed indemnitor information and agreement (3 pages)',
    signatures: [
      { id: 'indemnitor', label: 'Indemnitor Signature', required: true }
    ]
  },
  {
    id: 'immigrationBondAgreement',
    name: 'Immigration Bond Agreement',
    description: 'Terms and conditions of the immigration bond (2 pages)',
    signatures: [
      { id: 'indemnitor', label: 'Indemnitor Signature', required: true }
    ]
  }
]

// API endpoint mapping for form previews
const FORM_TYPE_MAP = {
  preApplication: 'pre-application',
  referenceForm: 'reference-form',
  immigrationWaiver: 'immigration-waiver',
  indemnitorApplication: 'indemnitor-application',
  immigrationBondAgreement: 'immigration-bond-agreement'
}

export default function StepSignatures() {
  const { control, watch, getValues, formState: { errors } } = useFormContext()
  const [expandedForm, setExpandedForm] = useState(FORMS[0].id)
  const [readConfirmations, setReadConfirmations] = useState({})
  const [, forceUpdate] = useState(0) // Force re-render trigger
  
  const defendant = watch('defendant')
  const indemnitor = watch('indemnitor')
  
  // Watch each required signature field individually for proper reactivity
  const sig1 = watch('signatures.preApplication_coSigner')
  const sig2 = watch('signatures.referenceForm_applicant')
  const sig3 = watch('signatures.immigrationWaiver_coSigner')
  const sig4 = watch('signatures.indemnitorApplication_indemnitor')
  const sig5 = watch('signatures.immigrationBondAgreement_indemnitor')
  
  // Build signatures object from watched values
  const watchedSignatures = {
    preApplication_coSigner: sig1,
    referenceForm_applicant: sig2,
    immigrationWaiver_coSigner: sig3,
    indemnitorApplication_indemnitor: sig4,
    immigrationBondAgreement_indemnitor: sig5
  }
  
  // Check if a signature is valid
  const isValidSignature = (value) => {
    return value && typeof value === 'string' && value.startsWith('data:image')
  }
  
  // Check if a form's required signatures are complete
  const isFormComplete = (form) => {
    return form.signatures
      .filter(sig => sig.required)
      .every(sig => {
        const key = `${form.id}_${sig.id}`
        return isValidSignature(watchedSignatures[key])
      })
  }
  
  // Calculate completed forms directly from watched signatures
  const completedForms = {}
  FORMS.forEach(form => {
    completedForms[form.id] = isFormComplete(form)
  })
  
  // Count completed forms
  const completedCount = Object.values(completedForms).filter(Boolean).length
  const totalForms = FORMS.length
  
  // Get signer name based on signature type
  const getSignerName = (sigId) => {
    if (sigId.includes('defendant')) {
      return `${defendant?.firstName || ''} ${defendant?.lastName || ''}`.trim() || 'Defendant'
    }
    return `${indemnitor?.firstName || ''} ${indemnitor?.lastName || ''}`.trim() || 'Indemnitor/Co-Signer'
  }
  
  // Handle read confirmation toggle
  const toggleReadConfirmation = (formId) => {
    setReadConfirmations(prev => ({
      ...prev,
      [formId]: !prev[formId]
    }))
  }

  return (
    <div className="space-y-6">
      <section className="form-section">
        <h2 className="section-title">Review & Sign Your Documents</h2>
        <p className="text-sm text-gray-500 mb-4">
          Please carefully read each document below before signing. You must review and sign all required documents to complete your application.
        </p>
        
        {/* Progress indicator */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Documents Signed: {completedCount} of {totalForms}
            </span>
            <span className="text-sm text-blue-700">
              {Math.round((completedCount / totalForms) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalForms) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Forms accordion */}
        <div className="space-y-3">
          {FORMS.map((form, index) => (
            <FormAccordionItem
              key={form.id}
              form={form}
              index={index}
              isExpanded={expandedForm === form.id}
              isComplete={completedForms[form.id]}
              hasReadConfirmation={readConfirmations[form.id]}
              onToggleExpand={() => setExpandedForm(expandedForm === form.id ? null : form.id)}
              onToggleReadConfirmation={() => toggleReadConfirmation(form.id)}
              onNextForm={() => index < FORMS.length - 1 && setExpandedForm(FORMS[index + 1].id)}
              getSignerName={getSignerName}
              defendant={defendant}
              indemnitor={indemnitor}
              control={control}
              errors={errors}
              signatures={watchedSignatures}
              isLastForm={index === FORMS.length - 1}
            />
          ))}
        </div>
        
        {/* Final confirmation */}
        <div className="border-t pt-6 mt-6">
          {/* Warning if not all forms signed */}
          {completedCount < totalForms && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Required:</strong> You must sign ALL {totalForms} documents before submitting. 
                You have {totalForms - completedCount} document{totalForms - completedCount > 1 ? 's' : ''} remaining.
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                {FORMS.filter(form => !completedForms[form.id]).map(form => (
                  <li key={form.id}>{form.name} - Not signed</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> By signing these documents, you are entering into a legally binding agreement. 
              Please ensure all information is accurate before submitting.
            </p>
          </div>
          
          <Controller
            name="finalAgreement"
            control={control}
            rules={{ 
              required: 'You must agree to the terms to continue',
              validate: () => {
                if (completedCount < totalForms) {
                  return `You must sign all ${totalForms} documents before submitting`
                }
                return true
              }
            }}
            render={({ field }) => (
              <label className={clsx(
                'flex items-start gap-3 cursor-pointer',
                completedCount < totalForms && 'opacity-50 pointer-events-none'
              )}>
                <input
                  type="checkbox"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                  disabled={completedCount < totalForms}
                />
                <span className="text-sm text-gray-700">
                  I have read, understand, and agree to all documents above. I certify that all information provided is true and correct, 
                  and I agree to be bound by the terms and conditions stated in each document.
                </span>
              </label>
            )}
          />
          {errors.finalAgreement && (
            <p className="text-red-500 text-sm mt-1">{errors.finalAgreement.message}</p>
          )}
        </div>
      </section>
    </div>
  )
}

// Form Accordion Item Component
function FormAccordionItem({
  form,
  index,
  isExpanded,
  isComplete,
  hasReadConfirmation,
  onToggleExpand,
  onToggleReadConfirmation,
  onNextForm,
  getSignerName,
  defendant,
  indemnitor,
  control,
  errors,
  signatures,
  isLastForm
}) {
  const [showFullForm, setShowFullForm] = useState(false)
  
  return (
    <div 
      className={clsx(
        'border rounded-lg overflow-hidden transition-all',
        isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200',
        isExpanded && 'ring-2 ring-blue-500'
      )}
    >
      {/* Form header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            isComplete 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          )}>
            {isComplete ? <Check className="w-5 h-5" /> : index + 1}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{form.name}</h3>
            <p className="text-xs text-gray-500">{form.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ Signed
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* Form content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-white">
          
          {/* Document Preview Section */}
          <div className="my-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Document to Review</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullForm(!showFullForm)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-4 h-4" />
                {showFullForm ? 'Hide Full Document' : 'View Full Document'}
              </button>
            </div>
            
            {/* Full Form Preview (iframe or embedded HTML) */}
            {showFullForm ? (
              <FormPreviewFull 
                formId={form.id} 
                defendant={defendant} 
                indemnitor={indemnitor}
                signatures={signatures}
              />
            ) : (
              <FormPreviewSummary 
                formId={form.id} 
                defendant={defendant} 
                indemnitor={indemnitor} 
              />
            )}
          </div>
          
          {/* Read Confirmation Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadConfirmation || false}
                onChange={onToggleReadConfirmation}
                className="mt-1 w-5 h-5 text-yellow-600 rounded border-yellow-400"
              />
              <span className="text-sm text-yellow-800">
                <strong>I confirm</strong> that I have read and understand the terms, conditions, and obligations outlined in the "{form.name}" document above.
              </span>
            </label>
          </div>
          
          {/* Signatures for this form - only show if read confirmation is checked */}
          {hasReadConfirmation ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">✍️</span>
                Sign Below:
              </h4>
              
              {form.signatures.map((sig) => (
                <Controller
                  key={`${form.id}_${sig.id}`}
                  name={`signatures.${form.id}_${sig.id}`}
                  control={control}
                  rules={{ required: sig.required ? `${sig.label} is required` : false }}
                  render={({ field }) => (
                    <SignaturePad
                      label={`${sig.label} - ${getSignerName(sig.id)}`}
                      required={sig.required}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.signatures?.[`${form.id}_${sig.id}`]}
                      hint={sig.hint}
                    />
                  )}
                />
              ))}
              
              {/* Next form button */}
              {!isLastForm && isComplete && (
                <button
                  type="button"
                  onClick={onNextForm}
                  className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Next Document →
                </button>
              )}
              
              {isLastForm && isComplete && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                  <p className="text-green-800 font-medium">✓ All documents signed! Scroll down to submit your application.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Please read the document and check the confirmation box above to sign.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Full Form Preview - Shows the actual form content
function FormPreviewFull({ formId, defendant, indemnitor, signatures }) {
  const [loading, setLoading] = useState(true)
  
  // Get API base URL
  const apiBase = import.meta.env.VITE_API_URL || ''
  const formType = FORM_TYPE_MAP[formId]
  
  // For now, show embedded form content
  // In production, this would fetch from /api/forms/preview/:intakeId/:formType
  
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="max-h-96 overflow-y-auto p-4 bg-gray-50">
        <FormContentPreview formId={formId} defendant={defendant} indemnitor={indemnitor} />
      </div>
      <div className="p-2 bg-gray-100 border-t text-center">
        <p className="text-xs text-gray-500">Scroll to read the complete document</p>
      </div>
    </div>
  )
}

// Form Content Preview - Actual form content for each form type
function FormContentPreview({ formId, defendant, indemnitor }) {
  const defName = `${defendant?.firstName || ''} ${defendant?.lastName || ''}`.trim() || '[Defendant Name]'
  const indName = `${indemnitor?.firstName || ''} ${indemnitor?.lastName || ''}`.trim() || '[Indemnitor Name]'
  
  const previews = {
    preApplication: (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-center font-bold">PRE-APPLICATION</h3>
        <p className="text-sm">This pre-application form collects basic information about the co-signer and defendant for bail bond processing.</p>
        
        <h4>Co-Signer Information</h4>
        <p><strong>Name:</strong> {indName}</p>
        <p><strong>Relationship to Defendant:</strong> {indemnitor?.relationshipToDefendant || '[Relationship]'}</p>
        
        <h4>Defendant Information</h4>
        <p><strong>Name:</strong> {defName}</p>
        <p><strong>Date of Birth:</strong> {defendant?.dob || '[DOB]'}</p>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm"><strong>By signing below, I certify that:</strong></p>
          <ul className="text-sm list-disc pl-5">
            <li>All information provided is true and correct</li>
            <li>I authorize the running of records and/or credit reports</li>
            <li>I authorize full verification of all information given</li>
          </ul>
        </div>
      </div>
    ),
    
    referenceForm: (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-center font-bold">REFERENCE FORM</h3>
        <p className="text-sm">This form lists personal references who can verify the applicant's information and character.</p>
        
        <p><strong>Applicant:</strong> {indName}</p>
        <p><strong>Defendant:</strong> {defName}</p>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm"><strong>Agreement:</strong></p>
          <p className="text-sm">I certify that all reference information provided is accurate. I understand these references may be contacted by the bail bond company to verify my information and the defendant's character.</p>
        </div>
      </div>
    ),
    
    immigrationWaiver: (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-center font-bold">IMMIGRATION WAIVER</h3>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="font-bold text-red-800">IMPORTANT - PLEASE READ CAREFULLY:</p>
          <p className="text-sm mt-2">
            I, <strong>{indName}</strong>, hereby state that the defendant, <strong>{defName}</strong>, 
            is a citizen of the United States.
          </p>
          <p className="text-sm mt-2 font-bold">
            If it is found that the defendant is not a United States citizen and is held in jail for an 
            immigration hold, I agree that I will not be entitled to a refund of the bail bond premium 
            and/or collateral.
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <p className="font-bold">SPANISH VERSION / VERSIÓN EN ESPAÑOL:</p>
          <p className="text-sm mt-2">
            Yo <strong>{indName}</strong> doy mi palabra que <strong>{defName}</strong> es nacido en Estados Unidos. 
            Si es descubierto que no es nacido en los Estados Unidos y está en cárcel esperando que inmigración 
            vaya por él, yo no gano mi dinero pa'tras.
          </p>
        </div>
      </div>
    ),
    
    indemnitorApplication: (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-center font-bold">BAIL BOND APPLICATION - INDEMNITOR</h3>
        <p className="text-sm text-center">(3-Page Legal Document)</p>
        
        <h4>Defendant Information</h4>
        <p><strong>Name:</strong> {defName}</p>
        <p><strong>Charges:</strong> {defendant?.charges || '[Charges]'}</p>
        
        <h4>Indemnitor Information</h4>
        <p><strong>Name:</strong> {indName}</p>
        <p><strong>Relationship:</strong> {indemnitor?.relationshipToDefendant || '[Relationship]'}</p>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="text-red-800 font-bold">INDEMNITY AGREEMENT - IMPORTANT TERMS:</h4>
          <ol className="text-sm list-decimal pl-5 space-y-2">
            <li><strong>Premium:</strong> The premium is fully earned upon posting of the bond and is NOT refundable.</li>
            <li><strong>Collateral:</strong> You may be required to deposit collateral equal to the full bond amount as security.</li>
            <li><strong>Indemnification:</strong> You agree to indemnify and hold harmless the surety company from ALL claims, losses, costs, damages, and expenses arising from the execution of this bond.</li>
            <li><strong>Defendant's Appearance:</strong> You are responsible for ensuring the defendant appears at ALL court dates.</li>
            <li><strong>Breach of Bond:</strong> If the defendant fails to appear in court, you will be liable for:
              <ul className="list-disc pl-5 mt-1">
                <li>The FULL bond amount</li>
                <li>All recovery expenses</li>
                <li>Attorney fees</li>
                <li>Investigation costs</li>
              </ul>
            </li>
            <li><strong>Surrender Rights:</strong> The surety has the right to surrender the defendant to custody at any time.</li>
          </ol>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm"><strong>FRAUD WARNING:</strong> Any person who knowingly presents false information in an application for insurance is guilty of a crime and may be subject to fines and imprisonment.</p>
        </div>
      </div>
    ),
    
    immigrationBondAgreement: (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-center font-bold">IMMIGRATION BOND AGREEMENT</h3>
        <p className="text-sm text-center">(2-Page Legal Agreement)</p>
        
        <h4>Agreement Details</h4>
        <p><strong>Defendant/Alien:</strong> {defName}</p>
        <p><strong>Indemnitor:</strong> {indName}</p>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="text-red-800 font-bold">TERMS AND CONDITIONS:</h4>
          
          <h5 className="font-bold mt-3">1. APPLICATION FEE & PREMIUM</h5>
          <p className="text-sm">The application fee and bond premium are fully earned upon execution and are NON-REFUNDABLE under any circumstances.</p>
          
          <h5 className="font-bold mt-3">2. PAYMENT TERMS</h5>
          <p className="text-sm">All payments must be made as agreed. Failure to make payments may result in surrender of the defendant and forfeiture of all amounts paid.</p>
          
          <h5 className="font-bold mt-3">3. COLLATERAL REQUIREMENTS</h5>
          <p className="text-sm">Indemnitor shall deposit cash collateral equal to the bond amount as security. Collateral will be held until bond is exonerated.</p>
          
          <h5 className="font-bold mt-3">4. BOND BREACH</h5>
          <p className="text-sm">If the bond is breached or forfeited, Indemnitor shall IMMEDIATELY pay:</p>
          <ul className="text-sm list-disc pl-5">
            <li>The full bond amount</li>
            <li>All expenses incurred in locating the defendant</li>
            <li>Attorney fees and court costs</li>
            <li>Any other related expenses</li>
          </ul>
          
          <h5 className="font-bold mt-3">5. CONTINUING OBLIGATIONS</h5>
          <p className="text-sm">All obligations under this agreement continue until the Surety receives written notice that the bond has been exonerated or cancelled by the court.</p>
          
          <h5 className="font-bold mt-3">6. LEGAL VENUE</h5>
          <p className="text-sm">Any legal disputes arising from this agreement shall be filed in the county where the bond was posted.</p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          <p className="text-sm"><strong>ACKNOWLEDGMENT:</strong> By signing below, I acknowledge that I have read, understand, and agree to ALL terms and conditions stated above. I understand that this is a legally binding agreement.</p>
        </div>
      </div>
    )
  }
  
  return previews[formId] || <p className="text-sm text-gray-500">Document preview not available</p>
}

// Summary preview (collapsed view)
function FormPreviewSummary({ formId, defendant, indemnitor }) {
  const defName = `${defendant?.firstName || ''} ${defendant?.lastName || ''}`.trim() || '[Defendant]'
  const indName = `${indemnitor?.firstName || ''} ${indemnitor?.lastName || ''}`.trim() || '[Indemnitor]'
  
  const summaries = {
    preApplication: `Collects basic info for co-signer (${indName}) and defendant (${defName}). Includes authorization for record checks.`,
    referenceForm: `Lists personal references for ${indName}. References may be contacted for verification.`,
    immigrationWaiver: `IMPORTANT: States that ${defName} is a US citizen. If not, premium/collateral is NON-REFUNDABLE.`,
    indemnitorApplication: `3-page agreement making ${indName} financially responsible if ${defName} fails to appear in court.`,
    immigrationBondAgreement: `2-page legal agreement with payment terms, collateral requirements, and breach conditions.`
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="text-sm text-gray-700">{summaries[formId]}</p>
      <p className="text-xs text-blue-600 mt-2">Click "View Full Document" above to read complete terms before signing.</p>
    </div>
  )
}

// Signature Pad Component
function SignaturePad({ label, value, onChange, required, error, hint }) {
  const sigCanvas = useRef(null)
  const [hasSignature, setHasSignature] = useState(!!value)
  
  useEffect(() => {
    if (value) {
      setHasSignature(true)
    }
  }, [value])
  
  const clear = () => {
    sigCanvas.current?.clear()
    setHasSignature(false)
    onChange(null)
  }
  
  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      setHasSignature(true)
      onChange(dataUrl)
    }
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className={clsx(
          'border-2 rounded-lg overflow-hidden bg-white',
          hasSignature ? 'border-green-400' : 'border-gray-300',
          error && 'border-red-500'
        )}>
          {value && hasSignature ? (
            <div className="relative" style={{ height: 120 }}>
              <img 
                src={value} 
                alt="Signature" 
                className="max-h-full mx-auto"
              />
              <button
                type="button"
                onClick={clear}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                title="Clear signature"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
              <div className="absolute top-2 left-2 p-2 bg-green-100 rounded-full">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </div>
          ) : (
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full cursor-crosshair',
                style: { height: 120 }
              }}
              onEnd={handleEnd}
              backgroundColor="white"
            />
          )}
        </div>
        
        {!hasSignature && (
          <p className="text-xs text-gray-400 mt-1 text-center">
            ✍️ Sign above using your finger or mouse
          </p>
        )}
      </div>
      
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </div>
  )
}
