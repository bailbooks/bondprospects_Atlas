import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'step-indicator',
                index < currentStep && 'completed',
                index === currentStep && 'active',
                index > currentStep && 'pending'
              )}
            >
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span 
              className={clsx(
                'text-xs mt-1 whitespace-nowrap',
                index === currentStep ? 'text-brand-600 font-medium' : 'text-gray-400'
              )}
            >
              {step.title}
            </span>
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={clsx(
                'h-0.5 w-8 mx-2',
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
