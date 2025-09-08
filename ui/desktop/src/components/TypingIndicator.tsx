import React from 'react';
import { ChatState } from '../types/chatState';

interface TypingIndicatorProps {
  chatState?: ChatState;
}

const TypingIndicator = ({ chatState = ChatState.Idle }: TypingIndicatorProps) => {
  // Don't show if idle
  if (chatState === ChatState.Idle) return null;

  return (
    <div className="flex w-full justify-center min-w-0 mt-2">
      <div className="flex-col max-w-[720px] w-full flex items-start">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl py-2 px-3 w-fit min-h-[24px] items-center">
          <div className="flex items-center justify-center">
            {/* Three animated dots with iMessage-style animation - scaled down by 50% */}
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:0s] [animation-duration:1.4s]"></div>
              <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s] [animation-duration:1.4s]"></div>
              <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s] [animation-duration:1.4s]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
