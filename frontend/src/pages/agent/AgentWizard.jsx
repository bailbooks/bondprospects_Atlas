/**
 * Agent E-Sign Request Wizard
 * 4-step form for Bailbooks agents to send e-sign requests to co-signers
 */
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form'
import axios from 'axios'
import { Plus, Trash2, CheckCircle, Send, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import PhoneInput from '../../components/PhoneInput'

const STEPS = [
  { id: 1, title: 'Defendant / Cosigner' },
  { id: 2, title: 'Bond(s) Info' },
  { id: 3, title: 'Review' },
  { id: 4, title: 'Send Request' },
]

// Demo data for preview mode
const DEMO_COMPANY = {
  id: 'demo',
  name: 'A Better Bail Bonds (Demo)',
  slug: 'demo',
  logo: null,
  primaryColor: '#3b82f6',
}

const DEMO_AGENTS = [
  { id: '1', name: 'Chris Martinez' },
  { id: '2', name: 'John Smith' },
  { id: '3', name: 'Sarah Johnson' },
]

const DEMO_FACILITIES = [
  { id: '1', name: 'Adams County Detention' },
  { id: '2', name: 'Denver County Jail' },
  { id: '3', name: 'Jefferson County Jail' },
]

const DEMO_COURTS = [
  { id: '1', name: 'Adams County Court' },
  { id: '2', name: 'Boulder County Court' },
  { id: '3', name: 'Denver County Court' },
]

export default function AgentWizard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const apiKey = searchParams.get('apiKey')
  const isDemo = searchParams.get('demo') === 'true' || !apiKey
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [company, setCompany] = useState(null)
  const [agents, setAgents] = useState([])
  const [facilities, setFacilities] = useState([])
  const [courts, setCourts] = useState([])
  const [submitResult, setSubmitResult] = useState(null)
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      defendant: {
        firstName: '',
        lastName: '',
        dob: '',
        phone: '',
      },
      coSigner: {
        firstName: '',
        lastName: '',
        email: '',
        cellPhone: '',
      },
      bondDate: new Date().toISOString().split('T')[0],
      postingFacility: '',
      agentName: '',
      bonds: [
        {
          amount: '',
          premium: '',
          returnCourt: '',
          caseNumber: '',
          charges: '',
        }
      ],
      deliveryMethod: 'sms',
    },
  })
  
  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = methods
  const { fields: bondFields, append: appendBond, remove: removeBond } = useFieldArray({
    control,
    name: 'bonds',
  })
  
  const watchCoSignerPhone = watch('coSigner.cellPhone')
  
  // Initialize - fetch company info and dropdown data
  useEffect(() => {
    const init = async () => {
      // Demo mode - use mock data
      if (isDemo) {
        setCompany(DEMO_COMPANY)
        setAgents(DEMO_AGENTS)
        setFacilities(DEMO_FACILITIES)
        setCourts(DEMO_COURTS)
        setLoading(false)
        return
      }
      
      if (!apiKey) {
        setError('API key is required. Please access this page from Bailbooks.')
        setLoading(false)
        return
      }
      
      try {
        const response = await axios.get(`/api/agent/init?apiKey=${apiKey}`)
        setCompany(response.data.company)
        setAgents(response.data.agents || [])
        setFacilities(response.data.facilities || [])
        setCourts(response.data.courts || [])
        setLoading(false)
      } catch (err) {
        console.error('Init error:', err)
        setError(err.response?.data?.error || 'Failed to initialize. Invalid API key.')
        setLoading(false)
      }
    }
    
    init()
  }, [apiKey, isDemo])
  
  const onSubmit = async (data) => {
    setSubmitting(true)
    setError(null)
    
    // Demo mode - simulate success
    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate delay
      setSubmitResult({
        success: true,
        intake: {
          id: 'demo-' + Date.now(),
          linkCode: 'DEMO' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          url: `https://www.bondprospects.com/demo/DEMO123`,
        },
        delivery: {
          method: 'sms',
          sentTo: data.coSigner.cellPhone,
          success: true,
        },
      })
      setCurrentStep(5)
      setSubmitting(false)
      return
    }
    
    try {
      const response = await axios.post(`/api/agent/create-request?apiKey=${apiKey}`, {
        defendant: data.defendant,
        coSigner: data.coSigner,
        bondDate: data.bondDate,
        postingFacility: data.postingFacility,
        agentName: data.agentName,
        bonds: data.bonds,
        deliveryMethod: data.deliveryMethod,
      })
      
      setSubmitResult(response.data)
      setCurrentStep(5) // Success step
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.error || 'Failed to send request')
      setSubmitting(false)
    }
  }
  
  // Get fields to validate for each step
  const getStepFields = (step) => {
    switch (step) {
      case 1: // Defendant / Co-Signer
        return [
          'defendant.firstName',
          'defendant.lastName',
          'defendant.dob',
          'coSigner.firstName',
          'coSigner.lastName',
          'coSigner.cellPhone',
        ]
      case 2: // Bond(s) Info
        return [
          'bondDate',
          'postingFacility',
          'agentName',
          'bonds',
        ]
      case 3: // Review
        return []
      case 4: // Send
        return ['coSigner.cellPhone']
      default:
        return []
    }
  }

  const goNext = async () => {
    if (currentStep < 4) {
      const fields = getStepFields(currentStep)
      const isValid = await trigger(fields)

      if (isValid) {
        setCurrentStep(currentStep + 1)
      }
    }
  }
  
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (error && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Please access this page through the Bailbooks application.
          </p>
        </div>
      </div>
    )
  }
  
  // Success screen
  if (currentStep === 5 && submitResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h1>
          <p className="text-gray-600 mb-6">
            The e-sign request has been sent to{' '}
            <strong>{submitResult.delivery?.sentTo}</strong>
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Reference Code</p>
            <p className="font-mono font-bold text-lg">{submitResult.intake?.linkCode}</p>
            <p className="text-sm text-gray-500 mt-3 mb-1">Link URL</p>
            <p className="text-xs text-blue-600 break-all">{submitResult.intake?.url}</p>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            You can close this window. The co-signer will receive a text message shortly.
          </p>
          
          <button
            onClick={() => window.close()}
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800"
          >
            Close Window
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-yellow-500 text-yellow-900 text-center py-2 px-4 text-sm font-medium">
          🔧 DEMO MODE - This is a preview. No data will be saved or sent.
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {company?.name} - Send E-Sign Request
          </h1>
        </div>
      </div>
      
      {/* Step Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-center items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Defendant / Co-Signer */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Defendant Section */}
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Who needs to be bonded out?
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter the basic information about the person in custody (the defendant).
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...methods.register('defendant.firstName', { required: 'First name is required' })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.defendant?.firstName ? 'border-red-500' : ''}`}
                      />
                      {errors.defendant?.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.defendant.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...methods.register('defendant.lastName', { required: 'Last name is required' })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.defendant?.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.defendant?.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.defendant.lastName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...methods.register('defendant.dob', { required: 'Date of birth is required' })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.defendant?.dob ? 'border-red-500' : ''}`}
                      />
                      {errors.defendant?.dob && (
                        <p className="text-red-500 text-xs mt-1">{errors.defendant.dob.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <Controller
                        name="defendant.phone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            {...field}
                            placeholder="303-269-8547"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Co-Signer Section */}
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Who are You Wanting to Send E-Sign Request to (Co-Signer)
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    You are the indemnitor (co-signer) who will be responsible for the bond.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...methods.register('coSigner.firstName', { required: 'First name is required' })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.coSigner?.firstName ? 'border-red-500' : ''}`}
                      />
                      {errors.coSigner?.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.coSigner.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...methods.register('coSigner.lastName', { required: 'Last name is required' })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.coSigner?.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.coSigner?.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.coSigner.lastName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...methods.register('coSigner.email')}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cell Phone <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-400 ml-1">(text will be sent here)</span>
                      </label>
                      <Controller
                        name="coSigner.cellPhone"
                        control={control}
                        rules={{
                          required: 'Cell phone is required',
                          validate: (value) => (value?.replace(/\D/g, '').length === 10) || 'Must be 10 digits'
                        }}
                        render={({ field }) => (
                          <PhoneInput
                            {...field}
                            placeholder="303-269-8547"
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.coSigner?.cellPhone ? 'border-red-500' : ''}`}
                            required
                          />
                        )}
                      />
                      {errors.coSigner?.cellPhone && (
                        <p className="text-red-500 text-xs mt-1">{errors.coSigner.cellPhone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Bond(s) Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Bond Info</h2>
                  
                  {bondFields.map((field, index) => (
                    <div key={field.id} className="mb-6 last:mb-0">
                      {index > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-gray-700">Bond #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeBond(index)}
                            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bond Amount <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="$0.00"
                            {...methods.register(`bonds.${index}.amount`, { required: 'Bond amount is required' })}
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bonds?.[index]?.amount ? 'border-red-500' : ''}`}
                          />
                          {errors.bonds?.[index]?.amount && (
                            <p className="text-red-500 text-xs mt-1">{errors.bonds[index].amount.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bond Premium <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="$0.00"
                            {...methods.register(`bonds.${index}.premium`, { required: 'Bond premium is required' })}
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bonds?.[index]?.premium ? 'border-red-500' : ''}`}
                          />
                          {errors.bonds?.[index]?.premium && (
                            <p className="text-red-500 text-xs mt-1">{errors.bonds[index].premium.message}</p>
                          )}
                        </div>
                        {index === 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bond Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...methods.register('bondDate', { required: 'Bond date is required' })}
                              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bondDate ? 'border-red-500' : ''}`}
                            />
                            {errors.bondDate && (
                              <p className="text-red-500 text-xs mt-1">{errors.bondDate.message}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {index === 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Posting Facility <span className="text-red-500">*</span>
                            </label>
                            {facilities.length > 0 ? (
                              <select
                                {...methods.register('postingFacility', { required: 'Posting facility is required' })}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.postingFacility ? 'border-red-500' : ''}`}
                              >
                                <option value="">- Select -</option>
                                {facilities.map(f => (
                                  <option key={f.id} value={f.name}>{f.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Enter facility name"
                                {...methods.register('postingFacility', { required: 'Posting facility is required' })}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.postingFacility ? 'border-red-500' : ''}`}
                              />
                            )}
                            {errors.postingFacility && (
                              <p className="text-red-500 text-xs mt-1">{errors.postingFacility.message}</p>
                            )}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Return Court <span className="text-red-500">*</span>
                          </label>
                          {courts.length > 0 ? (
                            <select
                              {...methods.register(`bonds.${index}.returnCourt`, { required: 'Return court is required' })}
                              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bonds?.[index]?.returnCourt ? 'border-red-500' : ''}`}
                            >
                              <option value="">- Select -</option>
                              {courts.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter court name"
                              {...methods.register(`bonds.${index}.returnCourt`, { required: 'Return court is required' })}
                              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bonds?.[index]?.returnCourt ? 'border-red-500' : ''}`}
                            />
                          )}
                          {errors.bonds?.[index]?.returnCourt && (
                            <p className="text-red-500 text-xs mt-1">{errors.bonds[index].returnCourt.message}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Case Number
                          </label>
                          <input
                            type="text"
                            {...methods.register(`bonds.${index}.caseNumber`)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {index === 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Agent <span className="text-red-500">*</span>
                            </label>
                            {agents.length > 0 ? (
                              <select
                                {...methods.register('agentName', { required: 'Agent is required' })}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.agentName ? 'border-red-500' : ''}`}
                              >
                                <option value="">- Select -</option>
                                {agents.map(a => (
                                  <option key={a.id} value={a.name}>{a.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Enter agent name"
                                {...methods.register('agentName', { required: 'Agent is required' })}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.agentName ? 'border-red-500' : ''}`}
                              />
                            )}
                            {errors.agentName && (
                              <p className="text-red-500 text-xs mt-1">{errors.agentName.message}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Charges <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Start typing"
                          {...methods.register(`bonds.${index}.charges`, { required: 'Charges is required' })}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bonds?.[index]?.charges ? 'border-red-500' : ''}`}
                        />
                        {errors.bonds?.[index]?.charges && (
                          <p className="text-red-500 text-xs mt-1">{errors.bonds[index].charges.message}</p>
                        )}
                      </div>
                      
                      {index < bondFields.length - 1 && (
                        <hr className="my-6 border-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => appendBond({
                    amount: '',
                    premium: '',
                    returnCourt: watch('bonds.0.returnCourt') || '',
                    caseNumber: '',
                    charges: '',
                  })}
                  className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Bond
                </button>
              </div>
            )}
            
            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Review Your Information
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Please review all the information you've entered before signing. You can go back to make changes if needed.
                  </p>
                  
                  {/* Defendant Info */}
                  <div className="border rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Defendant Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">
                        {watch('defendant.firstName')} {watch('defendant.lastName')}
                      </span>
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="font-medium">{watch('defendant.dob')}</span>
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium">{watch('defendant.phone') || '-'}</span>
                    </div>
                  </div>
                  
                  {/* Co-Signer Info */}
                  <div className="border rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Signers Information (Co-Signer)
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">
                        {watch('coSigner.firstName')} {watch('coSigner.lastName')}
                      </span>
                      <span className="text-gray-500">Cell Phone</span>
                      <span className="font-medium text-green-700">
                        📱 {watch('coSigner.cellPhone')}
                        <span className="text-xs text-gray-400 ml-2">(text will be sent here)</span>
                      </span>
                      {watch('coSigner.email') && (
                        <>
                          <span className="text-gray-500">Email</span>
                          <span className="font-medium">{watch('coSigner.email')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Bond Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Bond Info ({bondFields.length})
                    </h3>
                    {watch('bonds')?.map((bond, index) => (
                      <div key={index}>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-gray-500">Bond Amount</span>
                          <span className="font-medium">{bond.amount}</span>
                          <span className="text-gray-500">Bond Premium</span>
                          <span className="font-medium">{bond.premium}</span>
                          {index === 0 && (
                            <>
                              <span className="text-gray-500">Bond Date</span>
                              <span className="font-medium">{watch('bondDate')}</span>
                              <span className="text-gray-500">Posting Facility</span>
                              <span className="font-medium">{watch('postingFacility')}</span>
                            </>
                          )}
                          <span className="text-gray-500">Return Court</span>
                          <span className="font-medium">{bond.returnCourt}</span>
                          <span className="text-gray-500">Case Number</span>
                          <span className="font-medium">{bond.caseNumber || '-'}</span>
                          {index === 0 && (
                            <>
                              <span className="text-gray-500">Agent</span>
                              <span className="font-medium">{watch('agentName')}</span>
                            </>
                          )}
                          <span className="text-gray-500">Charges</span>
                          <span className="font-medium">{bond.charges}</span>
                        </div>
                        {index < bondFields.length - 1 && (
                          <hr className="my-4 border-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Send Request */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Send E-Sign Request via Text Message
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    A text message will be sent to the co-signer with a link to complete and sign the application.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Sending to:</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {watch('coSigner.firstName')} {watch('coSigner.lastName')}
                    </p>
                  </div>
                  
                  <div className="max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cell Phone <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="coSigner.cellPhone"
                      control={control}
                      rules={{ 
                        required: 'Cell phone is required',
                        validate: (value) => (value?.replace(/\D/g, '').length === 10) || 'Must be 10 digits'
                      }}
                      render={({ field }) => (
                        <PhoneInput
                          {...field}
                          placeholder="303-269-8547"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Confirm the number above is correct before sending.
                    </p>
                  </div>
                  
                  {/* Hidden field to keep deliveryMethod as sms */}
                  <input type="hidden" {...methods.register('deliveryMethod')} value="sms" />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
