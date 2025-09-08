import { View, ViewOptions } from '../../utils/navigationUtils';
import ExtensionsSection from '../settings/extensions/ExtensionsSection';
import { ExtensionConfig } from '../../api';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { Button } from '../ui/button';
import { GPSIcon } from '../ui/icons';
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
  const [searchQuery, setSearchQuery] = useState('');
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
      <div className="flex flex-col min-w-0 flex-1 overflow-y-auto relative">
        <div className="bg-background-default px-4 pb-2 pt-12">
          <div className="flex justify-center w-full">
            <div className="max-w-[720px] w-full">
              <div className="flex flex-col page-transition">
                {/* Header */}
                <div className="mb-4">
                  <h1 className="text-2xl font-medium mb-1">Extensions</h1>
                  <p className="text-sm text-text-muted mb-4">
                    Model Context Protocol (MCP) extensions that expand Goose's capabilities.
                  </p>
                  
                  {/* Search and Action Buttons Row */}
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search extensions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-full bg-background-muted text-textStandard placeholder-textSubtle focus:outline-none focus:ring-1 focus:ring-borderProminent h-9"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        window.open('https://block.github.io/goose/v1/extensions/', '_blank')
                      }
                    >
                      <GPSIcon size={12} />
                      Browse
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      Add Extension
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-8">
          <div className="flex justify-center w-full">
            <div className="max-w-[720px] w-full">
              <ExtensionsSection
                key={refreshKey}
                deepLinkConfig={viewOptions.deepLinkConfig}
                showEnvVars={viewOptions.showEnvVars}
                hideButtons={true}
                searchQuery={searchQuery}
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
