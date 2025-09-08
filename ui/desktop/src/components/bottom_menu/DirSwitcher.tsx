import React from 'react';
import { Button } from '../ui/button';

interface DirSwitcherProps {
  className?: string;
}

export const DirSwitcher: React.FC<DirSwitcherProps> = ({ className = '' }) => {

  const handleDirectoryChange = async () => {
    window.electron.directoryChooser(true);
  };

  const handleDirectoryClick = async (event: React.MouseEvent) => {
    const isCmdOrCtrlClick = event.metaKey || event.ctrlKey;

    if (isCmdOrCtrlClick) {
      event.preventDefault();
      event.stopPropagation();
      const workingDir = window.appConfig.get('GOOSE_WORKING_DIR') as string;
      await window.electron.openDirectoryInExplorer(workingDir);
    } else {
      await handleDirectoryChange();
    }
  };

  return (
    <Button
      variant="outline" 
      size="sm"
      className={`max-w-[200px] truncate [direction:rtl] text-xs ${className}`}
      onClick={handleDirectoryClick}
    >
      {String(window.appConfig.get('GOOSE_WORKING_DIR'))}
    </Button>
  );
};
