import React, { useState, useEffect, useRef } from 'react';
import { View, ViewOptions } from '../../utils/navigationUtils';
import { FixedExtensionEntry } from '../ConfigContext';
import { ChatType } from '../../types/chat';
import { Message } from '../../types/message';
import { ChatState } from '../../types/chatState';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Pill } from '../ui/Pill';
import { Card, CardHeader, CardContent } from '../ui/card';
import { ArrowLeft, Users, MessageSquare, Settings } from 'lucide-react';
import ChatInput from '../ChatInput';
import ExtensionMessage, { ExtensionCollaborationMessage } from './ExtensionMessage';
import { ExtensionAvatarGroup, ExtensionMessageAttribution } from './ExtensionAvatar';
import { getFriendlyTitle } from '../settings/extensions/subcomponents/ExtensionList';

interface ExtensionChatInterfaceProps {
  extensions: FixedExtensionEntry[];
  chatType: 'single' | 'group';
  chat: ChatType;
  setChat: (chat: ChatType) => void;
  setView: (view: View, viewOptions?: ViewOptions) => void;
  onBack: () => void;
}

export default function ExtensionChatInterface({
  extensions,
  chatType,
  chat,
  setChat,
  setView,
  onBack
}: ExtensionChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatState, setChatState] = useState<ChatState>(ChatState.READY);
  const [isTyping, setIsTyping] = useState<string | null>(null); // Which extension is "typing"
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock chat submission - you'll need to integrate with your actual chat engine
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with actual chat submission logic
    // This should route the message to the selected extensions
    console.log('Submitting to extensions:', extensions.map(e => e.name));
  };

  const stopGeneration = () => {
    setChatState(ChatState.READY);
    setIsTyping(null);
  };

  // Generate chat title
  const chatTitle = chatType === 'single' 
    ? `Chat with ${getFriendlyTitle(extensions[0])}`
    : `Group Chat: ${extensions.map(e => getFriendlyTitle(e)).join(', ')}`;

  // Generate initial system message
  const systemMessage = chatType === 'single'
    ? `You're now chatting directly with ${getFriendlyTitle(extensions[0])}. All actions will be performed by this extension.`
    : `You're in a group chat with ${extensions.length} extensions. They can collaborate on your requests and each extension's actions will be clearly attributed.`;

  return (
    <MainPanelLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft size={16} />
              </Button>
              
              <div className="flex items-center gap-3">
                <ExtensionAvatarGroup extensions={extensions} size="md" />
                <div>
                  <h1 className="font-semibold text-lg">{chatTitle}</h1>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    {chatType === 'group' ? <Users size={14} /> : <MessageSquare size={14} />}
                    <span>{extensions.length} extension{extensions.length > 1 ? 's' : ''}</span>
                    {chatType === 'group' && <Pill variant="glass" size="xs" color="purple">Group</Pill>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* System Message */}
        <div className="px-4 py-3 bg-blue-50 border-b">
          <Card className="bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  G
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">Extension Chat Mode</div>
                  <div className="text-sm text-gray-700">{systemMessage}</div>
                  
                  {chatType === 'group' && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-gray-600">Active Extensions:</div>
                      <div className="flex flex-wrap gap-2">
                        {extensions.map(ext => (
                          <Pill key={ext.name} variant="glass" size="sm" color="green" className="flex items-center gap-1">
                            {getFriendlyTitle(ext)}
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          </Pill>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <div className="flex justify-center mb-4">
                  <ExtensionAvatarGroup extensions={extensions} size="lg" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                <p className="text-sm max-w-md mx-auto">
                  {chatType === 'single'
                    ? `Ask ${getFriendlyTitle(extensions[0])} to help with a specific task.`
                    : 'Give these extensions a task to collaborate on together.'
                  }
                </p>
                
                {chatType === 'group' && (
                  <div className="mt-6">
                    <ExtensionCollaborationMessage
                      extensions={extensions}
                      action="Ready to collaborate"
                      details="Extensions are standing by to work together on your request"
                      timestamp={new Date()}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ExtensionMessage
                    key={message.id || index}
                    message={message}
                    extension={chatType === 'single' ? extensions[0] : undefined}
                    showAttribution={chatType === 'group'}
                  />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="mr-12 ml-4">
                    <ExtensionMessageAttribution
                      extension={extensions.find(e => e.name === isTyping) || extensions[0]}
                      action="is working..."
                      className="ml-0"
                    />
                    <Card className="bg-gray-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-text-muted">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm">Processing your request...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="border-t bg-white p-4">
          <ChatInput
            sessionId={chat.id}
            handleSubmit={handleSubmit}
            chatState={chatState}
            onStop={stopGeneration}
            messages={messages}
            setMessages={setMessages}
            setView={setView}
            toolCount={0}
            autoSubmit={false}
          />
          
          {/* Extension Context Bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span>Routing to:</span>
              <div className="flex gap-1">
                {extensions.map(ext => (
                  <Pill key={ext.name} variant="glass" size="xs" className="text-xs">
                    {getFriendlyTitle(ext)}
                  </Pill>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                All extensions ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainPanelLayout>
  );
}
