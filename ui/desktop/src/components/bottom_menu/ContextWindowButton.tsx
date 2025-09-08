import { FaCircle } from 'react-icons/fa';
import { ScrollText } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ContextWindowButtonProps {
  currentTokens: number;
  totalTokens: number;
  isCompacting: boolean;
  onCompact: () => void;
}

export function ContextWindowButton({ 
  currentTokens, 
  totalTokens, 
  isCompacting, 
  onCompact 
}: ContextWindowButtonProps) {
  // Calculate percentage
  const percentage = totalTokens > 0 ? Math.round((currentTokens / totalTokens) * 100) : 0;

  // Don't render if no token data
  if (!currentTokens || !totalTokens) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 px-2.5"
        >
          {/* Green dot */}
          <div className="text-[#00b300]">
            <FaCircle size={1} />
          </div>
          {/* Percentage text */}
          <span className="text-xs font-medium">{percentage}%</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-72 text-sm">
        <div className="">
          {/* Header */}
          <div className="mb-3">
            <h6 className="text-sm font-medium text-textProminent mb-1">
              Context window
            </h6>
          </div>

          {/* Token Usage Dots */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-textSubtle mb-2">
              <span>{currentTokens?.toLocaleString()} tokens</span>
              <span>{totalTokens?.toLocaleString()} total</span>
            </div>
            <div className="flex justify-between w-full">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-[2px] w-[2px] rounded-full',
                    i < Math.round((currentTokens / totalTokens) * 30)
                      ? 'bg-[var(--text-base)]'
                      : 'bg-[var(--text-30)]'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Compact Button */}
          <Button
            onClick={onCompact}
            disabled={!currentTokens || isCompacting}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
          >
            <ScrollText size={14} />
            {isCompacting ? 'Compacting...' : 'Compact messages'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
