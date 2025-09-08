# Extension Chat Feature

## Overview

The Extension Chat feature transforms Goose's extension system into a social, collaborative interface where extensions act like individual agents or teammates. Instead of Goose acting as a central orchestrator, you can now start direct conversations with specific extensions or create group chats where multiple extensions collaborate together.

## Key Concepts

### 🤖 **Extension as Agents**
Each extension is treated as an individual "person" in the conversation with:
- Unique visual identity (logo/avatar)
- Clear attribution for all actions
- Distinct personality and capabilities

### 💬 **Chat Modes**
- **Single Chat**: Direct conversation with one extension
- **Group Chat**: Multiple extensions collaborating together

### 🎯 **Direct Routing**
Bypass the orchestrator's decision-making process - you explicitly choose which extensions should handle your request.

## Components

### Core Components

#### `ExtensionChatStarter.tsx`
- Modal interface for selecting extensions to chat with
- Toggle between single and group chat modes
- Visual preview of selected extensions
- Handles enabled/disabled extension filtering

#### `ExtensionAvatar.tsx`
- Visual representation of extensions in chat
- Multiple size variants (sm, md, lg)
- Group avatar display for multiple extensions
- Consistent branding using extension logos

#### `ExtensionMessage.tsx`
- Chat messages with extension attribution
- Displays which extension performed each action
- Tool call visualization with proper attribution
- Collaboration indicators

#### `ExtensionChatInterface.tsx`
- Main chat interface for extension conversations
- Shows active extensions in header
- Real-time typing indicators
- Extension-specific routing information

#### `ExtensionChatView.tsx`
- Entry point and state management
- Handles navigation between starter and chat modes
- Manages chat session lifecycle

## Usage

### Accessing Extension Chat

1. **From Chat Input**: Click the Users icon (👥) in the bottom toolbar
2. **From Navigation**: Use `setView('extensionChat')` programmatically

### Starting a Single Chat

1. Click the Extension Chat button
2. Select "Single Chat" mode
3. Choose one extension from the grid
4. Click "Start Chat"

### Starting a Group Chat

1. Click the Extension Chat button  
2. Select "Group Chat" mode
3. Choose multiple extensions from the grid
4. Click "Start Group Chat"

### During the Conversation

- **Extension Attribution**: See which extension is performing each action
- **Typing Indicators**: Know when an extension is processing your request
- **Status Indicators**: Green dots show extension availability
- **Direct Routing**: All messages go directly to selected extensions

## Technical Architecture

### Routing Flow

```
User Message → Extension Chat Interface → Selected Extensions
                     ↓
Extension Responses → Attributed Messages → Chat Interface
```

### Key Benefits

1. **Faster Responses**: Skip orchestrator decision-making
2. **Clear Attribution**: Always know which extension is acting
3. **Targeted Requests**: Send requests to specific extension capabilities
4. **Collaborative Work**: Multiple extensions can work together visibly

### Integration Points

- **Navigation**: Added `extensionChat` view type
- **Chat Input**: Extension chat button in toolbar
- **Routing**: Direct extension targeting bypasses Agent orchestration
- **State Management**: Session-aware extension chat history

## Examples

### Single Extension Chat
```
User: "Edit main.py to add logging"
Developer Extension: "I'll edit your main.py file now..."
[Shows file editing action with Developer attribution]
```

### Group Extension Chat
```
User: "Scrape competitor prices and update our database"
Web Scraper: "Fetching price data from competitor sites..."
Database Extension: "Preparing to update pricing table..."
Web Scraper: "Found 50 products with updated prices"
Database Extension: "Successfully updated 50 product prices"
```

## Future Enhancements

- **Extension Personalities**: Custom response styles per extension
- **Cross-Extension Communication**: Extensions talking to each other
- **Extension Specialization**: Smart suggestions based on request type
- **Chat History**: Extension-specific conversation persistence
- **Extension Status**: Real-time availability and capability updates

## Development Notes

### Adding New Extensions

New extensions automatically appear in the Extension Chat interface if they're enabled in the main extension system.

### Customization

- **Avatars**: Handled by `ExtensionLogo` component with fallback colors
- **Attribution**: Extensible through `ExtensionMessageAttribution`
- **Chat Themes**: Customizable through CSS classes and Card variants

### Backend Integration

This interface provides the foundation for direct extension communication. Backend integration points:

1. **Tool Call Routing**: Direct targeting of specific extensions
2. **Response Attribution**: Tracking which extension generated responses
3. **Collaborative Workflows**: Multiple extensions working on shared tasks
4. **Performance Optimization**: Bypassing orchestration overhead

The Extension Chat feature represents a paradigm shift from "AI with tools" to "team of AI specialists", making interactions more transparent, efficient, and collaborative.
