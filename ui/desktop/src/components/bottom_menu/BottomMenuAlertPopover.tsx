import { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils';
import { Alert, AlertType } from '../alerts';
import { AlertBox } from '../alerts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface AlertPopoverProps {
  alerts: Alert[];
}

export default function BottomMenuAlertPopover({ alerts }: AlertPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShowIndicator, setShouldShowIndicator] = useState(false); // Stable indicator state
  const previousAlertsRef = useRef<Alert[]>([]);
  const dropdownId = useRef('alert-popover');

  // Manage stable indicator visibility - once we have alerts, keep showing until explicitly cleared
  useEffect(() => {
    if (alerts.length > 0) {
      setShouldShowIndicator(true);
    } else {
      setShouldShowIndicator(false);
    }
  }, [alerts.length]);

  // Handle initial show and new alerts
  useEffect(() => {
    if (alerts.length === 0) {
      return;
    }

    // Find new or changed alerts
    const changedAlerts = alerts.filter((alert, index) => {
      const prevAlert = previousAlertsRef.current[index];
      return !prevAlert || prevAlert.type !== alert.type || prevAlert.message !== alert.message;
    });

    previousAlertsRef.current = alerts;

    // Only auto-show if any of the new/changed alerts have autoShow: true
    const hasNewAutoShowAlert = changedAlerts.some((alert) => alert.autoShow === true);

    // Auto show the popover for new auto-show alerts
    if (hasNewAutoShowAlert) {
      setIsOpen(true);
    }
  }, [alerts]);

  // Listen for events to hide this popover
  useEffect(() => {
    const handleHidePopover = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCloseAllDropdowns = (event: any) => {
      // Don't close this dropdown if it was the one that sent the event
      if (event.detail?.senderId !== dropdownId.current && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('hide-alert-popover', handleHidePopover);
    window.addEventListener('close-all-dropdowns', handleCloseAllDropdowns);

    return () => {
      window.removeEventListener('hide-alert-popover', handleHidePopover);
      window.removeEventListener('close-all-dropdowns', handleCloseAllDropdowns);
    };
  }, [isOpen]);

  // Use shouldShowIndicator instead of alerts.length for rendering decision
  if (!shouldShowIndicator) {
    return null;
  }

  // Determine the icon and styling based on the alerts (use current alerts if available, or default to info)
  const hasError = alerts.some((alert) => alert.type === AlertType.Error);
  const hasInfo = alerts.some((alert) => alert.type === AlertType.Info);
  const triggerColor = hasError
    ? 'text-[#d7040e]' // Red color for error alerts
    : hasInfo || alerts.length === 0 // Default to green for context info when no alerts
      ? 'text-[#00b300]' // Green color for info alerts
      : 'text-[#cc4b03]'; // Orange color for warning alerts

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          // Close all other dropdowns when this one opens
          window.dispatchEvent(
            new CustomEvent('close-all-dropdowns', {
              detail: { senderId: dropdownId.current },
            })
          );
        }
        setIsOpen(open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer flex items-center justify-center text-text-default/70 hover:text-text-default transition-colors rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7">
          {/* Context usage visualization with dots */}
          <div className="flex items-center gap-0.5">
            {/* Generate 10 dots for percentage visualization */}
            {Array.from({ length: 10 }, (_, i) => {
              const contextPercentage = Math.min((alerts.length / 5) * 100, 100); // Estimate based on alerts
              const dotFilled = (i + 1) * 10 <= contextPercentage;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full transition-colors',
                    dotFilled ? triggerColor.replace('text-', 'bg-') : 'bg-gray-300'
                  )}
                />
              );
            })}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        className="w-80 max-h-96 p-0 z-[100] bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-2xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
        collisionPadding={10}
      >
        <div className="flex flex-col">
          {alerts.map((alert, index) => (
            <div key={index} className={cn(index > 0 && 'border-t border-borderSubtle')}>
              <AlertBox
                alert={alert}
                className={cn(
                  // Override the default dark background for better dropdown integration
                  '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 border-l-4',
                  alert.type === AlertType.Error && 'border-l-red-500',
                  alert.type === AlertType.Warning && 'border-l-orange-500',
                  alert.type === AlertType.Info && 'border-l-green-500'
                )}
              />
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
