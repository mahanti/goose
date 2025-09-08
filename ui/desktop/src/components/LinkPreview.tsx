import { useEffect, useState } from 'react';
import { Card } from './ui/card';

interface Metadata {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  url: string;
}

interface LinkPreviewProps {
  url: string;
}

async function fetchMetadata(url: string): Promise<Metadata> {
  try {
    // Fetch the HTML content using the main process
    const html = await window.electron.fetchMetadata(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const baseUrl = new URL(url);

    // Extract title
    const title =
      doc.querySelector('title')?.textContent ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content');

    // Extract description
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content');

    // Extract favicon
    const faviconLink =
      doc.querySelector('link[rel="icon"]') ||
      doc.querySelector('link[rel="shortcut icon"]') ||
      doc.querySelector('link[rel="apple-touch-icon"]') ||
      doc.querySelector('link[rel="apple-touch-icon-precomposed"]');

    let favicon = faviconLink?.getAttribute('href');
    if (favicon) {
      favicon = new URL(favicon, baseUrl).toString();
    } else {
      // Fallback to /favicon.ico
      favicon = new URL('/favicon.ico', baseUrl).toString();
    }

    // Extract OpenGraph image
    let image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (image) {
      image = new URL(image, baseUrl).toString();
    }

    return {
      title: title || url,
      description: description || undefined,
      favicon,
      image: image || undefined,
      url,
    };
  } catch (error) {
    console.error('❌ Error fetching metadata:', error);
    return {
      title: url,
      description: undefined,
      favicon: undefined,
      image: undefined,
      url,
    };
  }
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchMetadata(url);
        if (mounted) {
          setMetadata(data);
        }
      } catch (err) {
        if (mounted) {
          console.error('❌ Failed to fetch metadata:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  if (!metadata || !metadata.title) {
    return null;
  }

  return (
    <div className="w-full block" style={{ display: 'block', width: '100%' }}>
      <a href={url} target="_blank" rel="noreferrer" className="block w-3/5" style={{ display: 'block', width: '60%' }}>
        <div
          data-slot="card"
          className="block w-full bg-link-preview dark:bg-link-preview-dark p-3 rounded-xl border shadow-sm transition-colors cursor-pointer hover:shadow-md"
          style={{ 
            display: 'block !important',
            width: '100% !important',
            clear: 'both',
            marginBottom: '0.5rem'
          }}
        >
          {/* Header with favicon and title */}
          <div className="flex items-center gap-2 mb-2">
            {metadata.favicon && (
              <img
                src={metadata.favicon}
                alt="Site favicon"
                className="w-4 h-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <h4 className="text-sm font-medium truncate">{metadata.title || url}</h4>
          </div>
          
          {/* Description */}
          {metadata.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{metadata.description}</p>
          )}
          
          {/* Preview image */}
          {metadata.image && (
            <img
              src={metadata.image}
              alt="Preview"
              className="w-full h-32 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      </a>
    </div>
  );
}
