import { useState, useEffect, useRef } from 'react';
import { useModelAndProvider } from '../ModelAndProviderContext';
import { useConfig } from '../ConfigContext';
import { CoinIcon } from '../icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
  getCostForModel,
  initializeCostDatabase,
  updateAllModelCosts,
  fetchAndCachePricing,
} from '../../utils/costDatabase';

interface CostTrackerProps {
  inputTokens?: number;
  outputTokens?: number;
  sessionCosts?: {
    [key: string]: {
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    };
  };
}

export function CostTracker({ inputTokens = 0, outputTokens = 0, sessionCosts }: CostTrackerProps) {
  const { currentModel, currentProvider } = useModelAndProvider();
  const { getProviders } = useConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownId = useRef('cost-tracker-dropdown');
  const [costInfo, setCostInfo] = useState<{
    input_token_cost?: number;
    output_token_cost?: number;
    currency?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(true);
  const [pricingFailed, setPricingFailed] = useState(false);
  const [modelNotFound, setModelNotFound] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Check if pricing is enabled
  useEffect(() => {
    const checkPricingSetting = () => {
      const stored = localStorage.getItem('show_pricing');
      setShowPricing(stored !== 'false');
    };

    // Check on mount
    checkPricingSetting();

    // Listen for storage changes
    window.addEventListener('storage', checkPricingSetting);
    return () => window.removeEventListener('storage', checkPricingSetting);
  }, []);

  // Set initial load complete after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 3000); // Give 3 seconds for initial load

    return () => window.clearTimeout(timer);
  }, []);

  // Debug log props removed

  // Initialize cost database on mount
  useEffect(() => {
    initializeCostDatabase();

    // Update costs for all models in background
    updateAllModelCosts().catch(() => {});
  }, [getProviders]);

  useEffect(() => {
    const loadCostInfo = async () => {
      if (!currentModel || !currentProvider) {
        setIsLoading(false);
        return;
      }

      try {
        // First check sync cache
        let costData = getCostForModel(currentProvider, currentModel);

        if (costData) {
          // We have cached data
          setCostInfo(costData);
          setPricingFailed(false);
          setModelNotFound(false);
          setIsLoading(false);
          setHasAttemptedFetch(true);
        } else {
          // Need to fetch from backend
          setIsLoading(true);
          const result = await fetchAndCachePricing(currentProvider, currentModel);
          setHasAttemptedFetch(true);

          if (result && result.costInfo) {
            setCostInfo(result.costInfo);
            setPricingFailed(false);
            setModelNotFound(false);
          } else if (result && result.error === 'model_not_found') {
            // Model not found in pricing database, but API call succeeded
            setModelNotFound(true);
            setPricingFailed(false);
          } else {
            // API call failed or other error
            const freeProviders = ['ollama', 'local', 'localhost'];
            if (!freeProviders.includes(currentProvider.toLowerCase())) {
              setPricingFailed(true);
              setModelNotFound(false);
            }
          }
          setIsLoading(false);
        }
      } catch {
        setHasAttemptedFetch(true);
        // Only set pricing failed if we're not dealing with a known free provider
        const freeProviders = ['ollama', 'local', 'localhost'];
        if (!freeProviders.includes(currentProvider.toLowerCase())) {
          setPricingFailed(true);
          setModelNotFound(false);
        }
        setIsLoading(false);
      }
    };

    loadCostInfo();
  }, [currentModel, currentProvider]);

  // Listen for global dropdown close events
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCloseAllDropdowns = (event: any) => {
      // Don't close this dropdown if it was the one that sent the event
      if (event.detail?.senderId !== dropdownId.current && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('close-all-dropdowns', handleCloseAllDropdowns);

    return () => {
      window.removeEventListener('close-all-dropdowns', handleCloseAllDropdowns);
    };
  }, [isDropdownOpen]);

  // Return null early if pricing is disabled
  if (!showPricing) {
    return null;
  }

  const calculateCost = (): number => {
    // If we have session costs, calculate the total across all models
    if (sessionCosts) {
      let totalCost = 0;

      // Add up all historical costs from different models
      Object.values(sessionCosts).forEach((modelCost) => {
        totalCost += modelCost.totalCost;
      });

      // Add current model cost if we have pricing info
      if (
        costInfo &&
        (costInfo.input_token_cost !== undefined || costInfo.output_token_cost !== undefined)
      ) {
        const currentInputCost = inputTokens * (costInfo.input_token_cost || 0);
        const currentOutputCost = outputTokens * (costInfo.output_token_cost || 0);
        totalCost += currentInputCost + currentOutputCost;
      }

      return totalCost;
    }

    // Fallback to simple calculation for current model only
    if (
      !costInfo ||
      (costInfo.input_token_cost === undefined && costInfo.output_token_cost === undefined)
    ) {
      return 0;
    }

    const inputCost = inputTokens * (costInfo.input_token_cost || 0);
    const outputCost = outputTokens * (costInfo.output_token_cost || 0);
    const total = inputCost + outputCost;

    return total;
  };

  const formatCost = (cost: number): string => {
    // Always show 4 decimal places for consistency
    return cost.toFixed(4);
  };

  // Show loading state or when we don't have model/provider info
  if (!currentModel || !currentProvider) {
    return null;
  }

  // If still loading, show a placeholder
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-textSubtle translate-y-[1px]">
        <span className="text-xs font-mono">...</span>
      </div>
    );
  }

  // If no cost info found, try to return a default
  if (
    !costInfo ||
    (costInfo.input_token_cost === undefined && costInfo.output_token_cost === undefined)
  ) {
    // If it's a known free/local provider, show $0.000000 without "not available" message
    const freeProviders = ['ollama', 'local', 'localhost'];
    if (freeProviders.includes(currentProvider.toLowerCase())) {
      return (
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={(open) => {
            if (open) {
              // Close all other dropdowns when this one opens
              window.dispatchEvent(
                new CustomEvent('close-all-dropdowns', {
                  detail: { senderId: dropdownId.current },
                })
              );
            }
            setIsDropdownOpen(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center transition-colors cursor-pointer text-text-default/70 hover:text-text-default rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7">
              <CoinIcon className="mr-1" size={14} />
              <span className="text-xs font-mono">0.0000</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            className="w-64 p-6 rounded-2xl bg-background-default shadow-lg border border-border-default"
            onCloseAutoFocus={(e) => e.preventDefault()}
            sideOffset={4}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CoinIcon size={16} className="text-text-muted" />
                <span className="font-medium text-sm">Cost Tracking</span>
              </div>
              <div className="text-sm text-text-muted">
                <div>Local model - no cost incurred</div>
                <div className="mt-2 text-xs">
                  <div>Input tokens: {inputTokens.toLocaleString()}</div>
                  <div>Output tokens: {outputTokens.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Otherwise show as unavailable
    const getUnavailableTooltip = () => {
      if (pricingFailed && hasAttemptedFetch && initialLoadComplete) {
        return `Pricing data unavailable - OpenRouter connection failed. Click refresh in settings to retry.`;
      }
      // If we reach here, it must be modelNotFound (since we only get here after attempting fetch)
      return `Cost data not available for ${currentModel} (${inputTokens.toLocaleString()} input, ${outputTokens.toLocaleString()} output tokens)`;
    };

    return (
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={(open) => {
          if (open) {
            // Close all other dropdowns when this one opens
            window.dispatchEvent(
              new CustomEvent('close-all-dropdowns', {
                detail: { senderId: dropdownId.current },
              })
            );
          }
          setIsDropdownOpen(open);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center transition-colors cursor-pointer text-text-default/70 hover:text-text-default rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7">
            <CoinIcon className="mr-1" size={14} />
            <span className="text-xs font-mono">0.0000</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="center"
          className="w-72 p-6 rounded-2xl bg-background-default shadow-lg border border-border-default"
          onCloseAutoFocus={(e) => e.preventDefault()}
          sideOffset={4}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CoinIcon size={16} className="text-text-muted" />
              <span className="font-medium text-sm">Cost Information</span>
            </div>
            <div className="text-sm text-text-muted">{getUnavailableTooltip()}</div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const totalCost = calculateCost();

  // Don't render if no cost data is available or if there's any issue with pricing
  if (
    !costInfo?.input_token_cost ||
    !costInfo?.output_token_cost ||
    totalCost === 0 ||
    isLoading ||
    pricingFailed ||
    modelNotFound ||
    !showPricing
  ) {
    return null;
  }

  const getDropdownContent = () => {
    // Handle error states first
    if (pricingFailed && hasAttemptedFetch && initialLoadComplete) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CoinIcon size={16} className="text-text-muted" />
            <span className="font-medium text-sm">Cost Information</span>
          </div>
          <div className="text-sm text-text-muted">
            <div className="text-orange-400 mb-2">⚠️ Pricing Data Unavailable</div>
            <div>OpenRouter connection failed. Click refresh in settings to retry.</div>
          </div>
        </div>
      );
    }

    if (modelNotFound && hasAttemptedFetch && initialLoadComplete) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CoinIcon size={16} className="text-text-muted" />
            <span className="font-medium text-sm">Cost Information</span>
          </div>
          <div className="text-sm text-text-muted">
            <div className="text-orange-400 mb-2">⚠️ Model Not Found</div>
            <div>
              Pricing not available for {currentProvider}/{currentModel}. This model may not be
              supported by the pricing service.
            </div>
          </div>
        </div>
      );
    }

    // Handle session costs
    if (sessionCosts && Object.keys(sessionCosts).length > 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CoinIcon size={16} className="text-text-muted" />
            <span className="font-medium text-sm">Session Cost Breakdown</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(sessionCosts).map(([modelKey, cost]) => (
              <div key={modelKey} className="bg-background-muted rounded-lg p-3">
                <div className="font-medium text-xs">{modelKey}</div>
                <div className="text-xs text-text-muted mt-1">
                  <div>
                    Cost: {costInfo?.currency || '$'}
                    {cost.totalCost.toFixed(6)}
                  </div>
                  <div>Input: {cost.inputTokens.toLocaleString()} tokens</div>
                  <div>Output: {cost.outputTokens.toLocaleString()} tokens</div>
                </div>
              </div>
            ))}

            {costInfo && (inputTokens > 0 || outputTokens > 0) && (
              <div className="bg-background-accent/10 rounded-lg p-3 border border-background-accent/20">
                <div className="font-medium text-xs">
                  {currentProvider}/{currentModel} (current)
                </div>
                <div className="text-xs text-text-muted mt-1">
                  <div>
                    Cost: {costInfo.currency || '$'}
                    {(
                      inputTokens * (costInfo.input_token_cost || 0) +
                      outputTokens * (costInfo.output_token_cost || 0)
                    ).toFixed(6)}
                  </div>
                  <div>Input: {inputTokens.toLocaleString()} tokens</div>
                  <div>Output: {outputTokens.toLocaleString()} tokens</div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border-default pt-3">
            <div className="font-medium text-sm">
              Total Session Cost: {costInfo?.currency || '$'}
              {totalCost.toFixed(6)}
            </div>
          </div>
        </div>
      );
    }

    // Default single model breakdown
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CoinIcon size={16} className="text-text-muted" />
          <span className="font-medium text-sm">Cost Breakdown</span>
        </div>

        <div className="space-y-3">
          <div className="bg-background-muted rounded-lg p-3">
            <div className="text-xs text-text-muted">
              <div className="font-medium text-text-default mb-2">
                {currentProvider}/{currentModel}
              </div>
              <div>Input: {inputTokens.toLocaleString()} tokens</div>
              <div>
                Cost: {costInfo?.currency || '$'}
                {(inputTokens * (costInfo?.input_token_cost || 0)).toFixed(6)}
              </div>
            </div>
          </div>

          <div className="bg-background-muted rounded-lg p-3">
            <div className="text-xs text-text-muted">
              <div className="font-medium text-text-default mb-2">Output</div>
              <div>Output: {outputTokens.toLocaleString()} tokens</div>
              <div>
                Cost: {costInfo?.currency || '$'}
                {(outputTokens * (costInfo?.output_token_cost || 0)).toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border-default pt-3">
          <div className="font-medium text-sm">
            Total Cost: {costInfo?.currency || '$'}
            {totalCost.toFixed(6)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DropdownMenu
      open={isDropdownOpen}
      onOpenChange={(open) => {
        if (open) {
          // Close all other dropdowns when this one opens
          window.dispatchEvent(
            new CustomEvent('close-all-dropdowns', {
              detail: { senderId: dropdownId.current },
            })
          );
        }
        setIsDropdownOpen(open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center transition-colors cursor-pointer text-text-default/70 hover:text-text-default rounded-full border border-border-default hover:bg-background-muted px-2 py-1 h-7">
          <CoinIcon className="mr-1" size={14} />
          <span className="text-xs font-mono">{formatCost(totalCost)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        className="w-80 max-h-96 p-6 rounded-2xl bg-background-default shadow-lg border border-border-default"
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
        collisionPadding={10}
      >
        {getDropdownContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
