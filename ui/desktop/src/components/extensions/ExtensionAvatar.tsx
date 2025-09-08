import React from 'react';
import { FixedExtensionEntry } from '../ConfigContext';
import { getFriendlyTitle } from '../settings/extensions/subcomponents/ExtensionList';
import ExtensionLogo from '../settings/extensions/subcomponents/ExtensionLogo';
import { Pill } from '../ui/Pill';

interface ExtensionAvatarProps {
  extension: FixedExtensionEntry;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm', 
  lg: 'text-base'
};

export default function ExtensionAvatar({ 
  extension, 
  size = 'md', 
  showName = false,
  showBadge = false,
  badgeText,
  className = '' 
}: ExtensionAvatarProps) {
  const avatarSize = sizeMap[size];
  const textSize = textSizeMap[size];
  const friendlyTitle = getFriendlyTitle(extension);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <ExtensionLogo extension={extension} size={avatarSize} />
        {showBadge && (
          <div className="absolute -top-1 -right-1">
            <Pill 
              variant="solid" 
              size="xs"
              className="h-4 px-1 text-xs leading-none"
            >
              {badgeText || '•'}
            </Pill>
          </div>
        )}
      </div>
      {showName && (
        <span className={`font-medium text-text-default truncate ${textSize}`}>
          {friendlyTitle}
        </span>
      )}
    </div>
  );
}

// Specialized version for message attribution
export function ExtensionMessageAttribution({ 
  extension, 
  action, 
  className = '' 
}: { 
  extension: FixedExtensionEntry; 
  action?: string;
  className?: string;
}) {
  const friendlyTitle = getFriendlyTitle(extension);
  
  return (
    <div className={`flex items-center gap-2 text-xs text-text-muted mb-2 ${className}`}>
      <ExtensionLogo extension={extension} size={16} />
      <span>
        <span className="font-medium">{friendlyTitle}</span>
        {action && <span className="ml-1">• {action}</span>}
      </span>
    </div>
  );
}

// Group of extension avatars (for group chats)
export function ExtensionAvatarGroup({ 
  extensions, 
  maxShow = 3, 
  size = 'sm',
  className = '' 
}: { 
  extensions: FixedExtensionEntry[]; 
  maxShow?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const avatarSize = sizeMap[size];
  const visibleExtensions = extensions.slice(0, maxShow);
  const remainingCount = extensions.length - maxShow;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1">
        {visibleExtensions.map((extension, index) => (
          <div 
            key={extension.name} 
            className="ring-2 ring-white rounded-full"
            style={{ zIndex: visibleExtensions.length - index }}
          >
            <ExtensionLogo extension={extension} size={avatarSize} />
          </div>
        ))}
        {remainingCount > 0 && (
          <div 
            className="ring-2 ring-white rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
            style={{ 
              width: avatarSize, 
              height: avatarSize,
              fontSize: Math.floor(avatarSize * 0.3),
              zIndex: 0
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
