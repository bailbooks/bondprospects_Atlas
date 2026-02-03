/**
 * AgentIntake - Pre-filled form for co-signers from agent-initiated requests
 * URL: /:companySlug/:linkCode (e.g., /abetterbailbonds/ABC123)
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import axios from 'axios'
import StepIndicator from '../components/FormWizard/StepIndicator'
import StepDefendant from '../components/FormWizard/StepDefendant'
import StepIndemnitor from '../components/FormWizard/StepIndemnitor'
import StepReferences from '../components/FormWizard/StepReferences'
import StepReview from '../components/FormWizard/StepReview'
import StepSignatures from '../components/FormWizard/StepSignatures'
import LoadingSpinner from '../components/LoadingSpinner'

const STEPS = [
  { id: 'defendant', title: 'Defendant', component: StepDefendant },
  { id: 'indemnitor', title: 'Indemnitor', component: StepIndemnitor },
  { id: 'references', title: 'References', component: StepReferences },
  { id: 'review', title: 'Review', component: StepReview },
  { id: 'signatures', title: 'Sign', component: StepSignatures },
]

export default function AgentIntake() {
  const { companySlug, linkCode } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [company, setCompany] = useState(null)
  const [intake, setIntake] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      defendant: {}, indemnitor: {}, bond: {}, signatures: {}, finalAgreement: false,
      references: [{}, {}, {}],
    },
  })
  
  const { handleSubmit, reset } = methods

  useEffect(() => {
    const loadIntake = async () => {
      try {
        const companyRes = await axios.get(`/api/company/${companySlug}`)
        setCompany(companyRes.data)
        
        const intakeRes = await axios.get(`/api/intake/${linkCode}`)
        const data = intakeRes.data
        
        if (data.status === 'COMPLETED') {
          navigate(`/${companySlug}/complete`)
          return
        }
        if (new Date(data.expiresAt) < new Date()) {
          navigate('/expired')
          return
        }
        
        setIntake(data)
        
        // Pre-fill with agent-provided data
        const def = data.defendantData || {}
        const ind = data.indemnitorData || {}
        const bonds = data.bondsData || []
        const shared = data.sharedBondData || {}
        const b1 = bonds[0] || {}
        
        reset({
          defendant: {
            firstName: def.firstName || '', lastName: def.lastName || '',
            dob: def.dob || '', cellPhone: def.phone || '',
            jailLocation: shared.postingFacility || '', charges: b1.charges || '',
            caseNumber: b1.caseNumber || '', courtName: b1.returnCourt || '',
          },
          indemnitor: {
            firstName: ind.firstName || '', lastName: ind.lastName || '',
            email: ind.email || '', cellPhone: ind.cellPhone || '',
          },
          bond: { amount: b1.amount, premium: b1.premium, ...shared, multipleBonds: bonds },
          references: [{}, {}, {}],
          signatures: {}, finalAgreement: false,
        })
        
        axios.post(`/api/intake/${linkCode}/opened`).catch(() => {})
        setLoading(false)
      } catch (err) {
        setError(err.response?.status === 404 ? 'Invalid or expired link.' : 'Failed to load.')
        setLoading(false)
      }
    }
    loadIntake()
  }, [companySlug, linkCode, navigate, reset])

  const handleFinalSubmit = async (data) => {
    setSubmitting(true)
    try {
      await axios.post(`/api/intake/${linkCode}/submit`, {
        defendantData: data.defendant, indemnitorData: data.indemnitor,
        referencesData: data.references, bondData: data.bond, signatures: data.signatures
      })
      sessionStorage.setItem('currentLinkCode', linkCode)
      navigate(`/${companySlug}/complete`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit.')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (error && !company) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  )

  const StepComponent = STEPS[currentStep].component
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          {company?.logo && <img src={company.logo} alt="" className="h-10" />}
          <h1 className="text-xl font-semibold">{company?.name}</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
        
        {intake?.bondsData?.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">This request includes {intake.bondsData.length} bonds.</p>
          </div>
        )}
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFinalSubmit)}>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <StepComponent />
            </div>
            
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>}
            
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 bg-white border py-3 rounded-lg font-medium hover:bg-gray-50">Back</button>
              )}
              {!isLastStep ? (
                <button type="button" onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Continue</button>
              ) : (
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
