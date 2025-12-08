import { useEffect, useState } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import { i18n } from './lib/i18n';
import { storage } from './lib/storage';
import { Navigation } from './components/Navigation';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { PublicCardPage } from './pages/PublicCardPage';
import { EditPage } from './pages/EditPage';
import { AddSocialNetworksPage } from './pages/AddSocialNetworksPage';
import { AddPersonalizedLinksPage } from './pages/AddPersonalizedLinksPage';
import { AddServicesAndPricesPage } from './pages/AddServicesAndPricesPage';

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Initialize i18n and storage, then check for existing profile
    Promise.all([i18n.init(), storage.init()]).then(async () => {
      setIsInitialized(true);
      // Check if profile exists
      const existingCard = await storage.loadCard();
      if (existingCard && existingCard.profile.full_name) {
        setHasProfile(true);
      }

      // Check for payment success/cancel in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const cardId = urlParams.get('card_id');
      
      if (paymentStatus === 'success' && cardId) {
        // Payment successful - refresh card status
        try {
          const { api } = await import('./lib/api');
          await api.getCard(cardId);
          // Show success message
          alert('Payment successful! Updates unlocked for 12 months.');
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error('Failed to refresh card after payment:', error);
        }
      } else if (paymentStatus === 'cancelled') {
        // Payment cancelled
        alert('Payment cancelled. You can try again anytime.');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    });
  }, []);

  if (!isInitialized) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading application">
        Loading...
      </div>
    );
  }

  // Show onboarding if no profile exists (unless viewing public card)
  if (!hasProfile && !currentPath.startsWith('/card/') && !currentPath.startsWith('/@')) {
    return <OnboardingPage onComplete={() => setHasProfile(true)} />;
  }

  return (
    <div className="app">
      <Navigation currentPath={currentPath} />
      <Router onChange={(e) => setCurrentPath(e.url)}>
        <Route path="/" component={ProfilePage} />
        <Route path="/edit" component={EditPage} />
        <Route path="/add-social-networks" component={AddSocialNetworksPage} />
        <Route path="/add-personalized-links" component={AddPersonalizedLinksPage} />
        <Route path="/add-services-and-prices" component={AddServicesAndPricesPage} />
        <Route path="/directory" component={DirectoryPage} />
        <Route
          path="/card/:cardId"
          component={(props: { cardId: string }) => <PublicCardPage cardId={props.cardId} />}
        />
        <Route
          path="/:username"
          component={(props: { username: string }) => {
            // Don't match routes that start with known paths
            if (props.username === 'directory' || props.username === 'card' || props.username === 'edit' || props.username === 'add-social-networks' || props.username === 'add-personalized-links' || props.username === 'add-services-and-prices') {
              return null;
            }
            return <PublicCardPage username={props.username} />;
          }}
        />
      </Router>
    </div>
  );
}

