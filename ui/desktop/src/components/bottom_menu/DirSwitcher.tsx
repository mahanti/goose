import React from 'react';
import { FolderDot } from 'lucide-react';

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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Directory switcher clicked!'); // Debug log
    handleDirectoryClick(event);
  };

  return (
    <button
      className={`flex items-center justify-center text-text-default/70 hover:text-text-default text-xs cursor-pointer transition-colors rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7 pointer-events-auto bg-background-default shadow-sm ${className}`}
      onClick={handleClick}
      title={String(window.appConfig.get('GOOSE_WORKING_DIR'))}
    >
      <FolderDot className="mr-1" size={14} />
      <div className="max-w-[150px] truncate [direction:rtl]">
        {String(window.appConfig.get('GOOSE_WORKING_DIR'))}
      </div>
    </button>
  );
};
