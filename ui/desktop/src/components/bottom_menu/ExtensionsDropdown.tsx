import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Puzzle } from 'lucide-react';
import { useConfig, FixedExtensionEntry } from '../ConfigContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { toggleExtension } from '../settings/extensions/index';
import { extractExtensionConfig } from '../settings/extensions/utils';
import { getFriendlyTitle } from '../settings/extensions/subcomponents/ExtensionList';
import { useExtensionToast } from '../../hooks/useExtensionToast';

interface ExtensionsDropdownProps {
  className?: string;
}

export const ExtensionsDropdown: React.FC<ExtensionsDropdownProps> = ({ className = '' }) => {
  const { getExtensions, addExtension, extensionsList } = useConfig();
  const { showExtensionLoading, updateExtensionToast } = useExtensionToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Track toggling states for each extension with visual state management
  const [togglingExtensions, setTogglingExtensions] = useState<Set<string>>(new Set());
  const [visualStates, setVisualStates] = useState<Map<string, boolean>>(new Map());
  const dropdownId = useRef('extensions-dropdown');

  // Fetch extensions when dropdown opens (only if we don't have data)
  useEffect(() => {
    if (isOpen && extensionsList.length === 0) {
      getExtensions(false); // Don't force refresh, just get if needed
    }
  }, [isOpen, getExtensions, extensionsList.length]);

  // Sync visual states with actual extension states when not toggling
  useEffect(() => {
    const newVisualStates = new Map(visualStates);
    let hasChanges = false;

    extensionsList.forEach((ext) => {
      const isToggling = togglingExtensions.has(ext.name);
      if (!isToggling && visualStates.get(ext.name) !== ext.enabled) {
        newVisualStates.set(ext.name, ext.enabled);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setVisualStates(newVisualStates);
    }
  }, [extensionsList, visualStates, togglingExtensions]);

  // Filter and sort extensions based on search query
  const filteredExtensions = useMemo(() => {
    const filtered = extensionsList.filter((ext) => {
      const friendlyTitle = getFriendlyTitle(ext).toLowerCase();
      const name = ext.name.toLowerCase();
      const query = searchQuery.toLowerCase();
      return friendlyTitle.includes(query) || name.includes(query);
    });

    // Sort: enabled first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return getFriendlyTitle(a).localeCompare(getFriendlyTitle(b));
    });
  }, [extensionsList, searchQuery]);

  const enabledCount = extensionsList.filter((ext) => ext.enabled).length;

  const handleToggle = async (extension: FixedExtensionEntry) => {
    // Prevent multiple toggles while one is in progress
    if (togglingExtensions.has(extension.name)) return;

    setTogglingExtensions((prev) => new Set(prev).add(extension.name));

    // Immediately update visual state for responsive UI
    const newState = !extension.enabled;
    setVisualStates((prev) => new Map(prev).set(extension.name, newState));

    const extensionName = getFriendlyTitle(extension);
    const isEnabling = !extension.enabled;

    // Show custom toast (loading state)
    showExtensionLoading(extensionName, isEnabling ? 'Enabling' : 'Disabling');

    try {
      const toggleDirection = extension.enabled ? 'toggleOff' : 'toggleOn';
      const extensionConfig = extractExtensionConfig(extension);

      await toggleExtension({
        toggle: toggleDirection,
        extensionConfig: extensionConfig,
        addToConfig: addExtension,
        toastOptions: { silent: true }, // Keep built-in toasts silent, we handle our own
      });

      // Refresh the extensions list to get updated state
      await getExtensions(true);

      // Update toast to success state
      updateExtensionToast(extensionName, true, isEnabling ? 'Enabled' : 'Disabled');
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      // Revert visual state on error
      setVisualStates((prev) => new Map(prev).set(extension.name, !newState));
      // Update toast to error state
      updateExtensionToast(extensionName, false, isEnabling ? 'Enabled' : 'Disabled');
    } finally {
      // Clean up loading state
      setTogglingExtensions((prev) => {
        const next = new Set(prev);
        next.delete(extension.name);
        return next;
      });
    }
  };

  // Listen for global dropdown close events
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCloseAllDropdowns = (event: any) => {
      // Don't close this dropdown if it was the one that sent the event
      if (event.detail?.senderId !== dropdownId.current && isOpen) {
        setIsOpen(false);
        setSearchQuery(''); // Clear search when closing
      }
    };

    window.addEventListener('close-all-dropdowns', handleCloseAllDropdowns);

    return () => {
      window.removeEventListener('close-all-dropdowns', handleCloseAllDropdowns);
    };
  }, [isOpen]);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          // Close all other dropdowns when this one opens
          window.dispatchEvent(
            new CustomEvent('close-all-dropdowns', {
              detail: { senderId: dropdownId.current },
            })
          );
        }
        setIsOpen(open);
        if (!open) {
          setSearchQuery(''); // Clear search when closing
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center justify-center text-text-default/70 hover:text-text-default text-xs cursor-pointer transition-spring-colors rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7 ${className}`}
          title={`Extensions (${enabledCount} enabled)`}
        >
          <Puzzle className="mr-1" size={14} />
          <span>{enabledCount}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        className="w-80 max-h-96 p-6 z-[100] bg-background-default shadow-lg border border-border-default rounded-2xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
        collisionPadding={10}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Puzzle size={16} className="text-text-muted" />
            <span className="font-medium text-sm">Extensions</span>
            <span className="text-xs text-text-muted">({enabledCount} enabled)</span>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-muted"
            />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto mt-4">
          {filteredExtensions.length === 0 ? (
            <div className="py-4 text-center text-xs text-text-muted">
              {searchQuery ? 'No extensions match your search' : 'No extensions available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredExtensions.map((extension) => (
                <div
                  key={extension.name}
                  className="flex items-center justify-between p-2 hover:bg-background-muted rounded-md group transition-spring-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        togglingExtensions.has(extension.name)
                          ? 'bg-yellow-500 animate-pulse'
                          : (visualStates.get(extension.name) ?? extension.enabled)
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {getFriendlyTitle(extension)}
                      </div>
                      <div className="text-xs text-text-muted truncate">{extension.name}</div>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center">
                    <Switch
                      checked={visualStates.get(extension.name) ?? extension.enabled}
                      onCheckedChange={() => handleToggle(extension)}
                      disabled={togglingExtensions.has(extension.name)}
                      variant="mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
