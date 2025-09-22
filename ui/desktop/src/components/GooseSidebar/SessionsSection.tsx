import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { fetchSessions, type Session } from '../../sessions';
import { Input } from '../ui/input';

interface SessionsSectionProps {
  onSelectSession: (sessionId: string) => void;
  refreshTrigger?: number;
}

interface GroupedSessions {
  today: Session[];
  yesterday: Session[];
  older: { [key: string]: Session[] };
}

export const SessionsSection: React.FC<SessionsSectionProps> = ({
  onSelectSession,
  refreshTrigger,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedSessions, setGroupedSessions] = useState<GroupedSessions>({
    today: [],
    yesterday: [],
    older: {},
  });

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupSessions = useCallback((sessionsToGroup: Session[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped: GroupedSessions = {
      today: [],
      yesterday: [],
      older: {},
    };

    sessionsToGroup.forEach((session) => {
      const sessionDate = new Date(session.modified);
      const sessionDateOnly = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );

      if (sessionDateOnly.getTime() === today.getTime()) {
        grouped.today.push(session);
      } else if (sessionDateOnly.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(session);
      } else {
        const dateKey = sessionDateOnly.toISOString().split('T')[0];
        if (!grouped.older[dateKey]) {
          grouped.older[dateKey] = [];
        }
        grouped.older[dateKey].push(session);
      }
    });

    // Sort older sessions by date (newest first)
    const sortedOlder: { [key: string]: Session[] } = {};
    Object.keys(grouped.older)
      .sort()
      .reverse()
      .forEach((key) => {
        sortedOlder[key] = grouped.older[key];
      });

    grouped.older = sortedOlder;
    setGroupedSessions(grouped);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await fetchSessions();
      setSessions(sessions);
      groupSessions(sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
      setGroupedSessions({ today: [], yesterday: [], older: {} });
    }
  }, [groupSessions]);

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

  useEffect(() => {
    if (searchTerm) {
      const filtered = sessions.filter((session) =>
        (session.metadata.description || session.id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      groupSessions(filtered);
    } else {
      groupSessions(sessions);
    }
  }, [searchTerm, sessions, groupSessions]);

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

    const handleClick = () => {
      console.log('SessionItem: Clicked on session:', session.id);
      onSelectSession(session.id);
    };

    return (
      <button
        key={session.id}
        onClick={handleClick}
        className="w-full text-left py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 group"
      >
        <div className="truncate">
          {shouldShowLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              <span className="animate-pulse text-gray-500">Generating...</span>
            </div>
          ) : (
            <div className="truncate text-gray-900 dark:text-gray-100">
              {hasDescription ? session.metadata.description : `Session ${session.id}`}
            </div>
          )}
        </div>
      </button>
    );
  };

  const renderSessionGroup = (sessions: Session[], title: string) => {
    if (sessions.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="py-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
        </div>
        <div className="space-y-1">
          {sessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-2">
      <div className="py-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">Sessions</span>
      </div>

      {/* Search Input */}
      <div className="pb-3 px-2">
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 size-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sessions Groups */}
      <div className="space-y-1 px-2">
        {(() => {
          const groups = [
            { sessions: groupedSessions.today, title: 'Today' },
            { sessions: groupedSessions.yesterday, title: 'Yesterday' },
            ...Object.entries(groupedSessions.older).map(([date, sessions]) => ({
              sessions,
              title: new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            })),
          ];

          return groups.map(({ sessions, title }) => {
            if (sessions.length === 0) return null;
            return <div key={title}>{renderSessionGroup(sessions, title)}</div>;
          });
        })()}
      </div>
    </div>
  );
};
