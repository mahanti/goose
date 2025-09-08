import React from 'react';
import { Message, ToolRequestMessageContent, ToolResponseMessageContent } from '../../types/message';
import { FixedExtensionEntry } from '../ConfigContext';
import { ExtensionMessageAttribution } from './ExtensionAvatar';
import { getFriendlyTitle } from '../settings/extensions/subcomponents/ExtensionList';
import { Card } from '../ui/card';
import MarkdownContent from '../MarkdownContent';
import ToolCallWithResponse from '../ToolCallWithResponse';
import { Clock } from 'lucide-react';

interface ExtensionMessageProps {
  message: Message;
  extension?: FixedExtensionEntry;
  showAttribution?: boolean;
  className?: string;
}

// Helper to extract extension name from tool call name
function extractExtensionFromToolCall(toolName: string): string | null {
  // Tool names follow pattern: "extension__tool_name"
  const parts = toolName.split('__');
  return parts.length > 1 ? parts[0] : null;
}

// Helper to get action description from tool call
function getActionFromToolCall(toolName: string, args: Record<string, unknown>): string {
  const parts = toolName.split('__');
  const actualTool = parts.length > 1 ? parts[1] : toolName;
  
  // Create human-readable action descriptions
  const actionMap: Record<string, (args: Record<string, unknown>) => string> = {
    'text_editor': (args) => {
      const command = args.command as string;
      const path = args.path as string;
      const fileName = path ? path.split('/').pop() : 'file';
      
      switch (command) {
        case 'view': return `viewing ${fileName}`;
        case 'write': return `writing to ${fileName}`;
        case 'str_replace': return `editing ${fileName}`;
        case 'insert': return `adding to ${fileName}`;
        default: return `working with ${fileName}`;
      }
    },
    'shell': () => 'running command',
    'web_scrape': (args) => {
      const url = args.url as string;
      const domain = url ? new URL(url).hostname : 'website';
      return `scraping ${domain}`;
    },
    'computer_control': () => 'controlling system',
    'screen_capture': () => 'taking screenshot',
    'automation_script': () => 'running automation',
    'read_resource': (args) => `reading ${args.uri}`,
    'list_resources': () => 'listing resources',
    'call_tool': (args) => `using ${args.name}`,
  };

  const actionFn = actionMap[actualTool];
  return actionFn ? actionFn(args) : `using ${actualTool}`;
}

export default function ExtensionMessage({ 
  message, 
  extension, 
  showAttribution = true, 
  className = '' 
}: ExtensionMessageProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.created * 1000);

  // Extract extension info from tool calls if not provided
  let messageExtension = extension;
  let action = '';

  if (!messageExtension && message.content.length > 0) {
    for (const content of message.content) {
      if (content.type === 'toolRequest') {
        const toolRequest = content as ToolRequestMessageContent;
        if (toolRequest.toolCall.status === 'success' && toolRequest.toolCall.value) {
          const toolName = toolRequest.toolCall.value.name;
          const extensionName = extractExtensionFromToolCall(toolName);
          
          if (extensionName) {
            // You'd need to find the extension object by name here
            // For now, we'll create a minimal extension object
            messageExtension = {
              name: extensionName,
              enabled: true,
              type: 'unknown'
            } as FixedExtensionEntry;
            
            action = getActionFromToolCall(toolName, toolRequest.toolCall.value.arguments);
          }
          break;
        }
      }
    }
  }

  return (
    <div className={`group relative ${className}`}>
      {/* Extension Attribution */}
      {showAttribution && messageExtension && (
        <ExtensionMessageAttribution 
          extension={messageExtension} 
          action={action}
          className="ml-12"
        />
      )}

      {/* Message Card */}
      <Card className={`
        ${isUser ? 'ml-12 mr-4 bg-blue-50' : 'mr-12 ml-4 bg-white'}
        ${messageExtension ? 'border-l-4 border-l-blue-400' : ''}
        transition-all duration-200 hover:shadow-md
      `}>
        <div className="p-4">
          {/* Message Content */}
          <div className="space-y-3">
            {message.content.map((content, index) => {
              switch (content.type) {
                case 'text':
                  return (
                    <div key={index}>
                      <MarkdownContent content={content.text} />
                    </div>
                  );

                case 'toolRequest':
                  const toolRequest = content as ToolRequestMessageContent;
                  return (
                    <div key={index}>
                      <ToolCallWithResponse
                        id={toolRequest.id}
                        toolCall={toolRequest.toolCall}
                        toolResult={undefined}
                        onRetry={() => {}}
                      />
                    </div>
                  );

                case 'toolResponse':
                  const toolResponse = content as ToolResponseMessageContent;
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-2">Tool Result:</div>
                      {toolResponse.toolResult.status === 'success' && toolResponse.toolResult.value ? (
                        toolResponse.toolResult.value.map((resultContent, resultIndex) => (
                          <div key={resultIndex} className="text-sm">
                            {resultContent.type === 'text' ? (
                              <MarkdownContent content={resultContent.text} />
                            ) : (
                              <div>Non-text result</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-red-600">
                          {toolResponse.toolResult.error || 'Tool execution failed'}
                        </div>
                      )}
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Clock size={12} />
            {timestamp.toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Specialized component for extension collaboration messages
export function ExtensionCollaborationMessage({
  extensions,
  action,
  details,
  timestamp
}: {
  extensions: FixedExtensionEntry[];
  action: string;
  details?: string;
  timestamp?: Date;
}) {
  return (
    <div className="flex items-center justify-center my-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-dashed border-2 border-blue-200">
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {extensions.map((ext, index) => (
              <React.Fragment key={ext.name}>
                <div className="flex items-center gap-2">
                  {getFriendlyTitle(ext)}
                </div>
                {index < extensions.length - 1 && (
                  <span className="text-gray-400">+</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-sm font-medium text-gray-700">{action}</div>
          {details && (
            <div className="text-xs text-gray-500 mt-1">{details}</div>
          )}
          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
