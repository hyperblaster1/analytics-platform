'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Add timeout to fetch call (2 minutes max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      let response: Response;
      try {
        response = await fetch('/api/ingest', { 
          method: 'POST',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 2 minutes');
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        setMessage(
          `Refreshed: ${data.podsUpdated} pods, ${data.statsSuccess} stats success, ${data.statsFailure} failures`
        );
        // Refresh the page data after a short delay
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/ingest', { method: 'POST' })
        .then(() => {
          // Silently refresh the page data after ingestion
          router.refresh();
        })
        .catch(() => {
          // Silently fail for auto-refresh
        });
    }, 60_000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="mb-4 flex items-center gap-4">
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Now'}
      </button>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
}

