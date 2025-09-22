import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '../ui/sidebar';
import { ViewOptions, View } from '../../utils/navigationUtils';
import { useChatContext } from '../../contexts/ChatContext';
import { DEFAULT_CHAT_TITLE } from '../../contexts/ChatContext';
import { SessionsSection } from './SessionsSection';
import Settings from '../icons/Settings';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

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
    tooltip: 'Start pairing with Goose',
  },
];

const AppSidebar: React.FC<SidebarProps> = ({ currentPath, onSelectSession, refreshTrigger }) => {
  const navigate = useNavigate();
  const chatContext = useChatContext();

  const handleSelectSession = (sessionId: string) => {
    if (onSelectSession) {
      onSelectSession(sessionId);
    }
  };

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

    return (
      <SidebarMenuItem key={entry.path}>
        <SidebarMenuButton
          data-testid={`sidebar-${entry.label.toLowerCase()}-button`}
          onClick={() => navigate(entry.path)}
          isActive={isActivePath(entry.path)}
          tooltip={entry.tooltip}
          className="w-full justify-start text-sm font-medium rounded-md h-auto hover:bg-gray-100 dark:hover:bg-gray-700 transition-spring-colors data-[active=true]:bg-gray-200 dark:data-[active=true]:bg-gray-600"
        >
          <span>{entry.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader className="pt-4 bg-gray-50 dark:bg-gray-800 flex-row justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-spring-colors"
              >
                <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SidebarHeader>

      <SidebarContent className="pt-4 bg-gray-50 dark:bg-gray-800">
        <div className="px-2">
          <SidebarMenu className="space-y-1">
            {menuItems.map((entry, index) => renderMenuItem(entry, index))}
          </SidebarMenu>
        </div>
        <SessionsSection onSelectSession={handleSelectSession} refreshTrigger={refreshTrigger} />
      </SidebarContent>

      <SidebarFooter className="bg-gray-50 dark:bg-gray-800" />
    </>
  );
};

export default AppSidebar;
