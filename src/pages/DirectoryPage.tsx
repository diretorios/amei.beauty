import { useState, useEffect, useCallback } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { api, ApiError } from '../lib/api';
import { CardPreview } from '../components/CardPreview';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useScreenReaderAnnouncement } from '../components/ScreenReaderAnnouncer';
import type { PublishedCard } from '../models/types';

export function DirectoryPage() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<PublishedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFeatured, setShowFeatured] = useState(false);
  const { announce, Announcer } = useScreenReaderAnnouncement();

  const limit = 20;

  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getDirectory({
        page,
        limit,
        featured: showFeatured,
      });

      setCards(result.cards);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      
      // Announce results to screen readers
      if (result.total === 0) {
        announce(t('a11y.search_results_none'), 'polite');
      } else if (result.total === 1) {
        announce(t('a11y.search_results_single'), 'polite');
      } else {
        announce(t('a11y.search_results', { count: result.total }), 'polite');
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new Error('Failed to load directory');
      setError(apiError.message);
      announce(apiError.message, 'assertive');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, showFeatured, announce, t]);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.search({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        limit,
        offset: (page - 1) * limit,
      });

      setCards(result.cards);
      setTotalPages(Math.ceil(result.total / limit));
      setTotal(result.total);
      
      // Announce search results to screen readers
      if (result.total === 0) {
        announce(t('a11y.search_results_none'), 'polite');
      } else if (result.total === 1) {
        announce(t('a11y.search_results_single'), 'polite');
      } else {
        announce(t('a11y.search_results', { count: result.total }), 'polite');
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new Error('Failed to search');
      setError(apiError.message);
      announce(apiError.message, 'assertive');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, page, limit, announce, t]);

  useEffect(() => {
    if (searchQuery || selectedCategory || selectedLocation) {
      performSearch();
    } else {
      loadDirectory();
    }
  }, [searchQuery, selectedCategory, selectedLocation, page, showFeatured, performSearch, loadDirectory]);

  const handleSearch = (e: Event) => {
    e.preventDefault();
    setPage(1);
    if (searchQuery || selectedCategory || selectedLocation) {
      performSearch();
    } else {
      loadDirectory();
    }
  };

  const categories = [
    { value: '', label: t('directory.categories.all') },
    { value: 'cabelo', label: t('directory.categories.hair') },
    { value: 'unhas', label: t('directory.categories.nails') },
    { value: 'maquiagem', label: t('directory.categories.makeup') },
    { value: 'depilação', label: t('directory.categories.waxing') },
    { value: 'estética', label: t('directory.categories.aesthetics') },
  ];

  return (
    <main id="main-content" className="directory-page" role="main">
      <Announcer />
      <header className="directory-header">
        <h1>{t('directory.title')}</h1>
        <p className="directory-subtitle" aria-live="polite" aria-atomic="true">
          {total > 0 ? `${total} ${total === 1 ? 'profissional encontrado' : 'profissionais encontrados'}` : ''}
        </p>
      </header>

      <div className="directory-filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <Input
              id="search"
              type="search"
              placeholder={t('directory.search_placeholder')}
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              className="search-input"
            />
            <Button type="submit" variant="primary">
              {t('directory.search')}
            </Button>
          </div>

          <div className="filter-group">
            <label htmlFor="category" className="filter-label">
              {t('directory.filters.category')}
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.currentTarget.value);
                setPage(1);
              }}
              className="filter-select"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="location" className="filter-label">
              {t('directory.filters.location')}
            </label>
            <Input
              id="location"
              type="text"
              placeholder="Ex: São Paulo"
              value={selectedLocation}
              onInput={(e) => {
                setSelectedLocation((e.target as HTMLInputElement).value);
                setPage(1);
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showFeatured}
                onChange={(e) => {
                  setShowFeatured(e.currentTarget.checked);
                  setPage(1);
                }}
              />
              <span>{t('directory.featured') || 'Destaques'}</span>
            </label>
          </div>
        </form>
      </div>

      {error && (
        <div className="directory-error">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="directory-loading" role="status" aria-live="polite" aria-label={t('loading')}>
          <p>{t('loading')}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="directory-empty" role="status" aria-live="polite">
          <p>{t('directory.empty')}</p>
        </div>
      ) : (
        <>
          <div className="directory-grid">
            {cards.map((card) => (
              <CardPreview key={card.id} card={card} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="directory-pagination">
              <Button
                variant="outline"
                onClick={() => {
                  setPage(page - 1);
                  announce(t('a11y.pagination_page', { current: page - 1, total: totalPages }), 'polite');
                }}
                disabled={page === 1}
              >
                {t('buttons.back')}
              </Button>
              <span className="pagination-info" aria-live="polite" aria-atomic="true">
                {t('directory.page') || 'Página'} {page} {t('directory.of') || 'de'} {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setPage(page + 1);
                  announce(t('a11y.pagination_page', { current: page + 1, total: totalPages }), 'polite');
                }}
                disabled={page >= totalPages}
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

