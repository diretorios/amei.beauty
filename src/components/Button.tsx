import { useTranslation } from '../hooks/useTranslation';

interface ButtonProps extends preact.JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  labelKey?: string;
  children?: preact.ComponentChildren;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  labelKey,
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const { t } = useTranslation();
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  
  // Get the button's accessible name
  const accessibleName = labelKey ? t(labelKey) : (typeof children === 'string' ? children : '');
  const loadingLabel = isLoading && accessibleName 
    ? t('a11y.button_loading', { button: accessibleName }) || `${accessibleName}, ${t('loading')}`
    : t('loading');

  return (
    <button 
      className={classes} 
      disabled={disabled || isLoading} 
      aria-busy={isLoading}
      aria-label={isLoading && accessibleName ? loadingLabel : undefined}
      {...props}
    >
      {isLoading ? t('loading') : labelKey ? t(labelKey) : children}
    </button>
  );
}

