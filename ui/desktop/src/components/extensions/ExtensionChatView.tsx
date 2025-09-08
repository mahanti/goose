import React, { useState } from 'react';
import { View, ViewOptions } from '../../utils/navigationUtils';
import { ChatType } from '../../types/chat';
import { FixedExtensionEntry } from '../ConfigContext';
import ExtensionChatStarter from './ExtensionChatStarter';
import ExtensionChatInterface from './ExtensionChatInterface';

interface ExtensionChatViewProps {
  onClose: () => void;
  setView: (view: View, viewOptions?: ViewOptions) => void;
  chat?: ChatType;
  setChat?: (chat: ChatType) => void;
}

type ExtensionChatState = {
  mode: 'starter' | 'chat';
  selectedExtensions: FixedExtensionEntry[];
  chatType: 'single' | 'group';
};

export default function ExtensionChatView({ 
  onClose, 
  setView,
  chat,
  setChat 
}: ExtensionChatViewProps) {
  const [state, setState] = useState<ExtensionChatState>({
    mode: 'starter',
    selectedExtensions: [],
    chatType: 'single'
  });

  // Create a default chat if none provided
  const defaultChat: ChatType = {
    id: `extension-chat-${Date.now()}`,
    name: 'Extension Chat',
    messages: [],
    created: Date.now(),
    updated: Date.now()
  };

  const activeChat = chat || defaultChat;
  const activeChatSetter = setChat || (() => {});

  const handleStartChat = (extensions: FixedExtensionEntry[], chatType: 'single' | 'group') => {
    setState({
      mode: 'chat',
      selectedExtensions: extensions,
      chatType
    });

    // Update chat name to reflect the extensions
    const chatName = chatType === 'single' 
      ? `Chat with ${extensions[0].name}`
      : `Group: ${extensions.map(e => e.name).join(', ')}`;
    
    activeChatSetter({
      ...activeChat,
      name: chatName
    });
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      mode: 'starter'
    }));
  };

  if (state.mode === 'starter') {
    return (
      <ExtensionChatStarter
        onStartChat={handleStartChat}
        onClose={onClose}
      />
    );
  }

  return (
    <ExtensionChatInterface
      extensions={state.selectedExtensions}
      chatType={state.chatType}
      chat={activeChat}
      setChat={activeChatSetter}
      setView={setView}
      onBack={handleBack}
    />
  );
}
