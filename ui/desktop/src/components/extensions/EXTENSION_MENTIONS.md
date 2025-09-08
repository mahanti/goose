# Extension @ Mentions

## Overview

The Extension @ Mention system allows users to mention both extensions and files directly in the chat input using the "@" symbol. This creates a social, Discord-like experience where extensions feel like participants you can directly address.

## How It Works

### Triggering Mentions
1. Type "@" in the chat input field
2. A dropdown appears showing:
   - **Extensions first** (with blue @ prefix and extension icons)
   - **Files second** (with file icons)

### Visual Design
- **Extensions**: Shown with their logos, blue "@" prefix, and "EXT" badge
- **Files**: Shown with file type icons and folder paths
- **Smart Filtering**: Fuzzy search matches extension names, display names, and file paths
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select, Esc to close

### Selection Results
- **Extension mentions**: Inserts `@ExtensionName` into the message
- **File mentions**: Inserts the full file path

## Technical Implementation

### Components
- **`ExtensionMentionPopover.tsx`**: Unified mention dropdown for both extensions and files
- **`ChatInput.tsx`**: Enhanced with extension mention support

### Key Features
1. **Unified Interface**: Single popover handles both extensions and files
2. **Smart Prioritization**: Extensions appear first when no query, files get prioritized based on relevance
3. **Fuzzy Matching**: Intelligent search across extension names and file paths  
4. **Visual Distinction**: Clear icons and badges distinguish extensions from files
5. **Keyboard Support**: Full keyboard navigation support

### Integration Points
- Uses existing mention detection logic (@ symbol)
- Leverages `useConfig` hook for extension data
- Integrates with file system APIs for file listings
- Maintains cursor positioning after insertion

## Usage Examples

### Basic Extension Mention
```
User types: "@dev"
Dropdown shows: 
  📦 @Developer (EXT)
  📁 dev-config.json
  
User selects: @Developer
Result: "@Developer" inserted in chat
```

### File Mention
```
User types: "@config"
Dropdown shows:
  ⚙️ @Computer Controller (EXT)  
  📄 config.py
  📄 app.config.js

User selects: config.py
Result: "/path/to/config.py" inserted in chat
```

### Empty Query (Show All)
```
User types: "@"
Dropdown shows:
  📦 @Developer (EXT)
  📦 @Computer Controller (EXT)
  🧠 @Memory (EXT)
  📄 README.md
  📄 package.json
```

## Future Enhancements

### Planned Features
1. **Auto-suggestion**: Smart suggestions based on context
2. **Extension Integration**: Direct routing to mentioned extensions
3. **Mention Highlighting**: Visual highlighting of mentions in chat
4. **Extension Commands**: `@extension command` syntax
5. **Group Mentions**: `@group` to mention multiple extensions

### Extension Chat Integration
- When extension is mentioned, could auto-route message to that extension
- Could pre-populate extension chat with mentioned extensions
- Potential for extension-specific command syntax (`@developer edit file.py`)

## Technical Architecture

### Data Flow
```
User Input → Mention Detection → Extension/File Matching → Dropdown Display → Selection → Text Insertion
```

### Performance Optimizations
- Lazy file loading (only when popover opens)
- Efficient fuzzy matching algorithm
- Capped results (max 10 items)
- Smart caching of extension data

### Accessibility
- Full keyboard navigation support
- Screen reader friendly labels
- Clear visual hierarchy
- Escape key support for quick dismissal

The @ mention system transforms the chat input from a simple text field into a social, collaborative interface where both extensions and files are first-class citizens in the conversation.
