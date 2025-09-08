'use client';

import React from 'react';
import { ChevronDown, Check, X, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

interface ToolPart {
  type: string;
  state: 'pending' | 'running' | 'completed' | 'error';
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

function getStateIcon(state: string) {
  switch (state) {
    case 'completed':
      return <Check className="w-4 h-4 text-green-500" />;
    case 'error':
      return <X className="w-4 h-4 text-red-500" />;
    case 'running':
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
}

function getStateColor(state: string) {
  switch (state) {
    case 'completed':
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
    case 'error':
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    case 'running':
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    case 'pending':
      return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    default:
      return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
  }
}

function Tool({ toolPart, defaultOpen = false, className }: ToolProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'border rounded-lg overflow-hidden transition-all duration-200',
          getStateColor(toolPart.state),
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 text-left hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 min-w-0">
              {getStateIcon(toolPart.state)}
              <span className="font-mono text-sm font-medium truncate">
                {toolPart.type}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {toolPart.state}
              </span>
            </div>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            {/* Tool Input */}
            {toolPart.input && Object.keys(toolPart.input).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Input</h4>
                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto">
                  <code>{JSON.stringify(toolPart.input, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Tool Output */}
            {toolPart.output && Object.keys(toolPart.output).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Output</h4>
                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto">
                  <code>{JSON.stringify(toolPart.output, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Error Text */}
            {toolPart.errorText && (
              <div>
                <h4 className="text-xs font-medium text-red-600 mb-1">Error</h4>
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
                  {toolPart.errorText}
                </div>
              </div>
            )}

            {/* Tool Call ID */}
            {toolPart.toolCallId && (
              <div className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{toolPart.toolCallId}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { Tool, type ToolPart };
