import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';

interface NavigationProps {
  currentPath?: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <a href="/" className="nav-logo">
          {t('app_name')}
        </a>
        <div className="nav-links">
          <a href="/" className={currentPath === '/' ? 'active' : ''}>
            {t('navigation.profile')}
          </a>
        </div>
        <LanguageSelector />
      </div>
    </nav>
  );
}

