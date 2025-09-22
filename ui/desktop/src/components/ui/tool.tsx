'use client';

import * as React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from './button';

export type ToolState = 'pending' | 'running' | 'completed' | 'error';

export interface ToolPart {
  type: string;
  state: ToolState;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolCallId?: string;
  errorText?: string;
}

interface ToolProps {
  toolPart: ToolPart;
  defaultOpen?: boolean;
  className?: string;
}

const stateStyles = {
  pending: 'text-muted-foreground',
  running: 'text-blue-600',
  completed: 'text-green-600',
  error: 'text-red-600',
};

const stateIcons = {
  pending: null,
  running: <Loader2 className="h-3 w-3 animate-spin" />,
  completed: <div className="h-2 w-2 rounded-full bg-green-600" />,
  error: <div className="h-2 w-2 rounded-full bg-red-600" />,
};

export function Tool({ toolPart, defaultOpen = false, className }: ToolProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const { type, state, input, output, errorText } = toolPart;

  const toggleOpen = () => setIsOpen(!isOpen);

  // Auto-expand when running or if there's an error
  React.useEffect(() => {
    if (state === 'running' || state === 'error') {
      setIsOpen(true);
    }
  }, [state]);

  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground', className)}>
      <Button
        variant="ghost"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between p-4 hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          {stateIcons[state]}
          <span className={cn('font-medium', stateStyles[state])}>{type}</span>
          <span className={cn('text-sm', stateStyles[state])}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
        </div>
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
      </Button>

      {isOpen && (
        <div className="border-t p-4 space-y-3">
          {/* Input Section */}
          {input && Object.keys(input).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Input</h4>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output Section */}
          {output && Object.keys(output).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Output</h4>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Section */}
          {errorText && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-red-600">Error</h4>
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                {errorText}
              </div>
            </div>
          )}

          {/* Tool Call ID */}
          {toolPart.toolCallId && (
            <div className="text-xs text-muted-foreground">ID: {toolPart.toolCallId}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Tool;
