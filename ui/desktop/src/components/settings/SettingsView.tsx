import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { View, ViewOptions } from '../../utils/navigationUtils';
import ModelsSection from './models/ModelsSection';
import SessionSharingSection from './sessions/SessionSharingSection';
import AppSettingsSection from './app/AppSettingsSection';
import ConfigSettings from './config/ConfigSettings';
import { ExtensionConfig } from '../../api';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { useState, useEffect } from 'react';
import ChatSettingsSection from './chat/ChatSettingsSection';
import { CONFIGURATION_ENABLED } from '../../updates';
import RecipesView from '../recipes/RecipesView';
import SchedulesView from '../schedule/SchedulesView';
import ExtensionsSection from './extensions/ExtensionsSection';
import { ExtensionsViewOptions } from '../extensions/ExtensionsView';

export type SettingsViewOptions = {
  deepLinkConfig?: ExtensionConfig;
  showEnvVars?: boolean;
  section?: string;
  tab?: string; // Add tab parameter for URL routing
} & ExtensionsViewOptions;

export default function SettingsView({
  onClose,
  setView,
  viewOptions,
}: {
  onClose: () => void;
  setView: (view: View, viewOptions?: ViewOptions) => void;
  viewOptions: SettingsViewOptions;
}) {
  const [activeTab, setActiveTab] = useState('recipes');

  // Determine initial tab based on section or tab prop
  useEffect(() => {
    if (viewOptions.tab) {
      setActiveTab(viewOptions.tab);
    } else if (viewOptions.section) {
      // Map section names to tab values
      const sectionToTab: Record<string, string> = {
        update: 'app',
        models: 'models',
        modes: 'chat',
        sharing: 'sharing',
        styles: 'chat',
        tools: 'chat',
        app: 'app',
        chat: 'chat',
      };

      const targetTab = sectionToTab[viewOptions.section];
      if (targetTab) {
        setActiveTab(targetTab);
      }
    }
  }, [viewOptions.section, viewOptions.tab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <MainPanelLayout>
        <div className="flex-1 flex flex-col min-h-0 pt-16">
          <div className="flex-1 min-h-0 px-6">
            <div className="h-full flex gap-6">
              {/* Left Sidebar with Tabs */}
              <div className="w-56 shrink-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-auto w-full flex-col justify-start p-0 bg-transparent">
                    <TabsTrigger
                      value="recipes"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-recipes-tab"
                    >
                      Recipes
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedules"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-schedules-tab"
                    >
                      Scheduler
                    </TabsTrigger>
                    <TabsTrigger
                      value="extensions"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-extensions-tab"
                    >
                      Extensions
                    </TabsTrigger>
                    <TabsTrigger
                      value="models"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-models-tab"
                    >
                      Models
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-chat-tab"
                    >
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="sharing"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-sharing-tab"
                    >
                      Session
                    </TabsTrigger>
                    <TabsTrigger
                      value="app"
                      className="w-full justify-start mb-1 py-3 px-4 rounded-md data-[state=active]:bg-background-default data-[state=active]:shadow-sm"
                      data-testid="settings-app-tab"
                    >
                      App
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent
                    value="recipes"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="h-full max-w-[720px]">
                      <RecipesView />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="schedules"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="h-full max-w-[720px]">
                      <SchedulesView onClose={onClose} />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="extensions"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="h-full overflow-y-auto px-2 max-w-[720px]">
                      <ExtensionsSection
                        deepLinkConfig={viewOptions.deepLinkConfig}
                        showEnvVars={viewOptions.showEnvVars}
                        hideButtons={false}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="models"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="max-w-[720px] h-full">
                      <ScrollArea className="h-full px-2">
                        <ModelsSection setView={setView} />
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="chat"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="max-w-[720px] h-full">
                      <ScrollArea className="h-full px-2">
                        <ChatSettingsSection />
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="sharing"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="max-w-[720px] h-full">
                      <ScrollArea className="h-full px-2">
                        <SessionSharingSection />
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="app"
                    className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="max-w-[720px] h-full">
                      <ScrollArea className="h-full px-2">
                        <div className="space-y-8">
                          {CONFIGURATION_ENABLED && <ConfigSettings />}
                          <AppSettingsSection scrollToSection={viewOptions.section} />
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </MainPanelLayout>
    </>
  );
}
