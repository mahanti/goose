import { useState, useEffect } from 'react';
import { Switch } from '../../../ui/switch';
import { FixedExtensionEntry } from '../../../ConfigContext';
import { getSubtitle, getFriendlyTitle } from './ExtensionList';
import { Card } from '../../../ui/card';

interface ExtensionItemProps {
  extension: FixedExtensionEntry;
  onToggle: (extension: FixedExtensionEntry) => Promise<boolean | void> | void;
  onConfigure?: (extension: FixedExtensionEntry) => void;
  isStatic?: boolean; // to not allow users to edit configuration
}

export default function ExtensionItem({
  extension,
  onToggle,
  onConfigure,
  isStatic,
}: ExtensionItemProps) {
  // Add local state to track the visual toggle state
  const [visuallyEnabled, setVisuallyEnabled] = useState(extension.enabled);
  // Track if we're in the process of toggling
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (ext: FixedExtensionEntry) => {
    // Prevent multiple toggles while one is in progress
    if (isToggling) return;

    setIsToggling(true);

    // Immediately update visual state
    const newState = !ext.enabled;
    setVisuallyEnabled(newState);

    try {
      // Call the actual toggle function that performs the async operation
      await onToggle(ext);
      // Success case is handled by the useEffect below when extension.enabled changes
    } catch {
      // If there was an error, revert the visual state
      console.log('Toggle failed, reverting visual state');
      setVisuallyEnabled(!newState);
    } finally {
      setIsToggling(false);
    }
  };

  // Update visual state when the actual extension state changes
  useEffect(() => {
    if (!isToggling) {
      setVisuallyEnabled(extension.enabled);
    }
  }, [extension.enabled, isToggling]);

  const renderSubtitle = () => {
    const { description, command } = getSubtitle(extension);
    return (
      <>
        {description && <span>{description}</span>}
        {description && command && <br />}
        {command && <span className="font-mono text-xs">{command}</span>}
      </>
    );
  };

  // Bundled extensions and builtins are not editable
  // Over time we can take the first part of the conditional away as people have bundled: true in their config.yaml entries

  // allow configuration editing if extension is not a builtin/bundled extension AND isStatic = false
  const editable =
    !(extension.type === 'builtin' || ('bundled' in extension && extension.bundled)) && !isStatic;

  return (
    <Card
      className="py-2 px-4 mb-2 bg-background-default border-none hover:bg-background-muted cursor-pointer transition-all duration-150"
      onClick={() => handleToggle(extension)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base truncate max-w-[50vw]">{getFriendlyTitle(extension)}</h3>
          </div>
          <div className="text-sm text-text-muted mb-1 overflow-hidden break-words">
            {renderSubtitle()}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {editable && (
            <button
              className="px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted hover:text-text-standard transition-colors text-sm"
              onClick={() => (onConfigure ? onConfigure(extension) : () => {})}
              title="Configure extension"
            >
              Configure
            </button>
          )}
          <Switch
            checked={(isToggling && visuallyEnabled) || extension.enabled}
            onCheckedChange={() => handleToggle(extension)}
            disabled={isToggling}
            variant="mono"
          />
        </div>
      </div>
    </Card>
  );
}
