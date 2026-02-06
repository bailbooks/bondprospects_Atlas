/**
 * LinkCodeIntake - Unified intake form for both agent-initiated and client-initiated
 * URL: /:companySlug/:linkCode
 * 
 * For AGENT-initiated: Pre-fills defendant, co-signer, and bond info from agent's entry
 * For CLIENT-initiated: Loads any saved progress
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import StepIndicator from '../components/FormWizard/StepIndicator'
import { intakeSchema } from '../utils/validation'
import StepBasicInfo from '../components/FormWizard/StepBasicInfo'
import StepDefendant from '../components/FormWizard/StepDefendant'
import StepIndemnitor from '../components/FormWizard/StepIndemnitor'
import StepReferences from '../components/FormWizard/StepReferences'
import StepReview from '../components/FormWizard/StepReview'
import StepSignatures from '../components/FormWizard/StepSignatures'
import LoadingSpinner from '../components/LoadingSpinner'

// Steps for client-initiated (full form)
const CLIENT_STEPS = [
  { id: 'basic', title: 'Basic Info', component: StepBasicInfo },
  { id: 'defendant', title: 'Defendant', component: StepDefendant },
  { id: 'indemnitor', title: 'Indemnitor', component: StepIndemnitor },
  { id: 'references', title: 'References', component: StepReferences },
  { id: 'review', title: 'Review', component: StepReview },
  { id: 'signatures', title: 'Sign', component: StepSignatures },
]

// Steps for agent-initiated (basic info already provided)
const AGENT_STEPS = [
  { id: 'defendant', title: 'Defendant', component: StepDefendant },
  { id: 'indemnitor', title: 'Indemnitor', component: StepIndemnitor },
  { id: 'references', title: 'References', component: StepReferences },
  { id: 'review', title: 'Review', component: StepReview },
  { id: 'signatures', title: 'Sign', component: StepSignatures },
]

export default function LinkCodeIntake() {
  const { companySlug, linkCode } = useParams()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [company, setCompany] = useState(null)
  const [intake, setIntake] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [isAgentInitiated, setIsAgentInitiated] = useState(false)
  
  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      defendant: {},
      indemnitor: {},
      bond: {},
      references: [{}, {}, {}],
      signatures: {},
      finalAgreement: false,
    },
  })

  const { handleSubmit, reset, formState, trigger } = methods

  // Get field names to validate for each step
  const getStepFields = (stepIndex, isAgent) => {
    const steps = isAgent ? AGENT_STEPS : CLIENT_STEPS
    const stepId = steps[stepIndex]?.id

    switch (stepId) {
      case 'basic':
        return ['defendant.firstName', 'defendant.lastName', 'defendant.dob',
                'indemnitor.firstName', 'indemnitor.lastName', 'indemnitor.relationshipToDefendant']
      case 'defendant':
        return ['defendant']
      case 'indemnitor':
        return ['indemnitor']
      case 'references':
        return ['references']
      case 'review':
        return []
      case 'signatures':
        return ['signatures']
      default:
        return []
    }
  }

  const handleNext = async () => {
    const stepFields = getStepFields(currentStep, isAgentInitiated)
    const isValid = await trigger(stepFields)

    if (isValid) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  useEffect(() => {
    const loadIntake = async () => {
      try {
        // Load company info
        const companyRes = await axios.get(`/api/company/${companySlug}`)
        setCompany(companyRes.data)
        
        // Load intake data
        const intakeRes = await axios.get(`/api/intake/${linkCode}`)
        const data = intakeRes.data
        
        // Check status
        if (data.status === 'COMPLETED') {
          sessionStorage.setItem('currentLinkCode', linkCode)
          navigate(`/${companySlug}/complete`)
          return
        }
        
        if (new Date(data.expiresAt) < new Date()) {
          navigate('/expired')
          return
        }
        
        setIntake(data)
        setIsAgentInitiated(data.source === 'AGENT')
        
        // Build pre-filled form data
        const formData = buildFormData(data)
        reset(formData)
        
        // Mark as opened (for agent-initiated tracking)
        if (data.source === 'AGENT') {
          axios.post(`/api/intake/${linkCode}/opened`).catch(() => {})
        }
        
        setLoading(false)
        
      } catch (err) {
        console.error('Load error:', err)
        if (err.response?.status === 404) {
          setError('This link is invalid or has expired.')
        } else {
          setError('Failed to load form. Please try again.')
        }
        setLoading(false)
      }
    }
    
    loadIntake()
  }, [companySlug, linkCode, navigate, reset])
  
  /**
   * Build form data from intake record
   * Handles both agent-initiated (with bondsData) and client-initiated (with bondData)
   */
  const buildFormData = (data) => {
    const def = data.defendantData || {}
    const ind = data.indemnitorData || {}
    const refs = data.referencesData || [{}, {}, {}]
    
    // Handle bond data - agent uses bondsData array, client uses bondData object
    const bonds = data.bondsData || []
    const shared = data.sharedBondData || {}
    const singleBond = data.bondData || {}
    const b1 = bonds[0] || singleBond
    
    return {
      defendant: {
        // Pre-fill from agent entry or saved progress
        firstName: def.firstName || '',
        lastName: def.lastName || '',
        dob: def.dob || '',
        cellPhone: def.phone || def.cellPhone || '',
        
        // These may be empty or filled from saved progress
        ssn: def.ssn || '',
        address: def.address || '',
        city: def.city || '',
        state: def.state || '',
        zip: def.zip || '',
        county: def.county || '',
        homePhone: def.homePhone || '',
        email: def.email || '',
        
        // Employment
        employer: def.employer || '',
        occupation: def.occupation || '',
        employerAddress: def.employerAddress || '',
        employerPhone: def.employerPhone || '',
        employmentDuration: def.employmentDuration || '',
        monthlyIncome: def.monthlyIncome || '',
        
        // Case info - pre-fill from agent entry
        jailLocation: shared.postingFacility || def.jailLocation || '',
        charges: b1.charges || def.charges || '',
        caseNumber: b1.caseNumber || def.caseNumber || '',
        courtName: b1.returnCourt || def.courtName || '',
        arrestDate: def.arrestDate || '',
        bookingNumber: def.bookingNumber || '',
        
        // Additional fields
        gender: def.gender || '',
        race: def.race || '',
        height: def.height || '',
        weight: def.weight || '',
        eyeColor: def.eyeColor || '',
        hairColor: def.hairColor || '',
        driversLicense: def.driversLicense || '',
        dlState: def.dlState || '',
      },
      
      indemnitor: {
        // Pre-fill from agent entry
        firstName: ind.firstName || '',
        lastName: ind.lastName || '',
        email: ind.email || '',
        cellPhone: ind.cellPhone || '',
        
        // These need to be filled by co-signer
        dob: ind.dob || '',
        ssn: ind.ssn || '',
        address: ind.address || '',
        city: ind.city || '',
        state: ind.state || '',
        zip: ind.zip || '',
        homePhone: ind.homePhone || '',
        workPhone: ind.workPhone || '',
        
        // Employment
        employer: ind.employer || '',
        position: ind.position || '',
        supervisorName: ind.supervisorName || '',
        employmentDuration: ind.employmentDuration || '',
        monthlyIncome: ind.monthlyIncome || '',
        
        // Additional
        driversLicense: ind.driversLicense || '',
        dlState: ind.dlState || '',
        relationshipToDefendant: ind.relationshipToDefendant || '',
        ownOrRent: ind.ownOrRent || '',
        landlordName: ind.landlordName || '',
        landlordPhone: ind.landlordPhone || '',
      },
      
      bond: {
        amount: b1.amount || singleBond.amount || '',
        premium: b1.premium || singleBond.premium || '',
        bondDate: shared.bondDate || singleBond.bondDate || '',
        agentName: shared.agentName || singleBond.agentName || '',
        postingFacility: shared.postingFacility || singleBond.postingFacility || '',
        // Store multiple bonds if present
        multipleBonds: bonds.length > 1 ? bonds : null,
      },
      
      references: refs.length >= 3 ? refs : [{}, {}, {}],
      signatures: data.signatures || {},
      finalAgreement: false,
    }
  }

  const handleFinalSubmit = async (formData) => {
    setSubmitting(true)
    setError(null)
    
    try {
      await axios.post(`/api/intake/${linkCode}/submit`, {
        defendantData: formData.defendant,
        indemnitorData: formData.indemnitor,
        referencesData: formData.references,
        bondData: formData.bond,
        signatures: formData.signatures,
      })
      
      sessionStorage.setItem('currentLinkCode', linkCode)
      navigate(`/${companySlug}/complete`)
      
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.error || 'Failed to submit. Please try again.')
      setSubmitting(false)
    }
  }
  
  // Auto-save progress (debounced)
  useEffect(() => {
    if (!intake || loading) return
    
    const saveTimeout = setTimeout(async () => {
      const data = methods.getValues()
      try {
        await axios.post(`/api/intake/${linkCode}/save`, {
          defendantData: data.defendant,
          indemnitorData: data.indemnitor,
          referencesData: data.references,
          bondData: data.bond,
        })
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, 2000)
    
    return () => clearTimeout(saveTimeout)
  }, [formState.isDirty, intake, linkCode, loading, methods])

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
        <div className="bg-white rounded-xl shadow p-6 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Use appropriate steps based on intake source
  const steps = isAgentInitiated ? AGENT_STEPS : CLIENT_STEPS
  const StepComponent = steps[currentStep]?.component
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          {company?.logo && <img src={company.logo} alt="" className="h-10" />}
          <h1 className="text-xl font-semibold">{company?.name}</h1>
        </div>
      </div>
      
      {/* Agent-initiated info banner */}
      {isAgentInitiated && currentStep === 0 && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">✓ Some information has been pre-filled</span> by your bail bond agent. 
              Please review and complete the remaining fields.
            </p>
          </div>
        </div>
      )}
      
      {/* Multiple bonds banner */}
      {intake?.bondsData?.length > 1 && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <p className="text-amber-800 text-sm font-medium">
              📋 This request includes {intake.bondsData.length} bonds totaling ${
                intake.bondsData.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0).toLocaleString()
              }
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <StepIndicator 
          steps={steps} 
          currentStep={currentStep} 
          onStepClick={setCurrentStep} 
        />
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFinalSubmit)}>
            <div className="bg-white rounded-xl border p-6 mb-6">
              {StepComponent && <StepComponent />}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                {error}
              </div>
            )}
            
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(currentStep - 1)
                    window.scrollTo(0, 0)
                  }}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
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
