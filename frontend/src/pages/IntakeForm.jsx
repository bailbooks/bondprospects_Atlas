import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import StepIndicator from '../components/FormWizard/StepIndicator'
import StepBasicInfo from '../components/FormWizard/StepBasicInfo'
import StepDefendant from '../components/FormWizard/StepDefendant'
import StepIndemnitor from '../components/FormWizard/StepIndemnitor'
import StepReferences from '../components/FormWizard/StepReferences'
import StepReview from '../components/FormWizard/StepReview'
import StepSignatures from '../components/FormWizard/StepSignatures'
import LoadingSpinner from '../components/LoadingSpinner'
import { intakeSchema, getStepSchema } from '../utils/validation'

const STEPS = [
  { id: 'basic', title: 'Basic Info', component: StepBasicInfo },
  { id: 'defendant', title: 'Defendant', component: StepDefendant },
  { id: 'indemnitor', title: 'Indemnitor', component: StepIndemnitor },
  { id: 'references', title: 'References', component: StepReferences },
  { id: 'review', title: 'Review', component: StepReview },
  { id: 'signatures', title: 'Sign', component: StepSignatures },
]

export default function IntakeForm() {
  const { linkCode } = useParams()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [intake, setIntake] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      defendant: {
        firstName: '',
        lastName: '',
        dob: '',
        ssn: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        homePhone: '',
        cellPhone: '',
        email: '',
      },
      indemnitor: {
        firstName: '',
        lastName: '',
        relationshipToDefendant: '',
        dob: '',
        ssn: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        homePhone: '',
        cellPhone: '',
        email: '',
      },
      references: [
        { name: '', relationship: '', phone: '', address: '', city: '', state: '', zip: '' },
        { name: '', relationship: '', phone: '', address: '', city: '', state: '', zip: '' },
        { name: '', relationship: '', phone: '', address: '', city: '', state: '', zip: '' },
      ],
      bond: {
        amount: '',
        charges: '',
      },
      signatures: {},
      finalAgreement: false
    }
  })
  
  const { handleSubmit, trigger, getValues, reset } = methods
  
  // Load intake data on mount
  useEffect(() => {
    async function loadIntake() {
      try {
        const response = await axios.get(`/api/intake/${linkCode}`)
        setIntake(response.data)
        
        // Pre-fill form if there's existing data
        if (response.data.defendantData) {
          reset({
            defendant: response.data.defendantData,
            indemnitor: response.data.indemnitorData || {},
            references: response.data.referencesData || [
              { name: '', relationship: '', phone: '', address: '' },
              { name: '', relationship: '', phone: '', address: '' },
              { name: '', relationship: '', phone: '', address: '' },
            ],
            bond: response.data.bondData || {},
            signatures: {}
          })
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Failed to load intake:', err)
        if (err.response?.status === 410) {
          navigate('/expired')
        } else if (err.response?.status === 409) {
          navigate(`/i/${linkCode}/complete`)
        } else {
          setError(err.response?.data?.error || 'Failed to load form')
        }
        setLoading(false)
      }
    }
    
    loadIntake()
  }, [linkCode, navigate, reset])
  
  // Auto-save on step change
  useEffect(() => {
    if (!intake || currentStep === 0) return
    
    const values = getValues()
    
    // Debounced save
    const timer = setTimeout(async () => {
      try {
        await axios.post(`/api/intake/${linkCode}/save`, {
          defendantData: values.defendant,
          indemnitorData: values.indemnitor,
          referencesData: values.references,
          bondData: values.bond
        })
        console.log('Progress saved')
      } catch (err) {
        console.error('Failed to save progress:', err)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [currentStep, intake, linkCode, getValues])
  
  const handleNext = async () => {
    // Validate current step
    const stepFields = getStepFields(currentStep)
    const isValid = await trigger(stepFields)
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
      window.scrollTo(0, 0)
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    window.scrollTo(0, 0)
  }
  
  const handleFinalSubmit = async (data) => {
    setSubmitting(true)
    setError(null)
    
    try {
      await axios.post(`/api/intake/${linkCode}/submit`, {
        defendantData: data.defendant,
        indemnitorData: data.indemnitor,
        referencesData: data.references,
        bondData: data.bond,
        signatures: data.signatures
      })
      
      // Save linkCode for confirmation page
      sessionStorage.setItem('currentLinkCode', linkCode)
      
      navigate(`/i/${linkCode}/complete`)
    } catch (err) {
      console.error('Submission failed:', err)
      setError(err.response?.data?.error || 'Failed to submit. Please try again.')
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (error && !intake) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Form</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }
  
  const CurrentStepComponent = STEPS[currentStep].component
  const isLastStep = currentStep === STEPS.length - 1
  
  return (
    <FormProvider {...methods}>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {intake?.company?.logo && (
                <img 
                  src={intake.company.logo} 
                  alt={intake.company.name}
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="font-semibold text-gray-900">
                  {intake?.company?.name || 'Bail Bond Application'}
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </header>
        
        {/* Step indicators */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto px-4 mb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
        
        {/* Form content */}
        <main className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit(handleFinalSubmit)}>
            <CurrentStepComponent />
          </form>
        </main>
        
        {/* Navigation buttons - fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 no-print">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Back
              </button>
            )}
            
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex-1"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit(handleFinalSubmit)}
                className="btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  )
}

// Helper to get field names for each step (for validation)
function getStepFields(stepIndex) {
  switch (stepIndex) {
    case 0: // Basic Info
      return ['defendant.firstName', 'defendant.lastName', 'defendant.dob', 
              'indemnitor.firstName', 'indemnitor.lastName', 'indemnitor.relationshipToDefendant']
    case 1: // Defendant
      return ['defendant']
    case 2: // Indemnitor
      return ['indemnitor']
    case 3: // References
      return ['references']
    case 4: // Review
      return []
    case 5: // Signatures - validate ALL required signatures AND final agreement
      return [
        'signatures.preApplication_coSigner',
        'signatures.referenceForm_applicant', 
        'signatures.immigrationWaiver_coSigner',
        'signatures.indemnitorApplication_indemnitor',
        'signatures.immigrationBondAgreement_indemnitor',
        'finalAgreement'
      ]
    default:
      return []
  }
}
