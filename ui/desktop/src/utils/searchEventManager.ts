/**
 * Global search event manager to coordinate search events across multiple SearchView instances.
 * Prevents memory leaks by ensuring only one set of event listeners is active.
 */

type SearchEventHandler = () => void;

interface SearchEventHandlers {
  'find-command': SearchEventHandler;
  'find-next': SearchEventHandler;
  'find-previous': SearchEventHandler;
  'use-selection-find': SearchEventHandler;
}

class SearchEventManager {
  private activeSearchView: string | null = null;
  private handlers: Partial<SearchEventHandlers> = {};
  private listenersAttached = false;

  private handleFindCommand = () => {
    this.handlers['find-command']?.();
  };

  private handleFindNext = () => {
    this.handlers['find-next']?.();
  };

  private handleFindPrevious = () => {
    this.handlers['find-previous']?.();
  };

  private handleUseSelectionFind = () => {
    this.handlers['use-selection-find']?.();
  };

  private attachListeners() {
    if (this.listenersAttached) return;

    window.electron.on('find-command', this.handleFindCommand);
    window.electron.on('find-next', this.handleFindNext);
    window.electron.on('find-previous', this.handleFindPrevious);
    window.electron.on('use-selection-find', this.handleUseSelectionFind);
    
    this.listenersAttached = true;
  }

  private detachListeners() {
    if (!this.listenersAttached) return;

    window.electron.off('find-command', this.handleFindCommand);
    window.electron.off('find-next', this.handleFindNext);
    window.electron.off('find-previous', this.handleFindPrevious);
    window.electron.off('use-selection-find', this.handleUseSelectionFind);
    
    this.listenersAttached = false;
  }

  /**
   * Register a SearchView instance as the active search handler
   */
  register(instanceId: string, handlers: SearchEventHandlers): void {
    // If this is the first instance, attach global listeners
    if (!this.activeSearchView) {
      this.attachListeners();
    }

    this.activeSearchView = instanceId;
    this.handlers = handlers;
  }

  /**
   * Unregister a SearchView instance
   */
  unregister(instanceId: string): void {
    // Only unregister if this instance is the active one
    if (this.activeSearchView === instanceId) {
      this.activeSearchView = null;
      this.handlers = {};
      
      // If no instances remain, detach global listeners
      this.detachListeners();
    }
  }

  /**
   * Update handlers for the active SearchView instance
   */
  updateHandlers(instanceId: string, handlers: Partial<SearchEventHandlers>): void {
    if (this.activeSearchView === instanceId) {
      this.handlers = { ...this.handlers, ...handlers };
    }
  }

  /**
   * Check if a specific instance is the active one
   */
  isActive(instanceId: string): boolean {
    return this.activeSearchView === instanceId;
  }
}

// Export a singleton instance
export const searchEventManager = new SearchEventManager();
