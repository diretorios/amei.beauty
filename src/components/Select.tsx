import { useTranslation } from '../hooks/useTranslation';

interface SelectProps extends preact.JSX.HTMLAttributes<HTMLSelectElement> {
  labelKey?: string;
  errorKey?: string;
  helpKey?: string;
  value?: string;
  required?: boolean;
  children: preact.ComponentChildren;
}

export function Select({ labelKey, errorKey, helpKey, className = '', required, children, ...props }: SelectProps) {
  const { t } = useTranslation();
  const hasError = !!errorKey;

  // Build aria-describedby: only reference IDs that actually exist in the DOM
  // When there's an error, only reference the error (help text is hidden)
  // When there's no error but there's help, reference the help
  const describedBy = hasError && errorKey
    ? `${props.id}-error`
    : helpKey && !hasError
    ? `${props.id}-help`
    : undefined;

  return (
    <div className="input-group">
      {labelKey && (
        <label htmlFor={props.id} className="input-label">
          {t(labelKey)}
          {required && <span aria-label={t('errors.required')}> *</span>}
        </label>
      )}
      <select
        className={`input ${hasError ? 'input-error' : ''} ${className}`.trim()}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        aria-errormessage={hasError && errorKey ? `${props.id}-error` : undefined}
        aria-required={required}
        required={required}
        {...props}
      >
        {children}
      </select>
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

