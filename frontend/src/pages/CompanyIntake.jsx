import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import axios from 'axios'

import StepIndicator from '../components/FormWizard/StepIndicator'
import StepBasicInfo from '../components/FormWizard/StepBasicInfo'
import StepDefendant from '../components/FormWizard/StepDefendant'
import StepIndemnitor from '../components/FormWizard/StepIndemnitor'
import StepReferences from '../components/FormWizard/StepReferences'
import StepReview from '../components/FormWizard/StepReview'
import StepSignatures from '../components/FormWizard/StepSignatures'
import LoadingSpinner from '../components/LoadingSpinner'

const STEPS = [
  { id: 'basic', title: 'Basic Info', component: StepBasicInfo },
  { id: 'defendant', title: 'Defendant', component: StepDefendant },
  { id: 'indemnitor', title: 'Indemnitor', component: StepIndemnitor },
  { id: 'references', title: 'References', component: StepReferences },
  { id: 'review', title: 'Review', component: StepReview },
  { id: 'signatures', title: 'Sign', component: StepSignatures },
]

export default function CompanyIntake() {
  const { companySlug } = useParams()
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
        { name: '', relationship: '', phone: '', address: '' },
        { name: '', relationship: '', phone: '', address: '' },
        { name: '', relationship: '', phone: '', address: '' },
      ],
      bond: {
        amount: '',
        charges: '',
      },
      signatures: {
        defendant: null,
        indemnitor: null,
        waiver: null,
      }
    }
  })
  
  const { handleSubmit, trigger, getValues } = methods
  
  // Load company and create intake session on mount
  useEffect(() => {
    async function loadCompany() {
      try {
        // Skip if this looks like a reserved route
        const reservedRoutes = ['i', 'api', 'admin', 'expired', 'health']
        if (reservedRoutes.includes(companySlug.toLowerCase())) {
          setError('Invalid URL')
          setLoading(false)
          return
        }
        
        const response = await axios.get(`/api/company/${companySlug}`)
        setCompany(response.data.company)
        setIntake(response.data.intake)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load company:', err)
        if (err.response?.status === 404) {
          setError('Company not found. Please check the URL.')
        } else {
          setError(err.response?.data?.error || 'Failed to load form')
        }
        setLoading(false)
      }
    }
    
    loadCompany()
  }, [companySlug])
  
  // Auto-save on step change
  useEffect(() => {
    if (!intake || currentStep === 0) return
    
    const values = getValues()
    
    const timer = setTimeout(async () => {
      try {
        await axios.post(`/api/intake/${intake.linkCode}/save`, {
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
  }, [currentStep, intake, getValues])
  
  const handleNext = async () => {
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
      await axios.post(`/api/intake/${intake.linkCode}/submit`, {
        defendantData: data.defendant,
        indemnitorData: data.indemnitor,
        referencesData: data.references,
        bondData: data.bond,
        signatures: data.signatures
      })
      
      // Save linkCode for confirmation page
      sessionStorage.setItem('currentLinkCode', intake.linkCode)
      
      navigate(`/${companySlug}/complete`)
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
  
  if (error && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Form</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }
  
  const CurrentStepComponent = STEPS[currentStep].component
  const isLastStep = currentStep === STEPS.length - 1
  
  // Dynamic branding based on company
  const brandColor = company?.primaryColor || '#2563eb'
  
  return (
    <FormProvider {...methods}>
      <div className="min-h-screen pb-24">
        {/* Header with company branding */}
        <header 
          className="border-b border-gray-200 sticky top-0 z-10"
          style={{ backgroundColor: 'white' }}
        >
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="h-10 w-auto"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {company?.name?.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">
                  {company?.name || 'Bail Bond Application'}
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                backgroundColor: brandColor
              }}
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
        
        {/* Navigation buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Back
              </button>
            )}
            
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: brandColor }}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit(handleFinalSubmit)}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
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
        
        {/* Company contact info footer */}
        {company?.phone && (
          <div className="fixed bottom-20 left-0 right-0 text-center text-sm text-gray-500">
            Questions? Call {company.phone}
          </div>
        )}
      </div>
    </FormProvider>
  )
}

function getStepFields(stepIndex) {
  switch (stepIndex) {
    case 0:
      return ['defendant.firstName', 'defendant.lastName', 'defendant.dob', 
              'indemnitor.firstName', 'indemnitor.lastName', 'indemnitor.relationshipToDefendant']
    case 1:
      return ['defendant']
    case 2:
      return ['indemnitor']
    case 3:
      return ['references']
    case 4:
      return []
    case 5:
      return ['signatures.indemnitor']
    default:
      return []
  }
}
