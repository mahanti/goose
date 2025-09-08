import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import LinkPreview from './LinkPreview';
import ImagePreview from './ImagePreview';
import GooseResponseForm from './GooseResponseForm';
import { extractUrls } from '../utils/urlUtils';
import { extractImagePaths, removeImagePathsFromText } from '../utils/imageUtils';
import { formatMessageTimestamp } from '../utils/timeUtils';
import MarkdownContent from './MarkdownContent';
import ToolCallWithResponse from './ToolCallWithResponse';
import ToolCallChain from './ToolCallChain';
import {
  identifyConsecutiveToolCalls,
  shouldHideMessage,
  getChainForMessage,
} from '../utils/toolCallChaining';
import {
  Message,
  getTextContent,
  getToolRequests,
  getToolResponses,
  getToolConfirmationContent,
  createToolErrorResponseMessage,
} from '../types/message';
import ToolCallConfirmation from './ToolCallConfirmation';
import MessageCopyLink from './MessageCopyLink';
import { NotificationEvent } from '../hooks/useMessageStream';
import { cn } from '../utils';

interface GooseMessageProps {
  // messages up to this index are presumed to be "history" from a resumed session, this is used to track older tool confirmation requests
  // anything before this index should not render any buttons, but anything after should
  sessionId: string;
  messageHistoryIndex: number;
  message: Message;
  messages: Message[];
  metadata?: string[];
  toolCallNotifications: Map<string, NotificationEvent[]>;
  append: (value: string) => void;
  appendMessage: (message: Message) => void;
  isStreaming?: boolean; // Whether this message is currently being streamed
}

export default function GooseMessage({
  sessionId,
  messageHistoryIndex,
  message,
  metadata,
  messages,
  toolCallNotifications,
  append,
  appendMessage,
  isStreaming = false,
}: GooseMessageProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  
  
  // Track which tool confirmations we've already handled to prevent infinite loops
  const handledToolConfirmations = useRef<Set<string>>(new Set());

  // Extract text content from the message
  let textContent = getTextContent(message);

  // Utility to split Chain-of-Thought (CoT) from the visible assistant response.
  // If the text contains a <think>...</think> block, everything inside is treated as the
  // CoT and removed from the user-visible text.
  const splitChainOfThought = (text: string): { visibleText: string; cotText: string | null } => {
    const regex = /<think>([\s\S]*?)<\/think>/i;
    const match = text.match(regex);
    if (!match) {
      return { visibleText: text, cotText: null };
    }

    const cotRaw = match[1].trim();
    const visibleText = text.replace(regex, '').trim();

    return {
      visibleText,
      cotText: cotRaw || null,
    };
  };

  // Split out Chain-of-Thought
  const { visibleText, cotText } = splitChainOfThought(textContent);

  // Extract image paths from the message content
  const imagePaths = extractImagePaths(visibleText);

  // Remove image paths from text for display
  const displayText =
    imagePaths.length > 0 ? removeImagePathsFromText(visibleText, imagePaths) : visibleText;

  // Memoize the timestamp
  const timestamp = useMemo(() => formatMessageTimestamp(message.created), [message.created]);

  // Get tool requests from the message
  const toolRequests = getToolRequests(message);

  // Get current message index
  const messageIndex = messages.findIndex((msg) => msg.id === message.id);

  // Enhanced chain detection that works during streaming
  const toolCallChains = useMemo(() => {
    // Always run chain detection, but handle streaming messages specially
    const chains = identifyConsecutiveToolCalls(messages);

    // If this message is streaming and has tool calls but no text,
    // check if it should extend an existing chain
    if (isStreaming && toolRequests.length > 0 && !displayText.trim()) {
      // Look for an existing chain that this message could extend
      const previousMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
      if (previousMessage) {
        const prevToolRequests = getToolRequests(previousMessage);

        // If previous message has tool calls (with or without text), extend its chain
        if (prevToolRequests.length > 0) {
          // Find if previous message is part of a chain
          const prevChain = chains.find((chain) => chain.includes(messageIndex - 1));
          if (prevChain) {
            // Extend the existing chain to include this streaming message
            const extendedChains = chains.map((chain) =>
              chain === prevChain ? [...chain, messageIndex] : chain
            );
            return extendedChains;
          } else {
            // Create a new chain with previous and current message
            return [...chains, [messageIndex - 1, messageIndex]];
          }
        }
      }
    }

    return chains;
  }, [messages, isStreaming, messageIndex, toolRequests, displayText]);

  // Check if this message should be hidden (part of chain but not first)
  const shouldHide = shouldHideMessage(messageIndex, toolCallChains);

  // Get the chain this message belongs to
  const messageChain = getChainForMessage(messageIndex, toolCallChains);

  // Extract URLs under a few conditions
  // 1. The message is purely text
  // 2. The link wasn't also present in the previous message
  // 3. The message contains the explicit http:// or https:// protocol at the beginning
  const previousMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
  const previousUrls = previousMessage ? extractUrls(getTextContent(previousMessage)) : [];
  const urls = toolRequests.length === 0 ? extractUrls(displayText, previousUrls) : [];

  const toolConfirmationContent = getToolConfirmationContent(message);
  const hasToolConfirmation = toolConfirmationContent !== undefined;

  // Find tool responses that correspond to the tool requests in this message
  const toolResponsesMap = useMemo(() => {
    const responseMap = new Map();

    // Look for tool responses in subsequent messages
    if (messageIndex !== undefined && messageIndex >= 0) {
      for (let i = messageIndex + 1; i < messages.length; i++) {
        const responses = getToolResponses(messages[i]);

        for (const response of responses) {
          // Check if this response matches any of our tool requests
          const matchingRequest = toolRequests.find((req) => req.id === response.id);
          if (matchingRequest) {
            responseMap.set(response.id, response);
          }
        }
      }
    }

    return responseMap;
  }, [messages, messageIndex, toolRequests]);

  useEffect(() => {
    // If the message is the last message in the resumed session and has tool confirmation, it means the tool confirmation
    // is broken or cancelled, to contonue use the session, we need to append a tool response to avoid mismatch tool result error.
    if (
      messageIndex === messageHistoryIndex - 1 &&
      hasToolConfirmation &&
      toolConfirmationContent &&
      !handledToolConfirmations.current.has(toolConfirmationContent.id)
    ) {
      // Only append the error message if there isn't already a response for this tool confirmation
      const hasExistingResponse = messages.some((msg) =>
        getToolResponses(msg).some((response) => response.id === toolConfirmationContent.id)
      );

      if (!hasExistingResponse) {
        // Mark this tool confirmation as handled to prevent infinite loop
        handledToolConfirmations.current.add(toolConfirmationContent.id);

        appendMessage(
          createToolErrorResponseMessage(toolConfirmationContent.id, 'The tool call is cancelled.')
        );
      }
    }
  }, [
    messageIndex,
    messageHistoryIndex,
    hasToolConfirmation,
    toolConfirmationContent,
    messages,
    appendMessage,
  ]);

  // If this message should be hidden (part of chain but not first), don't render it
  if (shouldHide) {
    return null;
  }

  // Determine rendering logic based on chain membership and content
  const isFirstInChain = messageChain && messageChain[0] === messageIndex;

  // Context menu button click handler
  const handleContextButtonClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is on the context menu itself
      const target = event.target as Element;
      if (target.closest('[data-context-menu]')) {
        return; // Don't close if clicking inside the context menu
      }
      setContextMenu({ visible: false, x: 0, y: 0 });
    };

    // Use a timeout to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  // Copy message text
  const handleCopyMessage = useCallback(() => {
    if (displayText && navigator.clipboard) {
      navigator.clipboard.writeText(displayText);
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [displayText]);

  return (
    <div className="goose-message flex w-full justify-center min-w-0">
      <div className="flex flex-col w-full min-w-0">
        {cotText && (
          <details className="bg-bgSubtle border border-borderSubtle rounded p-2">
            <summary className="cursor-pointer text-sm text-textSubtle select-none">
              Show thinking
            </summary>
            <div className="mt-2">
              <MarkdownContent content={cotText} />
            </div>
          </details>
        )}

        {displayText && (
          <div className="flex flex-col group">
            <div className="flex justify-center w-full">
              <div className="flex-col max-w-[720px] w-full flex items-start">
                <div className="relative flex items-start">
                  <div className="flex bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-3xl py-2.5 px-4 w-fit">
                    <div ref={contentRef}>
                      <MarkdownContent 
                        content={displayText} 
                        className="text-gray-800 dark:text-gray-200 prose-a:text-gray-800 dark:prose-a:text-gray-200 prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-strong:text-gray-800 dark:prose-strong:text-gray-200 prose-em:text-gray-800 dark:prose-em:text-gray-200 agent-message"
                      />
                    </div>
                  </div>
                  
                  {/* Context menu trigger button */}
                  <button
                    className="ml-2 mt-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={handleContextButtonClick}
                    onContextMenu={handleContextButtonClick}
                    title="Message options"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
                
                {/* Image previews - contained within max-width */}
                {imagePaths.length > 0 && (
                  <div className="mt-4">
                    {imagePaths.map((imagePath, index) => (
                      <ImagePreview key={index} src={imagePath} />
                    ))}
                  </div>
                )}

                {/* Timestamp and copy button - hidden */}
                {toolRequests.length === 0 && (
                  <div className="relative h-2 flex justify-start w-full">
                    <div className="absolute w-40 font-mono left-0 text-xs text-text-muted pt-1 opacity-0">
                      {!isStreaming && timestamp}
                    </div>
                    {message.content.every((content) => content.type === 'text') && !isStreaming && (
                      <div className="absolute left-0 pt-1 flex items-center gap-2 opacity-0">
                        <MessageCopyLink text={displayText} contentRef={contentRef} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
          <div 
            data-context-menu="true"
            className="fixed bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 z-50 py-2 min-w-48"
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 200)}px`,
              boxShadow: '0 12px 32px 0 rgba(0, 0, 0, 0.04), 0 8px 16px 0 rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 0 1px 0 rgba(0, 0, 0, 0.20)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Timestamp */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {timestamp}
              </span>
            </div>
            
            {/* Copy option */}
            <button
              onClick={handleCopyMessage}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy message
            </button>
            
            {/* Edit option (placeholder for future implementation) */}
            <button
              onClick={() => setContextMenu({ visible: false, x: 0, y: 0 })}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit message
            </button>
            
            {/* Regenerate option */}
            <button
              onClick={() => setContextMenu({ visible: false, x: 0, y: 0 })}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>
        )}

        {toolRequests.length > 0 && (
          <div className={cn(displayText && 'mt-1')}>
            {isFirstInChain ? (
              <ToolCallChain
                messages={messages}
                chainIndices={messageChain}
                toolCallNotifications={toolCallNotifications}
                toolResponsesMap={toolResponsesMap}
                messageHistoryIndex={messageHistoryIndex}
                isStreaming={isStreaming}
              />
            ) : !messageChain ? (
              <div className="relative flex flex-col w-full">
                <div className="flex justify-center w-full">
                  <div className="max-w-[720px] w-full">
                    <div className="flex flex-col gap-3">
                      {toolRequests.map((toolRequest) => (
                        <div className="goose-message-tool pr-8" key={toolRequest.id}>
                          <ToolCallWithResponse
                            isCancelledMessage={
                              messageIndex < messageHistoryIndex &&
                              toolResponsesMap.get(toolRequest.id) == undefined
                            }
                            toolRequest={toolRequest}
                            toolResponse={toolResponsesMap.get(toolRequest.id)}
                            notifications={toolCallNotifications.get(toolRequest.id)}
                            isStreamingMessage={isStreaming}
                            append={append}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {hasToolConfirmation && (
          <ToolCallConfirmation
            sessionId={sessionId}
            isCancelledMessage={messageIndex == messageHistoryIndex - 1}
            isClicked={messageIndex < messageHistoryIndex}
            toolConfirmationId={toolConfirmationContent.id}
            toolName={toolConfirmationContent.toolName}
          />
        )}

        {/* Link preview - contained within max-width and forced below message */}
        {urls.length > 0 && (
          <div className="w-full clear-both mt-4">
            <div className="flex justify-center w-full">
              <div className="max-w-[720px] w-full">
                <div className="flex flex-col gap-2 w-full">
                  {urls.map((url, index) => (
                    <div key={index} className="w-full block">
                      <LinkPreview url={url} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* enable or disable prompts here */}
      {/* NOTE from alexhancock on 1/14/2025 - disabling again temporarily due to non-determinism in when the forms show up */}
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && metadata && (
        <div className="flex mt-[16px]">
          <GooseResponseForm message={displayText} metadata={metadata || null} append={append} />
        </div>
      )}
    </div>
  );
}
