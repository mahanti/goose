import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchSessions, type Session } from '../../sessions';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '../ui/sidebar';
import { useTextAnimator } from '../../hooks/use-text-animator';

interface SessionsSectionProps {
  onSelectSession: (sessionId: string) => void;
  refreshTrigger?: number;
}

export const SessionsSection: React.FC<SessionsSectionProps> = ({
  onSelectSession,
  refreshTrigger,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsWithDescriptions, setSessionsWithDescriptions] = useState<Set<string>>(new Set());

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const allSessions = await fetchSessions();
      // Sort by modified date (newest first)
      const sortedSessions = allSessions.sort((a, b) => 
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
      setSessions(sortedSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
    }
  }, []);

  // Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    console.log('SessionsSection: Debounced refresh triggered');
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    // Set new timeout - reduced to 200ms for faster response
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('SessionsSection: Executing debounced refresh');
      loadSessions();
      refreshTimeoutRef.current = null;
    }, 200);
  }, [loadSessions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('SessionsSection: Initial load');
    loadSessions();
  }, [loadSessions]);

  // Add effect to refresh sessions when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      console.log('SessionsSection: Refresh trigger changed, triggering refresh');
      debouncedRefresh();
    }
  }, [refreshTrigger, debouncedRefresh]);

  // Add effect to listen for session creation events
  useEffect(() => {
    const handleSessionCreated = () => {
      console.log('SessionsSection: Session created event received');
      debouncedRefresh();
    };

    const handleMessageStreamFinish = () => {
      console.log('SessionsSection: Message stream finished event received');
      // Always refresh when message stream finishes
      debouncedRefresh();
    };

    // Listen for custom events that indicate a session was created
    window.addEventListener('session-created', handleSessionCreated);

    // Also listen for message stream finish events
    window.addEventListener('message-stream-finished', handleMessageStreamFinish);

    return () => {
      window.removeEventListener('session-created', handleSessionCreated);
      window.removeEventListener('message-stream-finished', handleMessageStreamFinish);
    };
  }, [debouncedRefresh]);


  // Component for individual session items with loading and animation states
  const SessionItem = ({ session }: { session: Session }) => {
    const hasDescription =
      session.metadata.description && session.metadata.description.trim() !== '';
    const isNewSession = session.id.match(/^\d{8}_\d{6}$/);
    const messageCount = session.metadata.message_count || 0;
    // Show loading for new sessions with few messages and no description
    // Only show loading for sessions created in the last 5 minutes
    const sessionDate = new Date(session.modified);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isRecentSession = sessionDate > fiveMinutesAgo;
    const shouldShowLoading =
      !hasDescription && isNewSession && messageCount <= 2 && isRecentSession;
    const [isAnimating, setIsAnimating] = useState(false);

    // Use text animator only for sessions that need animation
    const descriptionRef = useTextAnimator({
      text: isAnimating ? session.metadata.description : '',
    });

    // Track when description becomes available and trigger animation
    useEffect(() => {
      if (hasDescription && !sessionsWithDescriptions.has(session.id)) {
        setSessionsWithDescriptions((prev) => new Set(prev).add(session.id));

        // Only animate for new sessions that were showing loading
        if (shouldShowLoading) {
          setIsAnimating(true);
        }
      }
    }, [hasDescription, session.id, shouldShowLoading]);

    const handleClick = () => {
      onSelectSession(session.id);
    };

    return (
      <SidebarMenuItem key={session.id}>
        <SidebarMenuButton
          onClick={handleClick}
          className="cursor-pointer w-full transition-all duration-200 hover:bg-background-medium rounded-lg text-text-muted hover:text-text-default h-fit flex items-start py-2 px-3"
        >
          <div className="flex flex-col w-full">
            <div className="text-sm truncate text-text-default">
              {shouldShowLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin text-text-default" />
                  <span className="text-text-default animate-pulse">Generating description...</span>
                </div>
              ) : (
                <span
                  ref={isAnimating ? descriptionRef : undefined}
                  className={`transition-all duration-300 ${isAnimating ? 'animate-in fade-in duration-300' : ''}`}
                >
                  {hasDescription ? session.metadata.description : `Session ${session.id}`}
                </span>
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 py-2 text-sm font-medium text-text-default">
        Recent Chats
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
