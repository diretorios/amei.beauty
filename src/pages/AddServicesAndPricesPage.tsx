import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData, Service } from '../models/types';
import type { PublishedCard } from '../models/types';

export function AddServicesAndPricesPage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCard();
    checkPublishedCard();
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      if (loadedCard) {
        setCard(loadedCard);
        const loadedServices = loadedCard.services || [];
        setServices(loadedServices);
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPublishedCard = async () => {
    try {
      const publishedCardId = await storage.getPreference('published_card_id');
      if (publishedCardId) {
        const card = await api.getCard(publishedCardId);
        setPublishedCard(card);
      }
    } catch (error) {
      console.error('Failed to load published card:', error);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;

    const newService: Service = {
      id: Date.now().toString(),
      name: newServiceName.trim(),
      price: newServicePrice.trim(),
      description: newServiceDescription.trim(),
    };

    setServices([...services, newService]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
  };

  const handleEditService = (index: number) => {
    const service = services[index];
    setNewServiceName(service.name);
    setNewServicePrice(service.price);
    setNewServiceDescription(service.description);
    setEditingIndex(index);
  };

  const handleUpdateService = () => {
    if (editingIndex === null || !newServiceName.trim()) return;

    const updatedServices = [...services];
    updatedServices[editingIndex] = {
      ...updatedServices[editingIndex],
      name: newServiceName.trim(),
      price: newServicePrice.trim(),
      description: newServiceDescription.trim(),
    };

    setServices(updatedServices);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
    setEditingIndex(null);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!card) return;

    setIsSaving(true);
    try {
      const updatedCard: CardData = {
        ...card,
        services: services,
        updated_at: new Date().toISOString(),
      };
      await storage.saveCard(updatedCard);
      // Navigate back to profile page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save services:', error);
      alert(t('errors.save_failed') || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="onboarding-page">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="onboarding-page">
        <p>No card found. Please complete onboarding first.</p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          {t('buttons.back')}
        </Button>
      </div>
    );
  }

  // Check if updates are locked
  const canUpdate = publishedCard?.can_update !== false;
  if (publishedCard && !canUpdate) {
    // Show lock status instead of form
    return (
      <div className="onboarding-page">
        <div className="onboarding-container">
          <h1 className="onboarding-title">{t('services.title')}</h1>
          <UpdateLockStatus
            card={publishedCard}
            onEndorsementRequest={() => {
              const cardUrl = publishedCard.username 
                ? `${window.location.origin}/@${publishedCard.username}`
                : `${window.location.origin}/card/${publishedCard.id}`;
              const message = `Apoie meu perfil! ${cardUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}
          />
          <div className="onboarding-actions" style={{ marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              {t('buttons.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1 className="onboarding-title">{t('services.title')}</h1>
        <p className="onboarding-subtitle">{t('buttons.add_services_and_prices')}</p>

        <div className="onboarding-step">
          {/* Display existing services */}
          {services.length > 0 && (
            <div className="services-list" style={{ marginBottom: '1.5rem' }}>
              {services.map((service, index) => (
                <div key={service.id} className="service-item" style={{ 
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{service.name}</h3>
                      {service.price && (
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--primary-color, #3b82f6)', marginBottom: '0.25rem' }}>
                          {service.price}
                        </div>
                      )}
                      {service.description && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.5rem' }}>
                          {service.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="outline"
                        onClick={() => handleEditService(index)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {t('services.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveService(index)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {t('services.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {services.length === 0 && (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: 'var(--text-secondary, #6b7280)',
              marginBottom: '1.5rem'
            }}>
              {t('services.empty')}
            </div>
          )}

          {/* Add/Edit service form */}
          <div className="add-service-form" style={{ 
            padding: '1rem',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: '0.5rem',
            backgroundColor: editingIndex !== null ? 'var(--bg-highlight, #fef3c7)' : 'transparent'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {editingIndex !== null ? t('services.edit') : t('services.add')}
            </h3>
            
            <Input
              id="service-name"
              labelKey="services.fields.name"
              placeholder={t('services.placeholders.name')}
              value={newServiceName}
              onInput={(e) => setNewServiceName((e.target as HTMLInputElement).value)}
              required
            />

            <Input
              id="service-price"
              labelKey="services.fields.price"
              placeholder={t('services.placeholders.price')}
              value={newServicePrice}
              onInput={(e) => setNewServicePrice((e.target as HTMLInputElement).value)}
              style={{ marginTop: '1rem' }}
            />

            <Textarea
              id="service-description"
              labelKey="services.fields.description"
              placeholder={t('services.placeholders.description')}
              value={newServiceDescription}
              onInput={(e) => setNewServiceDescription((e.target as HTMLTextAreaElement).value)}
              style={{ marginTop: '1rem' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {editingIndex !== null ? (
                <>
                  <Button
                    variant="primary"
                    onClick={handleUpdateService}
                    disabled={!newServiceName.trim()}
                  >
                    {t('buttons.save')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    {t('buttons.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleAddService}
                  disabled={!newServiceName.trim()}
                >
                  {t('services.add')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="onboarding-actions">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            disabled={isSaving}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {t('buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

