import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Pill } from '../ui/Pill';
import { Plus, MessageSquare, Users } from 'lucide-react';
import { useConfig, FixedExtensionEntry } from '../ConfigContext';
import { getFriendlyTitle } from '../settings/extensions/subcomponents/ExtensionList';
import ExtensionLogo from '../settings/extensions/subcomponents/ExtensionLogo';

interface ExtensionChatStarterProps {
  onStartChat: (extensions: FixedExtensionEntry[], chatType: 'single' | 'group') => void;
  onClose: () => void;
}

export default function ExtensionChatStarter({ onStartChat, onClose }: ExtensionChatStarterProps) {
  const { extensions } = useConfig();
  const [selectedExtensions, setSelectedExtensions] = useState<Set<string>>(new Set());
  const [chatMode, setChatMode] = useState<'single' | 'group'>('single');

  // Get enabled extensions only
  const enabledExtensions = extensions.filter(ext => ext.enabled);

  const toggleExtension = (extensionName: string) => {
    const newSelection = new Set(selectedExtensions);
    if (newSelection.has(extensionName)) {
      newSelection.delete(extensionName);
    } else {
      if (chatMode === 'single') {
        newSelection.clear(); // Only one extension for single chat
      }
      newSelection.add(extensionName);
    }
    setSelectedExtensions(newSelection);

    // Auto-switch to group mode if multiple extensions are selected
    if (newSelection.size > 1) {
      setChatMode('group');
    }
  };

  const getSelectedExtensionObjects = (): FixedExtensionEntry[] => {
    return enabledExtensions.filter(ext => selectedExtensions.has(ext.name));
  };

  const canStartChat = selectedExtensions.size > 0;

  const startChat = () => {
    if (canStartChat) {
      onStartChat(getSelectedExtensionObjects(), chatMode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] m-4 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Start Extension Chat</h2>
              <p className="text-sm text-text-muted">
                Select extensions to collaborate with directly. They'll work together like teammates in a group chat.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Chat Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={chatMode === 'single' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setChatMode('single');
                if (selectedExtensions.size > 1) {
                  setSelectedExtensions(new Set([Array.from(selectedExtensions)[0]]));
                }
              }}
              className="flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Single Chat
            </Button>
            <Button
              variant={chatMode === 'group' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setChatMode('group')}
              className="flex items-center gap-2"
            >
              <Users size={16} />
              Group Chat
            </Button>
          </div>

          {/* Selected Extensions Preview */}
          {selectedExtensions.size > 0 && (
            <div className="mt-4 p-3 bg-background-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Extensions:</p>
              <div className="flex flex-wrap gap-2">
                {getSelectedExtensionObjects().map(ext => (
                  <Pill key={ext.name} variant="glass" size="sm" className="flex items-center gap-2">
                    <ExtensionLogo extension={ext} size={16} />
                    {getFriendlyTitle(ext)}
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="overflow-y-auto">
          {enabledExtensions.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <p className="mb-4">No extensions are currently enabled.</p>
              <Button variant="secondary" onClick={onClose}>
                Manage Extensions
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledExtensions.map(extension => {
                const isSelected = selectedExtensions.has(extension.name);
                const isDisabled = chatMode === 'single' && selectedExtensions.size === 1 && !isSelected;
                
                return (
                  <Card
                    key={extension.name}
                    className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-background-muted'
                    }`}
                    onClick={() => !isDisabled && toggleExtension(extension.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <ExtensionLogo extension={extension} size={32} />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Plus size={12} className="text-white rotate-45" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 truncate">
                            {getFriendlyTitle(extension)}
                          </h3>
                          <p className="text-xs text-text-muted">
                            {extension.type === 'builtin' ? 'Built-in extension' : `${extension.type} extension`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Start Chat Button */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={startChat}
              disabled={!canStartChat}
              className="flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Start {chatMode === 'group' ? 'Group ' : ''}Chat
              {selectedExtensions.size > 0 && (
                <Pill variant="solid" size="xs" color="blue" className="ml-1">
                  {selectedExtensions.size}
                </Pill>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
