/**
 * Hub Component
 *
 * The Hub is the main landing page and entry point for the Goose Desktop application.
 * It serves as the welcome screen where users can start new conversations.
 *
 * Key Responsibilities:
 * - Displays SessionInsights to show session statistics and recent chats
 * - Provides a ChatInput for users to start new conversations
 * - Navigates to Pair with the submitted message to start a new conversation
 * - Ensures each submission from Hub always starts a fresh conversation
 *
 * Navigation Flow:
 * Hub (input submission) → Pair (new conversation with the submitted message)
 */

import BaseChat from './BaseChat';
import { View, ViewOptions } from '../utils/navigationUtils';
import { ChatType } from '../types/chat';
import { useIsMobile } from '../hooks/use-mobile';
import { useSidebar } from './ui/sidebar';
import { cn } from '../utils';

export default function Hub({
  setView,
  setIsGoosehintsModalOpen,
  resetChat,
}: {
  setView: (view: View, viewOptions?: ViewOptions) => void;
  setIsGoosehintsModalOpen: (isOpen: boolean) => void;
  resetChat: () => void;
}) {
  const isMobile = useIsMobile();
  const { state: sidebarState } = useSidebar();

  // Create an empty chat object for the Hub
  const emptyChat: ChatType = {
    sessionId: '',
    title: 'New Chat',
    messages: [],
    recipeConfig: null,
    messageHistoryIndex: 0,
  };
  // Handle chat input submission - create new chat and navigate to pair
  const handleMessageSubmit = (message: string) => {
    if (message.trim()) {
      // Navigate to pair page with the message to be submitted
      // Pair will handle creating the new chat session
      resetChat();
      setView('pair', {
        disableAnimation: true,
        initialMessage: message,
      });
    }
  };

  return (
    <BaseChat
      chat={emptyChat}
      setChat={() => {}} // No-op since Hub doesn't need to update chat state
      loadingChat={false}
      autoSubmit={false}
      setView={setView}
      setIsGoosehintsModalOpen={setIsGoosehintsModalOpen}
      onMessageSubmit={handleMessageSubmit}
      contentClassName={cn('pr-1 pb-10', (isMobile || sidebarState === 'collapsed') && 'pt-11')}
      showPopularTopics={true}
      suppressEmptyState={false}
    />
  );
}
