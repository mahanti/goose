import { useState, useEffect } from 'react';
import { getFriendlyTitle } from './ExtensionList';
import { FixedExtensionEntry } from '../../../ConfigContext';

interface ExtensionLogoProps {
  extension: FixedExtensionEntry;
  size?: number;
}

// Logo API configuration - try multiple sources
const LOGO_SOURCES = [
  {
    name: 'logokit',
    baseUrl: 'https://img.logokit.com',
    token: 'pk_f5n4zcCWR-yD10tBAf4w9A',
    format: (domain: string) => `https://img.logokit.com/${domain}?token=pk_f5n4zcCWR-yD10tBAf4w9A&fallback=monogram`
  },
  {
    name: 'clearbit',
    baseUrl: 'https://logo.clearbit.com',
    format: (domain: string) => `https://logo.clearbit.com/${domain}`
  },
  {
    name: 'google_favicon',
    baseUrl: 'https://www.google.com/s2/favicons',
    format: (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }
];

// Generate a consistent color based on extension name
function generateColor(name: string): string {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
    '#27ae60', '#8e44ad', '#2980b9', '#f1c40f', '#d35400',
    '#c0392b', '#7f8c8d', '#17a2b8', '#28a745', '#dc3545',
    '#ffc107', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'
  ];
  
  // Create a simple hash of the extension name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Extract domain from extension name - return null if no valid domain can be determined
function getLogoIdentifier(extension: FixedExtensionEntry): string | null {
  // Try to extract domain from common patterns
  const name = getFriendlyTitle(extension).toLowerCase();
  
  // Check if it's already a domain-like string
  if (name.includes('.')) {
    return name;
  }
  
  // For common services, map to their domains
  const domainMappings: Record<string, string> = {
    'github': 'github.com',
    'gitlab': 'gitlab.com',
    'slack': 'slack.com',
    'discord': 'discord.com',
    'microsoft': 'microsoft.com',
    'google': 'google.com',
    'aws': 'aws.amazon.com',
    'azure': 'azure.microsoft.com',
    'docker': 'docker.com',
    'kubernetes': 'kubernetes.io',
    'jira': 'atlassian.com',
    'confluence': 'atlassian.com',
    'notion': 'notion.so',
    'trello': 'trello.com',
    'figma': 'figma.com',
    'shopify': 'shopify.com',
    'stripe': 'stripe.com',
    'paypal': 'paypal.com',
    'developer': 'github.com',
    'computer': 'apple.com',
    'visualiser': 'tableau.com',
    'memory': 'brain.fm',
    'tutorial': 'coursera.com',
    'postgres': 'postgresql.org',
    'mysql': 'mysql.com',
    'mongodb': 'mongodb.com',
    'redis': 'redis.io',
    'elasticsearch': 'elastic.co',
    'terraform': 'terraform.io',
    'ansible': 'ansible.com',
    'jenkins': 'jenkins.io',
    'circleci': 'circleci.com',
    'travis': 'travis-ci.org',
    'vercel': 'vercel.com',
    'netlify': 'netlify.com',
    'heroku': 'heroku.com',
    'digitalocean': 'digitalocean.com'
  };
  
  // Check if the extension name matches any known service
  for (const [service, domain] of Object.entries(domainMappings)) {
    if (name.includes(service)) {
      return domain;
    }
  }
  
  // If no specific domain mapping found, return null to prevent invalid API calls
  return null;
}

export default function ExtensionLogo({ extension, size = 40 }: ExtensionLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  const friendlyTitle = getFriendlyTitle(extension);
  const logoIdentifier = getLogoIdentifier(extension);
  const fallbackColor = generateColor(extension.name);
  const firstLetter = friendlyTitle.charAt(0).toUpperCase();
  
  // Determine the current logo source and URL
  let logoUrl: string | null = null;
  if (logoIdentifier && currentSourceIndex < LOGO_SOURCES.length) {
    const currentSource = LOGO_SOURCES[currentSourceIndex];
    // Only attempt Google Favicons if logoIdentifier is a valid domain
    if (currentSource.name === 'google_favicon' && !logoIdentifier.includes('.')) {
      // Skip this source if it's Google Favicons and not a domain
      // This will trigger handleImageError and try the next source
      logoUrl = null; 
    } else {
      logoUrl = currentSource.format(logoIdentifier);
    }
  }
  
  const logoStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  const handleImageError = () => {
    // Try next logo source
    if (currentSourceIndex < LOGO_SOURCES.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      // All sources failed, show fallback
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Auto-advance to next source if current logoUrl is null (invalid source)
  useEffect(() => {
    if (!logoUrl && logoIdentifier && currentSourceIndex < LOGO_SOURCES.length - 1) {
      handleImageError();
    } else if (!logoUrl && (!logoIdentifier || currentSourceIndex >= LOGO_SOURCES.length - 1)) {
      // No valid identifier or exhausted sources, show fallback immediately
      setIsLoading(false);
      setHasError(true);
    }
  }, [logoUrl, logoIdentifier, currentSourceIndex]);
  
  // Show fallback circle with letter if loading, error, or no logo URL
  if (isLoading || hasError || !logoUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          ...logoStyle,
          backgroundColor: fallbackColor,
        }}
      >
        <span
          className="text-white font-semibold select-none"
          style={{
            fontSize: Math.floor(size * 0.4),
            lineHeight: 1,
          }}
        >
          {firstLetter}
        </span>
        {/* Only render the hidden image if there's a logoUrl to try and no final error */}
        {!hasError && logoUrl && (
          <img
            src={logoUrl}
            alt={`${friendlyTitle} logo`}
            className="absolute opacity-0 pointer-events-none"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>
    );
  }
  
  // Show actual logo
  return (
    <div
      className="flex items-center justify-center rounded overflow-hidden flex-shrink-0 bg-white"
      style={logoStyle}
    >
      <img
        src={logoUrl}
        alt={`${friendlyTitle} logo`}
        className="max-w-full max-h-full object-contain"
        style={{ width: '80%', height: '80%' }}
        onError={handleImageError}
      />
    </div>
  );
}
