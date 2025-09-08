import {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { FileIcon } from './FileIcon';
import { FixedExtensionEntry, useConfig } from './ConfigContext';
import { getFriendlyTitle } from './settings/extensions/subcomponents/ExtensionList';
import ExtensionLogo from './settings/extensions/subcomponents/ExtensionLogo';
import { Users } from 'lucide-react';
import { cn } from '../utils';
// Removed DropdownMenuContent import - using custom styled divs to avoid Menu context requirement

interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  relativePath: string;
}

export interface FileItemWithMatch extends FileItem {
  matchScore: number;
  matches: number[];
  matchedText: string;
}

interface ExtensionItem {
  name: string;
  displayName: string;
  extension: FixedExtensionEntry;
}

export interface ExtensionItemWithMatch extends ExtensionItem {
  matchScore: number;
  matches: number[];
  matchedText: string;
}

export type MentionItem = 
  | { type: 'file'; item: FileItemWithMatch }
  | { type: 'extension'; item: ExtensionItemWithMatch };

interface ExtensionMentionPopoverProps {
  isOpen: boolean;
  onSelect: (value: string, type: 'file' | 'extension') => void;
  position: { x: number; y: number };
  query: string;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

// Enhanced fuzzy matching algorithm
const fuzzyMatch = (pattern: string, text: string): { score: number; matches: number[] } => {
  if (!pattern) return { score: 0, matches: [] };

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();
  const matches: number[] = [];

  let patternIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      matches.push(i);
      patternIndex++;
      consecutiveMatches++;

      // Bonus for consecutive matches
      score += consecutiveMatches * 3;

      // Bonus for matches at word boundaries
      if (
        i === 0 ||
        textLower[i - 1] === '/' ||
        textLower[i - 1] === '_' ||
        textLower[i - 1] === '-' ||
        textLower[i - 1] === '.' ||
        textLower[i - 1] === ' '
      ) {
        score += 10;
      }
    } else {
      consecutiveMatches = 0;
    }
  }

  // Only return a score if all pattern characters were matched
  if (patternIndex === patternLower.length) {
    score -= text.length * 0.05;

    // Bonus for exact substring matches
    if (textLower.includes(patternLower)) {
      score += 20;
    }

    return { score, matches };
  }

  return { score: -1, matches: [] };
};

const ExtensionMentionPopover = forwardRef<
  { getDisplayItems: () => MentionItem[]; selectItem: (index: number) => void },
  ExtensionMentionPopoverProps
>(({ isOpen, onSelect, position, query, selectedIndex, onSelectedIndexChange }, ref) => {
  const { extensionsList } = useConfig();
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Get enabled extensions
  const enabledExtensions = useMemo(() => 
    extensionsList?.filter(ext => ext.enabled) || [], [extensionsList]
  );

  // Load files when needed - using working directory
  useEffect(() => {
    if (isOpen && allFiles.length === 0 && !isLoadingFiles) {
      setIsLoadingFiles(true);
      const loadFiles = async () => {
        try {
          // Get working directory from config and list files
          const config = window.electron.getConfig();
          const workingDir = (config.GOOSE_WORKING_DIR as string) || process.cwd() || '.';
          
          const fileList = await window.electron.listFiles(workingDir);
          
          // Convert string array to FileItem array
          const fileItems: FileItem[] = fileList
            .filter(fileName => 
              // Filter for common file types and avoid hidden files
              !fileName.startsWith('.') && 
              (fileName.includes('.') || fileName.toLowerCase() === 'readme')
            )
            .slice(0, 20) // Limit to first 20 files
            .map(fileName => ({
              path: `${workingDir}/${fileName}`,
              name: fileName,
              isDirectory: !fileName.includes('.'),
              relativePath: fileName,
            }));
          
          setAllFiles(fileItems);
        } catch (error) {
          console.error('Failed to load files for mentions:', error);
          // Gracefully handle error - just show extensions without files
          setAllFiles([]);
        } finally {
          setIsLoadingFiles(false);
        }
      };
      loadFiles();
    }
  }, [isOpen, allFiles.length, isLoadingFiles]);

  // Filter and score items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // No query - show enabled extensions first, then recent files
      const extensionItems: MentionItem[] = enabledExtensions.map(ext => ({
        type: 'extension' as const,
        item: {
          name: ext.name,
          displayName: getFriendlyTitle(ext),
          extension: ext,
          matchScore: 100, // High score for no query
          matches: [],
          matchedText: getFriendlyTitle(ext),
        }
      }));

      const fileItems: MentionItem[] = allFiles.slice(0, 5).map(file => ({
        type: 'file' as const,
        item: {
          ...file,
          matchScore: 50, // Lower than extensions for no query
          matches: [],
          matchedText: file.name,
        }
      }));

      return [...extensionItems, ...fileItems];
    }

    const results: MentionItem[] = [];

    // Match extensions
    enabledExtensions.forEach(extension => {
      const displayName = getFriendlyTitle(extension);
      const nameMatch = fuzzyMatch(query, displayName);
      const extensionNameMatch = fuzzyMatch(query, extension.name);
      
      // Use the better of the two matches
      const bestMatch = nameMatch.score > extensionNameMatch.score ? nameMatch : extensionNameMatch;
      
      if (bestMatch.score > 0) {
        results.push({
          type: 'extension',
          item: {
            name: extension.name,
            displayName,
            extension,
            matchScore: bestMatch.score + 10, // Slight bonus for extensions
            matches: bestMatch.matches,
            matchedText: nameMatch.score > extensionNameMatch.score ? displayName : extension.name,
          }
        });
      }
    });

    // Match files
    allFiles.forEach(file => {
      const nameMatch = fuzzyMatch(query, file.name);
      const pathMatch = fuzzyMatch(query, file.relativePath);
      
      // Use the better of the two matches
      const bestMatch = nameMatch.score > pathMatch.score ? nameMatch : pathMatch;
      
      if (bestMatch.score > 0) {
        results.push({
          type: 'file',
          item: {
            ...file,
            matchScore: bestMatch.score,
            matches: bestMatch.matches,
            matchedText: nameMatch.score > pathMatch.score ? file.name : file.relativePath,
          }
        });
      }
    });

    // Sort by score (highest first)
    return results.sort((a, b) => b.item.matchScore - a.item.matchScore).slice(0, 10);
  }, [query, enabledExtensions, allFiles]);

  const selectItem = useCallback((index: number) => {
    if (index >= 0 && index < filteredItems.length) {
      const item = filteredItems[index];
      if (item.type === 'extension') {
        onSelect(`@${item.item.name}`, 'extension');
      } else {
        onSelect(item.item.path, 'file');
      }
    }
  }, [filteredItems, onSelect]);

  useImperativeHandle(ref, () => ({
    getDisplayItems: () => filteredItems,
    selectItem,
  }), [filteredItems, selectItem]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onSelectedIndexChange(Math.min(selectedIndex + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSelectedIndexChange(Math.max(selectedIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          selectItem(selectedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          // Don't handle escape here - let parent handle it
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
    return undefined;
  }, [isOpen, selectedIndex, filteredItems.length, onSelectedIndexChange, selectItem]);

  // Auto-adjust selectedIndex when filtered items change
  useEffect(() => {
    if (selectedIndex >= filteredItems.length && filteredItems.length > 0) {
      onSelectedIndexChange(filteredItems.length - 1);
    }
  }, [filteredItems.length, selectedIndex, onSelectedIndexChange]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && selectedIndex >= 0 && popoverRef.current) {
      const selectedElement = popoverRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen || filteredItems.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 12}px`,
        transform: 'translateY(-100%)',
      }}
    >
      <div
        ref={popoverRef}
        className="bg-background-default text-text-default data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] rounded-3xl p-6 shadow-elevated space-y-0.5 animate-swift-spring-all w-72 text-sm max-h-[400px] overflow-hidden"
      >
        <div className="px-2 py-2 border-b">
          <h6 className="text-xs text-textProminent mb-2">Extensions & Files</h6>
          {isLoadingFiles && (
            <div className="text-xs text-textSubtle p-2 text-center">
              Loading...
            </div>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredItems.length === 0 && !isLoadingFiles ? (
            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
              <span className="text-textSubtle">No matches found</span>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={`${item.type}-${item.type === 'extension' ? item.item.name : item.item.path}`}
                data-index={index}
                className={cn(
                  "focus:bg-background-muted focus:text-text-muted data-[variant=destructive]:text-text-danger data-[variant=destructive]:focus:bg-background-danger/10 dark:data-[variant=destructive]:focus:bg-background-danger/20 data-[variant=destructive]:focus:text-text-danger data-[variant=destructive]:*:[svg]:!text-text-danger [&_svg:not([class*='text-'])]:text-text-muted relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
                  "cursor-pointer hover:bg-background-muted hover:text-text-muted",
                  index === selectedIndex && "bg-background-muted text-text-muted"
                )}
                onClick={() => selectItem(index)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {item.type === 'extension' ? (
                        <ExtensionLogo extension={item.item.extension} size={16} />
                      ) : (
                        <FileIcon 
                          fileName={item.item.name} 
                          isDirectory={item.item.isDirectory} 
                          className="w-4 h-4" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.type === 'extension' ? (
                          <span>@{item.item.displayName}</span>
                        ) : (
                          <span>{item.item.name}</span>
                        )}
                      </div>
                      <div className="text-xs text-textSubtle truncate">
                        {item.type === 'extension' 
                          ? item.item.extension.type === 'builtin' ? 'Built-in extension' : `${item.item.extension.type} extension`
                          : item.item.relativePath
                        }
                      </div>
                    </div>
                  </div>
                  {item.type === 'extension' && (
                    <Users size={12} className="ml-2 text-textSubtle" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ExtensionMentionPopover.displayName = 'ExtensionMentionPopover';

export default ExtensionMentionPopover;
