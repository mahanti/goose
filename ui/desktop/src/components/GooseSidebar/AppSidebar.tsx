import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
} from '../ui/sidebar';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeaderWithActions, DialogTitle } from '../ui/dialog';
import { ViewOptions, View } from '../../utils/navigationUtils';
import { useChatContext } from '../../contexts/ChatContext';
import { DEFAULT_CHAT_TITLE } from '../../contexts/ChatContext';
import { SessionsSection } from './SessionsSection';
import { fetchSessions, type Session } from '../../sessions';

interface SidebarProps {
  onSelectSession: (sessionId: string) => void;
  refreshTrigger?: number;
  children?: React.ReactNode;
  setIsGoosehintsModalOpen?: (isOpen: boolean) => void;
  setView?: (view: View, viewOptions?: ViewOptions) => void;
  currentPath?: string;
}

interface NavigationItem {
  type: 'item';
  path: string;
  label: string;
  tooltip: string;
}

interface NavigationSeparator {
  type: 'separator';
}

type NavigationEntry = NavigationItem | NavigationSeparator;

const menuItems: NavigationEntry[] = [
  {
    type: 'item',
    path: '/',
    label: 'New chat',
    tooltip: 'Start a new chat with Goose',
  },
  {
    type: 'item',
    path: '#search',
    label: 'Search chats',
    tooltip: 'Search through chat history',
  },
  { type: 'separator' },
  {
    type: 'item',
    path: '/recipes',
    label: 'Recipes',
    tooltip: 'Browse your saved recipes',
  },
  {
    type: 'item',
    path: '/schedules',
    label: 'Scheduler',
    tooltip: 'Manage scheduled runs',
  },
  {
    type: 'item',
    path: '/extensions',
    label: 'Extensions',
    tooltip: 'Manage your extensions',
  },
];

// Search Modal Component
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchSessions().then((allSessions) => {
        const sortedSessions = allSessions.sort((a, b) => 
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
        );
        setSessions(sortedSessions);
        setFilteredSessions(sortedSessions);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sessions.filter((session) =>
        (session.metadata.description || session.id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  }, [searchTerm, sessions]);

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeaderWithActions>
          <DialogTitle>Search Chats</DialogTitle>
        </DialogHeaderWithActions>

        {/* Search Input */}
        <div className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search through your chat history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="space-y-2">
            {filteredSessions.map((session) => {
              const hasDescription = session.metadata.description && session.metadata.description.trim() !== '';
              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className="p-3 hover:bg-background-muted rounded-xl cursor-pointer transition-colors border border-border-subtle bg-background-card hover:shadow-sm"
                >
                  <div className="font-medium text-text-default mb-1">
                    {hasDescription ? session.metadata.description : `Session ${session.id}`}
                  </div>
                  <div className="text-sm text-text-muted">
                    {new Date(session.modified).toLocaleDateString()} • {session.metadata.working_dir || 'No directory'}
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && searchTerm && (
              <div className="text-center py-8 text-text-muted">
                No chats found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AppSidebar: React.FC<SidebarProps> = ({ currentPath, onSelectSession, refreshTrigger }) => {
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) => item.type === 'item' && item.path === currentPath
    ) as NavigationItem | undefined;

    const titleBits = ['Goose'];

    if (
      currentPath === '/pair' &&
      chatContext?.chat?.title &&
      chatContext.chat.title !== DEFAULT_CHAT_TITLE
    ) {
      titleBits.push(chatContext.chat.title);
    } else if (currentPath !== '/' && currentItem) {
      titleBits.push(currentItem.label);
    }

    document.title = titleBits.join(' - ');
  }, [currentPath, chatContext?.chat?.title]);

  const isActivePath = (path: string) => {
    return currentPath === path;
  };

  const renderMenuItem = (entry: NavigationEntry, index: number) => {
    if (entry.type === 'separator') {
      return <SidebarSeparator key={index} />;
    }

    const handleClick = () => {
      if (entry.path === '#search') {
        setIsSearchModalOpen(true);
      } else if (entry.path === '/' && entry.label === 'New chat') {
        // Start a new chat by resetting the current session
        navigate('/', { state: { resetChat: true }, replace: true });
      } else {
        navigate(entry.path);
      }
    };

    return (
      <SidebarGroup key={entry.path}>
        <SidebarGroupContent className="space-y-1">
          <div className="sidebar-item">
            <SidebarMenuItem>
              <SidebarMenuButton
                data-testid={`sidebar-${entry.label.toLowerCase()}-button`}
                onClick={handleClick}
                isActive={isActivePath(entry.path)}
                tooltip={entry.tooltip}
                className="w-full justify-start px-3 rounded-lg h-fit hover:bg-background-medium/50 transition-all duration-200 data-[active=true]:bg-background-medium cursor-pointer"
              >
                <span>{entry.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <>
      <SidebarContent className="pt-16 flex flex-col h-full">
        {/* Sticky navigation section */}
        <div className="sticky top-0 bg-sidebar z-10 pb-2">
          <SidebarMenu>{menuItems.map((entry, index) => renderMenuItem(entry, index))}</SidebarMenu>
          <SidebarSeparator />
        </div>
        
        {/* Scrollable sessions section */}
        <div className="flex-1 overflow-hidden">
          <SessionsSection onSelectSession={onSelectSession} refreshTrigger={refreshTrigger} />
        </div>
      </SidebarContent>

      <SidebarFooter />
      
      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectSession={onSelectSession}
      />
    </>
  );
};

export default AppSidebar;
