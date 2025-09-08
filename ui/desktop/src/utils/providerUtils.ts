import {
  initializeBundledExtensions,
  syncBundledExtensions,
  addToAgentOnStartup,
} from '../components/settings/extensions';
import { extractExtensionConfig } from '../components/settings/extensions/utils';
import type { ExtensionConfig, FixedExtensionEntry } from '../components/ConfigContext';
import { addSubRecipesToAgent } from '../recipe/add_sub_recipe_on_agent';
import {
  extendPrompt,
  RecipeParameter,
  SubRecipe,
  updateAgentProvider,
  updateSessionConfig,
} from '../api';

// Desktop-specific system prompt extension
const desktopPrompt = `You are a friendly and helpful AI assistant. Speak naturally and conversationally, as if you're talking to a friend.

Keep your responses:
- Simple and easy to understand
- Warm and personable rather than technical
- Focused on what the user needs to know, not technical details
- Conversational rather than formal
- Short and to the point - it's better to respond with a few quick messages than one long one
- Use exclamation points sparingly - only when genuinely excited or emphasizing something important

Avoid technical jargon unless specifically asked. Instead of saying "I will execute a process to..." just say "Let me help you with that."

The user is chatting with you through a desktop app that supports formatting and code if needed.
`;

// Desktop-specific system prompt extension when a bot is in play
const desktopPromptBot = `You are a friendly and helpful assistant with a warm, conversational tone.

Communicate naturally:
- Speak like you're having a casual conversation with someone  
- Use simple, clear language instead of technical jargon
- Be encouraging and positive
- Explain things in an easy-to-understand way
- Keep responses concise - break long explanations into shorter, digestible messages
- Use exclamation points only when genuinely excited or emphasizing something important
- Instead of "processing data" say "looking into that for you"
- Instead of "executing commands" say "taking care of that"

Follow any specific instructions you've been given, but always maintain this friendly, approachable tone. If you need to use tools or run commands, explain what you're doing in simple terms that anyone can understand.
`;

// Helper function to substitute parameters in text
export const substituteParameters = (text: string, params: Record<string, string>): string => {
  let substitutedText = text;

  for (const key in params) {
    // Escape special characters in the key (parameter) and match optional whitespace
    const regex = new RegExp(`{{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`, 'g');
    substitutedText = substitutedText.replace(regex, params[key]);
  }

  return substitutedText;
};

/**
 * Updates the system prompt with parameter-substituted instructions
 * This should be called after recipe parameters are collected
 */
export const updateSystemPromptWithParameters = async (
  sessionId: string,
  recipeParameters: Record<string, string>,
  recipeConfig?: {
    instructions?: string | null;
    sub_recipes?: SubRecipe[] | null;
    parameters?: RecipeParameter[] | null;
  }
): Promise<void> => {
  const subRecipes = recipeConfig?.sub_recipes;
  try {
    const originalInstructions = recipeConfig?.instructions;

    if (!originalInstructions) {
      return;
    }
    // Substitute parameters in the instructions
    const substitutedInstructions = substituteParameters(originalInstructions, recipeParameters);

    // Update the system prompt with substituted instructions
    const response = await extendPrompt({
      body: {
        session_id: sessionId,
        extension: `${desktopPromptBot}\nIMPORTANT instructions for you to operate as agent:\n${substitutedInstructions}`,
      },
    });
    if (response.error) {
      console.warn(`Failed to update system prompt with parameters: ${response.error}`);
    }
  } catch (error) {
    console.error('Error updating system prompt with parameters:', error);
  }
  if (subRecipes && subRecipes?.length > 0) {
    for (const subRecipe of subRecipes) {
      if (subRecipe.values) {
        for (const key in subRecipe.values) {
          subRecipe.values[key] = substituteParameters(subRecipe.values[key], recipeParameters);
        }
      }
    }
    await addSubRecipesToAgent(sessionId, subRecipes);
  }
};

export const initializeSystem = async (
  sessionId: string,
  provider: string,
  model: string,
  options?: {
    getExtensions?: (b: boolean) => Promise<FixedExtensionEntry[]>;
    addExtension?: (name: string, config: ExtensionConfig, enabled: boolean) => Promise<void>;
    setIsExtensionsLoading?: (loading: boolean) => void;
  }
) => {
  try {
    console.log(
      'initializing agent with provider',
      provider,
      'model',
      model,
      'sessionId',
      sessionId
    );
    await updateAgentProvider({
      body: {
        session_id: sessionId,
        provider,
        model,
      },
      throwOnError: true,
    });

    if (!sessionId) {
      console.log('This will not end well');
    }

    // Get recipeConfig directly here
    const recipeConfig = window.appConfig?.get?.('recipe');
    const recipe_instructions = (recipeConfig as { instructions?: string })?.instructions;
    const responseConfig = (recipeConfig as { response?: { json_schema?: unknown } })?.response;
    const subRecipes = (recipeConfig as { sub_recipes?: SubRecipe[] })?.sub_recipes;
    const parameters = (recipeConfig as { parameters?: RecipeParameter[] })?.parameters;
    const hasParameters = parameters && parameters?.length > 0;
    const hasSubRecipes = subRecipes && subRecipes?.length > 0;
    let prompt = desktopPrompt;
    if (!hasParameters && recipe_instructions) {
      prompt = `${desktopPromptBot}\nIMPORTANT instructions for you to operate as agent:\n${recipe_instructions}`;
    }
    // Extend the system prompt with desktop-specific information
    await extendPrompt({
      body: {
        session_id: sessionId,
        extension: prompt,
      },
    });

    if (!hasParameters && hasSubRecipes) {
      await addSubRecipesToAgent(sessionId, subRecipes);
    }
    // Configure session with response config if present
    if (responseConfig?.json_schema) {
      const sessionConfigResponse = await updateSessionConfig({
        body: {
          session_id: sessionId,
          response: responseConfig,
        },
      });
      if (sessionConfigResponse.error) {
        console.warn(`Failed to configure session: ${sessionConfigResponse.error}`);
      }
    }

    if (!options?.getExtensions || !options?.addExtension) {
      console.warn('Extension helpers not provided in alpha mode');
      return;
    }

    // Initialize or sync built-in extensions into config.yaml
    let refreshedExtensions = await options.getExtensions(false);

    if (refreshedExtensions.length === 0) {
      await initializeBundledExtensions(options.addExtension);
      refreshedExtensions = await options.getExtensions(false);
    } else {
      await syncBundledExtensions(refreshedExtensions, options.addExtension);
    }

    // Add enabled extensions to agent in parallel (non-blocking)
    const enabledExtensions = refreshedExtensions.filter((ext) => ext.enabled);

    options?.setIsExtensionsLoading?.(true);

    const extensionLoadingPromises = enabledExtensions.map(async (extensionEntry) => {
      const extensionConfig = extractExtensionConfig(extensionEntry);
      const extensionName = extensionConfig.name;

      try {
        await addToAgentOnStartup({
          addToConfig: options.addExtension!,
          extensionConfig,
          toastOptions: { silent: false },
        });
      } catch (error) {
        console.error(`Failed to load extension ${extensionName}:`, error);
      }
    });

    // Load extensions in background without blocking agent initialization
    Promise.allSettled(extensionLoadingPromises).finally(() => {
      options?.setIsExtensionsLoading?.(false);
    });
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    options?.setIsExtensionsLoading?.(false);
    throw error;
  }
};
