import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getStepPath, STEP_LABELS, type AppStep } from '../domain/steps';

interface StepNavigationProps {
  currentStep: AppStep;
}

const allSteps: AppStep[] = [1, 2, 3, 4, 5];

export function StepNavigation({ currentStep }: StepNavigationProps) {
  const previousStep = currentStep > 1 ? ((currentStep - 1) as AppStep) : null;
  const nextStep = currentStep < 5 ? ((currentStep + 1) as AppStep) : null;

  return (
    <nav className="step-navigation" aria-label="流程步骤">
      <div className="step-links">
        {allSteps.map((step) => (
          <a
            key={step}
            className={`step-link ${step === currentStep ? 'is-current' : ''}`}
            href={getStepPath(step)}
            aria-label={STEP_LABELS[step]}
            aria-current={step === currentStep ? 'step' : undefined}
          >
            <span className="step-link-number">{String(step).padStart(2, '0')}</span>
            <span>{STEP_LABELS[step].slice(5)}</span>
          </a>
        ))}
      </div>
      <div className="step-direction-links">
        {previousStep && (
          <a className="step-direction" href={getStepPath(previousStep)}>
            <ArrowLeft size={15} aria-hidden="true" />
            <span>上一步</span>
          </a>
        )}
        {nextStep && (
          <a className="step-direction step-direction--next" href={getStepPath(nextStep)}>
            <span>下一步</span>
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        )}
      </div>
    </nav>
  );
}
