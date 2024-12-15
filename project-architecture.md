# Claude Extension Architecture

## Project Structure

The project consists of 54 source files (excluding tests) organized into the following main directories:

- `src/`: Main source code (54 files)
  - `services/` (13 files): Core business logic and API services
    - AliasService.ts
    - AnthropicService.ts
    - ChromeSettingsService.ts
    - ClaudeCache.ts
    - CommandExecutor.ts
    - ConversationRetrieval.ts
    - DocumentDownload.ts
    - DocumentRetrieval.ts
    - ProjectRetrieval.ts
    - ProjectSearchService.ts
    - ScriptExecutionManager.ts
    - ScriptRunner.ts
    - SettingsService.ts
    - StarService.ts
    - StorageService.ts
    - WindowStateService.ts
  - `ui/components/` (11 files): UI-related components
    - ContentPreview.ts
    - ConversationPreview.ts
    - DownloadTable.ts
    - DownloadWidgets.ts
    - DraggableManager.ts
    - EditableCell.ts
    - EditableLabel.ts
    - FloatingWindow.ts
    - HelpManager.ts
    - SearchResultPreview.ts
    - StarredItemsPreview.ts
    - StatusManager.ts
    - UIStateManager.ts
  - `utils/` (21 files): Utility functions and command handling
    - Commands/ (10 files)
      - aliasCommands.ts
      - BaseCommandInfo.ts
      - CommandMap.ts
      - contentCommands.ts
      - knowledgeCommand.ts
      - projectCommands.ts
      - repeatCommand.ts
      - rootCommand.ts
      - settingsCommand.ts
      - simpleCommands.ts
      - stopConditionCommands.ts
    - createConversation.ts
    - deleteConversation.ts
    - ElementWaiter.ts
    - EventStreamParser.ts
    - getClaudeIds.ts
    - getConversation.ts
    - getHeaders.ts
    - parseUtils.ts
    - PathExtractor.ts
    - pathUtils.ts
    - requestCompletion.ts
    - ScriptParser.ts
    - splitText.ts
    - trace.ts
  - `types/` (2 files): TypeScript type definitions
    - index.ts
    - storage.ts
  - Root files (7 files):
    - ClaudeExtension.ts
    - analyzeConversations.ts
    - background.js
    - content.ts
    - manifest.json
    - options.html
    - options.js
    - styles.css

## Organization Principles

The codebase follows these key organizational principles:

1. **Service-Based Architecture**: Core functionality is organized into services (e.g., AnthropicService, StorageService)
2. **Component-Based UI**: UI elements are built as reusable components
3. **Command Pattern**: Extensive use of command pattern for handling user interactions
4. **Type Safety**: Comprehensive TypeScript types defined in `types/` directory
5. **Test Coverage**: Parallel test structure matching source files

## UI Implementation

Due to Chrome extension security restrictions preventing direct CDN downloads, the UI is implemented with:

1. **Vanilla TypeScript**: No external UI frameworks
2. **Internal CSS**: Styles defined in `styles.css`
3. **Custom Components**:
   - `FloatingWindow.ts`: Base window component
   - `DraggableManager.ts`: Window drag functionality
   - `EditableLabel.ts`/`EditableCell.ts`: Inline editing components
   - Various preview components for different content types

## API Integration

The extension handles several types of API calls:

1. **Anthropic API Calls** (`AnthropicService.ts`):

   - Conversation creation/deletion
   - Completion requests
   - Event stream parsing for responses

2. **Chrome Extension APIs**:

   - Storage access
   - Tab management
   - Message passing between components

3. **Internal Service Calls**:
   - Document retrieval
   - Project search
   - Settings management

## Data Persistence

Data persistence is handled through multiple layers:

1. **Chrome Storage** (`StorageService.ts`):

   - Conversation history
   - User settings
   - Project data
   - Command aliases

2. **Window State** (`WindowStateService.ts`):

   - UI positions
   - Visibility states
   - Current selections

3. **Cache Layer** (`ClaudeCache.ts`):
   - Temporary conversation data
   - Performance optimizations

## Command System

The command system is built around several key components:

1. **Command Parsing** (`splitText.ts`, `ScriptParser.ts`):

   - Handles quoted and unquoted text
   - Parses command arguments
   - Supports nested commands

2. **Command Types**:

   - Simple commands (`simpleCommands.ts`)
   - Content commands (`contentCommands.ts`)
   - Project commands (`projectCommands.ts`)
   - Knowledge commands (`knowledgeCommand.ts`)
   - Settings commands (`settingsCommand.ts`)
   - Alias commands (`aliasCommands.ts`)

3. **Command Execution** (`CommandExecutor.ts`, `ScriptExecutionManager.ts`):

   - Command validation
   - Argument processing
   - Error handling
   - Script execution flow

4. **Command Mapping** (`CommandMap.ts`):
   - Command registration
   - Command lookup
   - Help text generation

The command system supports:

- Nested command execution
- Variable substitution
- Error handling and recovery
- Command aliasing
- Script execution
- Stop conditions

This architecture enables powerful command chaining while maintaining readability and maintainability through clear separation of concerns and comprehensive testing.
