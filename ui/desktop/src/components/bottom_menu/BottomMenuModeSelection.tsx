import { useEffect, useCallback, useState, useRef } from 'react';
import { Tornado } from 'lucide-react';
import { all_goose_modes, ModeSelectionItem } from '../settings/mode/ModeSelectionItem';
import { useConfig } from '../ConfigContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const BottomMenuModeSelection = () => {
  const [gooseMode, setGooseMode] = useState('auto');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownId = useRef('mode-selection-dropdown');
  const { read, upsert } = useConfig();

  const fetchCurrentMode = useCallback(async () => {
    try {
      const mode = (await read('GOOSE_MODE', false)) as string;
      if (mode) {
        setGooseMode(mode);
      }
    } catch (error) {
      console.error('Error fetching current mode:', error);
    }
  }, [read]);

  useEffect(() => {
    fetchCurrentMode();
  }, [fetchCurrentMode]);

  // Listen for global dropdown close events
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCloseAllDropdowns = (event: any) => {
      // Don't close this dropdown if it was the one that sent the event
      if (event.detail?.senderId !== dropdownId.current && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('close-all-dropdowns', handleCloseAllDropdowns);

    return () => {
      window.removeEventListener('close-all-dropdowns', handleCloseAllDropdowns);
    };
  }, [isDropdownOpen]);

  const handleModeChange = async (newMode: string) => {
    if (gooseMode === newMode) {
      return;
    }

    try {
      await upsert('GOOSE_MODE', newMode, false);
      setGooseMode(newMode);
    } catch (error) {
      console.error('Error updating goose mode:', error);
      throw new Error(`Failed to store new goose mode: ${newMode}`);
    }
  };

  function getValueByKey(key: string) {
    const mode = all_goose_modes.find((mode) => mode.key === key);
    return mode ? mode.label : 'auto';
  }

  function getModeDescription(key: string) {
    const mode = all_goose_modes.find((mode) => mode.key === key);
    return mode ? mode.description : 'Automatic mode selection';
  }

  return (
    <div title={`Current mode: ${getValueByKey(gooseMode)} - ${getModeDescription(gooseMode)}`}>
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={(open) => {
          if (open) {
            // Close all other dropdowns when this one opens
            window.dispatchEvent(
              new CustomEvent('close-all-dropdowns', {
                detail: { senderId: dropdownId.current },
              })
            );
          }
          setIsDropdownOpen(open);
        }}
      >
        <DropdownMenuTrigger asChild>
          <span className="flex items-center cursor-pointer [&_svg]:size-4 text-text-default/70 hover:text-text-default hover:scale-100 text-xs rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7">
            <Tornado className="mr-1 h-4 w-4" />
            {getValueByKey(gooseMode).toLowerCase()}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-6 rounded-2xl" side="top" align="center">
          {all_goose_modes.map((mode) => (
            <DropdownMenuItem key={mode.key} asChild>
              <ModeSelectionItem
                mode={mode}
                currentMode={gooseMode}
                showDescription={false}
                isApproveModeConfigure={false}
                handleModeChange={handleModeChange}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
