
## Updated Implementation Plan

This plan incorporates the refined design and adds success conditions and verification methods.

_(Based on `mcp-client-implementation-plan.md` [cite: 66])_

---

### 3.1 MCP Configuration and Settings

1. **Extend `SettingsService` (`SettingsService.ts`):** [cite: 71]
    
    - **Task:** Add `mcpEnabled` (boolean), `mcpServerUrl` (string), `mcpAuthKey` (string) to the `Settings` interface. Add validation methods (`validateMcpUrl`, potentially `validateMcpAuthKey`). Update `getSetting`/`setSetting`/`getSettings` to handle defaults (e.g., `mcpEnabled` defaults to `false`). Store `mcpAuthKey` using `chrome.storage.local` via `ChromeSettingsService` if possible, otherwise `sync`.
    - **Success Condition:** `SettingsService` correctly loads, saves, validates, and provides defaults for the new MCP settings. `mcpAuthKey` uses appropriate storage.
    - **Verification:** Unit tests for `SettingsService` covering get/set/validation/defaults for MCP fields. Check `chrome.storage.local` or `sync` in browser developer tools to confirm key storage.
2. **Update Options UI (`options.html`/`options.js`):** [cite: 77]
    
    - **Task:** Add the MCP settings section (Enable toggle, URL input, Auth Key input, Test Connection button) to `options.html`. Update `options.js` to load/save these settings using `SettingsService`. Implement the "Test Connection" button to send a message (`type: 'mcp_test_connection'`) to the background script. Add UI feedback for validation and test connection results.
    - **Success Condition:** Options page UI displays correctly, loads existing MCP settings, saves new settings via `SettingsService`, performs input validation, and the "Test Connection" button sends the correct message to the background script.
    - **Verification:** Manual testing: Open options page, verify UI elements. Enter valid/invalid data, save, reload, check persistence. Check validation messages. Click "Test Connection" and verify the message is sent (using console logs or background script debugger) and UI feedback is shown.

---

### 3.2 Command Detection and Monitoring

3. **Create `MCPCommandDetector` Utility:** [cite: 78]
    
    - **Task:** Implement a utility class or function (`MCPCommandDetector.detect`) that accepts text and returns an array of parsed JSON objects found within ` ```mcp ... ``` ` blocks [cite: 79, 80]. Include error handling for invalid JSON [cite: 81].
    - **Success Condition:** The detector correctly identifies and parses valid MCP JSON blocks from various text inputs, including multiple blocks, and handles non-MCP blocks or invalid JSON gracefully.
    - **Verification:** Unit tests with various input strings (no MCP block, single block, multiple blocks, block with invalid JSON, block with other language identifiers, text surrounding blocks).
4. **Integrate Detection into Response Handling:** (Modify existing code, e.g., `ScriptRunner.ts` or `requestCompletion.ts`)
    
    - **Task:** Identify where the final Claude response text is available (likely after stream processing in `ScriptRunner` or `requestCompletion`). Call `MCPCommandDetector.detect` on this text. If commands are found, send them via `chrome.runtime.sendMessage({ type: 'mcp_command', commands: [...] })` to the background script [cite: 88]. Ensure this doesn't interfere with normal script execution flow. Add checks for `mcpEnabled` setting from `SettingsService` before performing detection/sending.
    - **Success Condition:** When Claude produces a response containing a valid ` ```mcp ... ``` ` block and MCP is enabled, a `mcp_command` message is sent to the background script containing the parsed command(s). Normal responses without MCP blocks are processed as usual. No detection occurs if MCP is disabled.
    - **Verification:** Integration testing: Trigger Claude responses with and without MCP blocks (manually or via test scripts). Use browser developer tools (console logs in content/background scripts, network tab) to verify the `mcp_command` message is sent only when expected and contains the correct data. Test with MCP enabled/disabled in settings.

---

### 3.3 WebSocket Communication

5. **Create `WebSocketManager` Service (`WebSocketManager.ts`):** [cite: 94]
    
    - **Task:** Implement a class to manage the WebSocket connection. Include methods to `connect`, `disconnect`, `send`. Handle `onopen` (send auth key if present [cite: 46]), `onmessage` (parse JSON, notify listeners), `onerror`, `onclose` (implement reconnection logic [cite: 50]). Retrieve URL/Key from `SettingsService` [cite: 22]. Maintain and expose connection status (`disconnected`, `connecting`, `connected`, `error`) [cite: 95, 101]. Add `onMessage` listener registration.
    - **Success Condition:** `WebSocketManager` can connect to a test WebSocket server using settings, send/receive JSON messages, handle authentication, maintain status, and attempt reconnection on unexpected closure.
    - **Verification:** Unit tests mocking `WebSocket`. Integration tests against a simple local WebSocket echo server: test connect/disconnect, send/receive, authentication, error handling (server unavailable, connection drop), reconnection logic.
6. **Extend Background Script (`background.js` + new `mcpHandler.js`):** [cite: 103]
    
    - **Task:** Create a handler module (`mcpHandler.js` or similar). Initialize `WebSocketManager` here. Add listeners for `chrome.runtime.onMessage` to handle `mcp_command` (received from content script) and `mcp_test_connection` (from options page). Implement `handleMCPCommand` function to interact with `WebSocketManager.send` [cite: 109]. Implement test connection logic. Add a listener for messages from `WebSocketManager` (`onMessage`) to receive server responses [cite: 126]. Provide a way to get connection status for the options page [cite: 105]. Check `mcpEnabled` setting.
    - **Success Condition:** Background script initializes `WebSocketManager` only if MCP is enabled. It receives `mcp_command` messages, forwards requests via `WebSocketManager`, and handles `mcp_test_connection` requests correctly. It listens for and receives messages from the WebSocket.
    - **Verification:** Integration testing: Send `mcp_command` and `mcp_test_connection` messages from the content script/options page console. Verify background script logs, WebSocket server interactions, and responses sent back (if any). Test with MCP enabled/disabled.
7. **Add UI Status Indicators (`FloatingWindow.ts`):** [cite: 107]
    
    - **Task:** Add a status indicator element to the `FloatingWindow` template. Create a function (`updateMCPStatus`) in `FloatingWindow` to periodically request the connection status from the background script (`type: 'mcp_connection_status'`) and update the indicator's text/styling based on the response (`disconnected`, `connecting`, `connected`, `error`) [cite: 108].
    - **Success Condition:** The floating window displays the current MCP WebSocket connection status accurately and updates when the status changes.
    - **Verification:** Manual testing: Observe the status indicator in the floating window while enabling/disabling MCP, configuring valid/invalid URLs, and starting/stopping the test WebSocket server to simulate different connection states.

---

### 3.4 Command Processing and Response Handling

8. **Create `MCPCommandProcessor` Service (`MCPCommandProcessor.ts` in Background):** [cite: 111]
    
    - **Task:** Implement the class within the background script context. It should take `WebSocketManager` and `ArtifactReader` instances. Implement `processCommand` to validate commands [cite: 112], route to special handlers (like `handleWriteArtifact`) [cite: 113], or send standard commands via `WebSocketManager` [cite: 114]. Implement `formatResponseForClaude` to prepare the server's response into a string suitable for a prompt [cite: 115, 116]. Modify `handleMCPCommand` in the background script to use this processor.
    - **Success Condition:** The processor correctly validates commands, routes `write_artifact` to its handler, sends other commands via WebSocket, receives responses, and formats them for Claude.
    - **Verification:** Unit tests for `processCommand` and `formatResponseForClaude` with various command/response scenarios. Integration testing: Send different MCP commands from the content script and verify the processor's logic execution via background script logs and WebSocket server interactions.
9. **Integrate Prompt Injection:** (Modify `ScriptRunner.ts` / `requestCompletion.ts` / Create `PromptInjector` Util) [cite: 117]
    
    - **Task:** In the background script, when `MCPCommandProcessor` provides the formatted response string, send it to the content script (`type: 'mcp_inject_prompt'`, `promptText: '...'`) [cite: 126]. In the content script (`content.ts` or `ClaudeExtension.ts`), add a listener for this message [cite: 127]. Use existing methods (`findInputElement`, `insertPrompt`, `simulateEnterKey` - potentially refactored into a `PromptInjector` utility [cite: 124]) to inject the text into Claude's input and submit it [cite: 117-122].
    - **Success Condition:** Receiving an `mcp_inject_prompt` message in the content script successfully inserts the provided text into Claude's input field and simulates submission.
    - **Verification:** Integration testing: Manually trigger an `mcp_inject_prompt` message from the background script console, or complete the end-to-end flow with a test MCP command/response, and verify the prompt appears and is submitted in the Claude UI.

---

### 3.5 Artifact Handling

10. **Implement `ArtifactReader` Service (`ArtifactReader.ts` in Background):** [cite: 129, 130]
    
    - **Task:** Implement the service. The primary strategy for `readArtifact` must involve user interaction. When called, it should send a message (`type: 'mcp_request_file'`, `artifactName: '...'`) to the content script.
    - **Success Condition:** The `readArtifact` method correctly triggers the file request message to the content script.
    - **Verification:** Unit tests. Integration testing: Call `readArtifact` from the background script console and verify the message is sent.
11. **Implement File Request UI (Content Script / `FloatingWindow.ts`):**
    
    - **Task:** In the content script, listen for `mcp_request_file`. On receipt, display a prompt/modal (could be a simple browser `confirm` initially, or integrated into `FloatingWindow`) asking the user to select the file (`artifactName`). Use an `<input type="file">` element to trigger the browser's file picker. Read the selected file's content (e.g., using `FileReader`). Send the content back to the background script (`type: 'mcp_file_content'`, `content: '...'`, `artifactName: '...'`). Handle cancellation/errors.
    - **Success Condition:** The user is prompted to select a file, can select one, and its content is successfully read and sent back to the background script. Cancellation is handled.
    - **Verification:** Manual testing: Trigger the `mcp_request_file` message. Verify the prompt appears, the file picker opens, selecting a file sends its content back (check background script logs), and cancelling works.
12. **Integrate `write_artifact` Handling (`MCPCommandProcessor.ts`):** [cite: 113]
    
    - **Task:** Implement `handleWriteArtifact`. This method calls `ArtifactReader.readArtifact`. It needs to _wait_ for the file content response (`mcp_file_content`) from the content script (likely using Promises and storing `resolve` functions mapped to `artifactName`). Once content is received, format the _original_ MCP command arguments to include the content, and _then_ send the modified request via `WebSocketManager`.
    - **Success Condition:** An `write_artifact` command correctly triggers the file reading flow, waits for content, includes the content in the arguments sent to the MCP server, and then proceeds with the normal response handling.
    - **Verification:** End-to-end testing: Trigger a Claude response with an `write_artifact` command. Verify the file prompt appears, select a file, check the message sent to the WebSocket server contains the file content within the arguments, and the final response is injected back to Claude. Test cancellation/errors during file selection.

---

This refined design and updated plan provide a clearer path for integrating MCP functionality into the existing Claude PS extension, leveraging its current structure while adding necessary components and specifying verification methods for each step.