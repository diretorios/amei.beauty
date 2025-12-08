import { useTranslation } from '../hooks/useTranslation';

interface InputProps extends preact.JSX.HTMLAttributes<HTMLInputElement> {
  labelKey?: string;
  errorKey?: string;
  helpKey?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

export function Input({ labelKey, errorKey, helpKey, className = '', ...props }: InputProps) {
  const { t } = useTranslation();
  const hasError = !!errorKey;

  return (
    <div className="input-group">
      {labelKey && (
        <label htmlFor={props.id} className="input-label">
          {t(labelKey)}
        </label>
      )}
      <input
        className={`input ${hasError ? 'input-error' : ''} ${className}`.trim()}
        aria-invalid={hasError}
        aria-describedby={
          hasError && errorKey
            ? `${props.id}-error${helpKey ? ` ${props.id}-help` : ''}`
            : helpKey
            ? `${props.id}-help`
            : undefined
        }
        aria-errormessage={hasError && errorKey ? `${props.id}-error` : undefined}
        {...props}
      />
      {helpKey && !hasError && (
        <div id={`${props.id}-help`} className="input-help">
          {t(helpKey)}
        </div>
      )}
      {errorKey && (
        <div 
          className="input-error-message" 
          role="alert"
          id={`${props.id}-error`}
          aria-live="polite"
        >
          {t(errorKey)}
        </div>
      )}
    </div>
  );
}

