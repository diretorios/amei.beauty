import { useTranslation } from '../hooks/useTranslation';

interface TextareaProps extends preact.JSX.HTMLAttributes<HTMLTextAreaElement> {
  labelKey?: string;
  errorKey?: string;
  helpKey?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

export function Textarea({ labelKey, errorKey, helpKey, className = '', ...props }: TextareaProps) {
  const { t } = useTranslation();
  const hasError = !!errorKey;

  return (
    <div className="input-group">
      {labelKey && (
        <label htmlFor={props.id} className="input-label">
          {t(labelKey)}
        </label>
      )}
      <textarea
        className={`input ${hasError ? 'input-error' : ''} ${className}`.trim()}
        aria-invalid={hasError}
        aria-describedby={helpKey ? `${props.id}-help` : undefined}
        rows={4}
        {...props}
      />
      {helpKey && !hasError && (
        <div id={`${props.id}-help`} className="input-help">
          {t(helpKey)}
        </div>
      )}
      {errorKey && (
        <div className="input-error-message" role="alert">
          {t(errorKey)}
        </div>
      )}
    </div>
  );
}

