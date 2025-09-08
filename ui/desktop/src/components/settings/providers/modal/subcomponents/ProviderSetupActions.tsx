import { SyntheticEvent } from 'react';
import { Button } from '../../../../ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ConfigKey } from '../../../../../api';

interface ProviderSetupActionsProps {
  onCancel: () => void;
  onSubmit: (e: SyntheticEvent) => void;
  onDelete?: () => void;
  showDeleteConfirmation?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  canDelete?: boolean;
  providerName?: string;
  requiredParameters?: ConfigKey[];
  isActiveProvider?: boolean; // Made optional with default false
}

/**
 * Renders the action buttons for the provider modal header.
 * Includes submit, cancel, and delete functionality with confirmation.
 */
export default function ProviderSetupActions({
  onCancel,
  onSubmit,
  onDelete,
  showDeleteConfirmation,
  onConfirmDelete,
  onCancelDelete,
  canDelete,
  providerName,
  requiredParameters,
  isActiveProvider = false, // Default value provided
}: ProviderSetupActionsProps) {
  // If we're showing delete confirmation, render the delete confirmation buttons
  if (showDeleteConfirmation) {
    // Check if this is the active provider
    if (isActiveProvider) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancelDelete}>
            Ok
          </Button>
        </div>
      );
    }

    // Normal delete confirmation
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onCancelDelete}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirmDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Confirm Delete
        </Button>
      </div>
    );
  }

  // Regular buttons (with delete if applicable)
  return (
    <div className="flex items-center gap-2">
      {canDelete && onDelete && (
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Provider
        </Button>
      )}
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" onClick={onSubmit}>
        {requiredParameters && requiredParameters.length > 0 ? 'Set up provider' : 'Save provider'}
      </Button>
    </div>
  );
}
