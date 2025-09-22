import Tool, { ToolPart, ToolState } from './ui/tool';
import { ToolRequestMessageContent, ToolResponseMessageContent } from '../types/message';
import { LoadingStatus } from './ui/Dot';
import { NotificationEvent } from '../hooks/useMessageStream';
import { snakeToTitleCase } from '../utils';

interface GooseToolDisplayProps {
  toolRequest: ToolRequestMessageContent;
  toolResponse?: ToolResponseMessageContent;
  notifications?: NotificationEvent[];
  isStreamingMessage?: boolean;
  isCancelledMessage?: boolean;
}

// Convert Goose LoadingStatus to prompt-kit ToolState
const mapLoadingStatusToToolState = (
  loadingStatus: LoadingStatus,
  isStreaming: boolean,
  hasResponse: boolean
): ToolState => {
  if (isStreaming && !hasResponse) {
    return 'running';
  }

  switch (loadingStatus) {
    case 'success':
      return 'completed';
    case 'error':
      return 'error';
    case 'loading':
      return 'running';
    default:
      return 'pending';
  }
};

// Extract tool name for display
const getDisplayToolName = (fullToolName: string): string => {
  const toolName = fullToolName.substring(fullToolName.lastIndexOf('__') + 2);
  return snakeToTitleCase(toolName);
};

// Convert tool response to output format
const convertToolOutput = (
  toolResponse?: ToolResponseMessageContent
): Record<string, unknown> | undefined => {
  if (!toolResponse?.toolResult?.value) {
    return undefined;
  }

  const results = toolResponse.toolResult.value
    .filter((item) => {
      const audience = item.annotations?.audience as string[] | undefined;
      return !audience || audience.includes('user');
    })
    .map((item) => {
      if (item.type === 'text' && 'text' in item) {
        return item.text;
      } else if (item.type === 'image') {
        return `[Image: ${item.mimeType || 'unknown'}]`;
      } else if (item.type === 'resource') {
        return item;
      }
      return item;
    });

  if (results.length === 0) {
    return undefined;
  }

  // Wrap results in an object to match Record<string, unknown> type
  if (results.length === 1) {
    const result = results[0];
    if (typeof result === 'string') {
      return { output: result };
    }
    return result as unknown as Record<string, unknown>;
  }

  return { results };
};

// Extract error text from tool response
const getErrorText = (toolResponse?: ToolResponseMessageContent): string | undefined => {
  if (toolResponse?.toolResult?.status === 'error') {
    if (toolResponse.toolResult.value && Array.isArray(toolResponse.toolResult.value)) {
      const errorContent = toolResponse.toolResult.value.find(
        (item) => item.type === 'text' && 'text' in item
      );
      return errorContent && 'text' in errorContent ? errorContent.text : 'Tool execution failed';
    }
    return 'Tool execution failed';
  }
  return undefined;
};

export default function GooseToolDisplay({
  toolRequest,
  toolResponse,
  notifications,
  isStreamingMessage = false,
}: GooseToolDisplayProps) {
  const toolCall = toolRequest.toolCall.status === 'success' ? toolRequest.toolCall.value : null;

  if (!toolCall) {
    return null;
  }

  // Determine loading status
  const hasResponse = !!toolResponse;
  const isStreamingComplete = !isStreamingMessage;
  const shouldShowAsComplete = isStreamingComplete && !toolResponse;

  const loadingStatus: LoadingStatus = !toolResponse
    ? shouldShowAsComplete
      ? 'success'
      : 'loading'
    : toolResponse.toolResult.status;

  // Convert to prompt-kit format
  const toolPart: ToolPart = {
    type: getDisplayToolName(toolCall.name),
    state: mapLoadingStatusToToolState(loadingStatus, isStreamingMessage, hasResponse),
    input: Object.keys(toolCall.arguments).length > 0 ? toolCall.arguments : undefined,
    output: convertToolOutput(toolResponse),
    toolCallId: toolRequest.id,
    errorText: getErrorText(toolResponse),
  };

  // Auto-expand when running, has error, or user preference for detailed view
  const responseStyle = localStorage.getItem('response_style');
  const shouldDefaultOpen =
    toolPart.state === 'running' ||
    toolPart.state === 'error' ||
    responseStyle === 'detailed' ||
    responseStyle === null;

  return (
    <div className="w-full">
      <Tool
        toolPart={toolPart}
        defaultOpen={shouldDefaultOpen}
        className="border-borderSubtle bg-background-muted"
      />

      {/* Show logs if available */}
      {notifications && notifications.length > 0 && (
        <div className="mt-2 p-3 border border-borderSubtle rounded-lg bg-background-muted">
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Logs</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {notifications
              .filter((n) => n.message.method === 'notifications/message')
              .map((notification, index) => {
                const logText =
                  typeof notification.message.params?.data === 'string'
                    ? notification.message.params.data
                    : JSON.stringify(notification.message.params?.data);

                return (
                  <div key={index} className="text-xs text-textSubtle font-mono">
                    {logText}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Show progress if available */}
      {notifications &&
        notifications.some((n) => n.message.method === 'notifications/progress') && (
          <div className="mt-2 p-3 border border-borderSubtle rounded-lg bg-background-muted">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Progress</h4>
            {notifications
              .filter((n) => n.message.method === 'notifications/progress')
              .map((notification, index) => {
                const progress = notification.message.params as {
                  progress: number;
                  total?: number;
                  message?: string;
                  progressToken: string;
                };
                const percent = progress.total ? (progress.progress / progress.total) * 100 : 0;

                return (
                  <div key={index} className="space-y-2">
                    {progress.message && (
                      <div className="text-xs text-textSubtle">{progress.message}</div>
                    )}
                    <div className="w-full bg-background-subtle rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-spring"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
    </div>
  );
}
