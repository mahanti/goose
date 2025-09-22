import { View, ViewOptions } from '../../utils/navigationUtils';
import ExtensionsSection from '../settings/extensions/ExtensionsSection';
import { ExtensionConfig } from '../../api';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import ExtensionModal from '../settings/extensions/modal/ExtensionModal';
import {
  getDefaultFormData,
  ExtensionFormData,
  createExtensionConfig,
} from '../settings/extensions/utils';
import { activateExtension } from '../settings/extensions/index';
import { useConfig } from '../ConfigContext';

export type ExtensionsViewOptions = {
  deepLinkConfig?: ExtensionConfig;
  showEnvVars?: boolean;
};

export default function ExtensionsView({
  viewOptions,
}: {
  onClose: () => void;
  setView: (view: View, viewOptions?: ViewOptions) => void;
  viewOptions: ExtensionsViewOptions;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { addExtension } = useConfig();

  // Trigger refresh when deep link config changes (i.e., when a deep link is processed)
  useEffect(() => {
    if (viewOptions.deepLinkConfig) {
      setRefreshKey((prevKey) => prevKey + 1);
    }
  }, [viewOptions.deepLinkConfig, viewOptions.showEnvVars]);

  const handleModalClose = () => {
    setIsAddModalOpen(false);
  };

  const handleAddExtension = async (formData: ExtensionFormData) => {
    // Close the modal immediately
    handleModalClose();

    const extensionConfig = createExtensionConfig(formData);
    try {
      await activateExtension({ addToConfig: addExtension, extensionConfig: extensionConfig });
      // Trigger a refresh of the extensions list
      setRefreshKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error('Failed to activate extension:', error);
      setRefreshKey((prevKey) => prevKey + 1);
    }
  };

  return (
    <MainPanelLayout>
      <div className="w-full max-w-[720px] mx-auto">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-background-default px-8 pb-4 pt-16">
            <div className="flex flex-col page-transition">
              <div className="flex justify-between items-center mb-1">
                <h1 className="text-4xl font-light">Extensions</h1>
              </div>
              <p className="text-sm text-text-muted mb-6">
                These extensions use the Model Context Protocol (MCP). They can expand Goose's
                capabilities using three main components: Prompts, Resources, and Tools.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <Button
                  className="rounded-full px-6"
                  variant="default"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add custom extension
                </Button>
                <Button
                  className="rounded-full px-6"
                  variant="secondary"
                  onClick={() =>
                    window.open('https://block.github.io/goose/v1/extensions/', '_blank')
                  }
                >
                  Browse extensions
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative px-8">
            <div className="h-full overflow-y-auto pb-8">
              <ExtensionsSection
                key={refreshKey}
                deepLinkConfig={viewOptions.deepLinkConfig}
                showEnvVars={viewOptions.showEnvVars}
                hideButtons={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for adding a new extension */}
      {isAddModalOpen && (
        <ExtensionModal
          title="Add custom extension"
          initialData={getDefaultFormData()}
          onClose={handleModalClose}
          onSubmit={handleAddExtension}
          submitLabel="Add Extension"
          modalType={'add'}
        />
      )}
    </MainPanelLayout>
  );
}
