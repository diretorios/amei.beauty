import { useEffect, useState, useCallback } from 'preact/hooks';

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * Component for announcing messages to screen readers.
 * Uses aria-live regions to ensure screen readers announce dynamic content changes.
 */
export function ScreenReaderAnnouncer({ 
  message, 
  priority = 'polite',
  clearAfter = 1000 
}: ScreenReaderAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear the announcement after a delay to allow re-announcement of the same message
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {announcement}
    </div>
  );
}

/**
 * Hook for announcing messages to screen readers.
 * Returns a function to announce messages.
 */
export function useScreenReaderAnnouncement() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((msg: string, pri: 'polite' | 'assertive' = 'polite') => {
    setPriority(pri);
    setMessage(msg);
  }, []);

  return {
    announce,
    Announcer: () => <ScreenReaderAnnouncer message={message} priority={priority} />,
  };
}

