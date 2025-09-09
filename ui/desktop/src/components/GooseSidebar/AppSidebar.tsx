import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Settings } from 'lucide-react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarHeader,
} from '../ui/sidebar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ViewOptions, View } from '../../utils/navigationUtils';
import { useChatContext } from '../../contexts/ChatContext';
import { DEFAULT_CHAT_TITLE } from '../../contexts/ChatContext';
import { SessionsSection } from './SessionsSection';

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
];


const AppSidebar: React.FC<SidebarProps> = ({ currentPath, onSelectSession, refreshTrigger }) => {
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [searchTerm, setSearchTerm] = React.useState('');

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
      if (entry.path === '/' && entry.label === 'New chat') {
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

  const handleDropdownItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Sidebar Header with Ellipsis Menu */}
      <SidebarHeader className="px-2 py-3">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                className="absolute right-6 w-6 h-6 p-0 hover:bg-background-medium/50"
                style={{ right: '24px' }}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleDropdownItemClick('/recipes')}>
                Recipes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownItemClick('/schedules')}>
                Scheduler
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownItemClick('/extensions')}>
                Extensions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownItemClick('/settings')}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 flex flex-col h-full">
        {/* Sticky navigation section */}
        <div className="sticky top-0 bg-sidebar z-10 pb-2">
          <SidebarMenu>{menuItems.map((entry, index) => renderMenuItem(entry, index))}</SidebarMenu>
          
          {/* Search Input */}
          <div className="px-2 pb-2 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 bg-background-subtle border-border-subtle"
              />
            </div>
          </div>
          
          <SidebarSeparator />
        </div>
        
        {/* Scrollable sessions section - extends to bottom */}
        <div className="flex-1 overflow-hidden">
          <SessionsSection 
            onSelectSession={onSelectSession} 
            refreshTrigger={refreshTrigger} 
            searchTerm={searchTerm}
          />
        </div>
      </SidebarContent>

      <SidebarFooter />
    </>
  );
};

export default AppSidebar;
