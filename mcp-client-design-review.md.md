Okay, let's refine the MCP client design based on the existing codebase and then update the implementation plan with success conditions and verification steps.

## Refined MCP Client Design (Integrating with Existing Code)

This revised design incorporates the proposed MCP functionality into the existing structure of the Claude PS extension as analyzed from the `src/` directory.

**1. Overview & Goals:** [cite: 2, 3, 4, 5, 6, 7, 8, 9] Remains the same: Extend the Claude PS extension to act as an MCP client, detecting commands, communicating via WebSocket, handling responses, performing local actions (like reading files for `write_artifact`), and injecting prompts back to Claude.

**2. Assumptions:** [cite: 10, 11, 12, 13] Largely hold true.

- The extension _does_ have `background.js`, `content.ts`, `SettingsService`, etc. [cite: 3, 5, 28].
- The assumption about detecting MCP commands in a specific Markdown block (` ```mcp ... ``` `) is the basis for the detection mechanism [cite: 12, 13].

**3. Architecture Components (Refined & Integrated):**

1. **MCP Configuration UI (Options Page):**
    
    - **Integration:** Extend the existing `options.html` [cite: 9] and `options.js` [cite: 4] to include fields for MCP Server WebSocket URL, optional Authentication Key, and an enable/disable toggle [cite: 14, 77].
    - **Settings Storage:** Use the existing `SettingsService` [cite: 28] (which uses `ChromeSettingsService` [cite: 16]) to store these new settings (`mcpServerUrl`, `mcpAuthKey`, `mcpEnabled`) [cite: 15, 44, 45, 71]. Add validation logic within `SettingsService` for the MCP URL [cite: 72, 73, 74, 75, 76].
    - **Testing:** The "Test Connection" button will send a message to the `Background Script` to initiate a test connection via the `WebSocket Manager`.
2. **Response Monitor & Detector (Content Script / Utils):**
    
    - **Integration:** Instead of a standalone monitor, this logic needs to be integrated where Claude's responses are currently processed. This could be within `ScriptRunner`'s response handling loop [cite: 17] or potentially by modifying the `requestCompletion` utility [cite: 38] or `EventStreamParser` [cite: 39] if streaming is used for MCP command injection.
    - **Detection:** Implement the `MCPCommandDetector` logic (as proposed in the plan [cite: 78, 79, 80, 81, 82]) as a utility function or class. This function will parse the final response text received from Claude (after streaming completes or via non-streaming response) to find ` ```mcp ... ``` ` blocks [cite: 18].
    - **Communication:** When an MCP command JSON is detected, the Content Script part (e.g., `ScriptRunner` or `ClaudeExtension`) sends it to the `Background Script` via `chrome.runtime.sendMessage` [cite: 19, 88].
3. **MCP Command Processor (Background Script):**
    
    - **Location:** Resides in the `Background Script` (`background.js` or a dedicated module imported by it) [cite: 19, 103].
    - **Functionality:** Receives detected MCP JSON via `chrome.runtime.onMessage` [cite: 104]. Parses the command and arguments [cite: 20]. Handles special commands like `write_artifact` by interacting with the `Artifact Reader` [cite: 21, 113]. For standard commands, it interacts with the `WebSocket Manager` to send requests [cite: 21, 114]. Receives responses from the `WebSocket Manager` and forwards processed results (ready to become a prompt) back to the Content Script [cite: 26, 115, 126].
4. **WebSocket Manager (Background Script):**
    
    - **Location:** Resides in the `Background Script` (likely a new service class, e.g., `WebSocketManager.ts`) [cite: 22, 103].
    - **Functionality:** Retrieves MCP config from `SettingsService` [cite: 22]. Establishes and manages the WebSocket connection (`wss://`) [cite: 23, 98]. Handles authentication using `mcpAuthKey` [cite: 23, 46]. Sends requests received from `MCP Command Processor` [cite: 24, 109]. Receives responses and passes them to `MCP Command Processor` [cite: 24, 126]. Manages connection state and reconnection logic [cite: 25, 50]. Provides status updates [cite: 105, 107].
5. **Artifact Reader (Background Script):**
    
    - **Location:** Resides in the `Background Script` (likely a new service class, e.g., `ArtifactReader.ts`) [cite: 27, 69].
    - **Challenge:** Direct file system access is restricted [cite: 28].
    - **Approach:** The most feasible approach is **user-initiated file selection** [cite: 30, 54, 61]. When the `MCP Command Processor` identifies a `write_artifact` command [cite: 51, 113], the `Background Script` must trigger a mechanism (possibly via the Content Script or a dedicated extension page/popup) to prompt the user to select the required file. The selected file's content can then be read and passed back to the `MCP Command Processor` [cite: 32, 55]. Storing/reading artifacts within the extension's sandboxed storage (`StorageService` using OPFS [cite: 20]) might be an alternative if artifacts are expected to be managed _by_ the extension itself, but this doesn't seem to fit the `write_artifact` command's likely intent of reading arbitrary local files specified by the model.
6. **Prompt Injector (Content Script):**
    
    - **Integration:** This functionality likely integrates with or replaces parts of the existing prompt submission logic within `ScriptRunner.ts` (specifically `insertPrompt` and `simulateEnterKey` methods [cite: 17]) or `requestCompletion` [cite: 38, 120, 121, 122].
    - **Functionality:** Receives the final processed response/prompt text from the `Background Script` (originating from the MCP server response) via `chrome.runtime.onMessage` [cite: 33, 127]. Formats it if necessary [cite: 34, 115]. Uses existing DOM manipulation techniques to inject the text into Claude's input field and simulate submission [cite: 35, 117-125].

**4. Communication Protocol & Security:** Remains largely as described in the original design [cite: 45-50, 56-62]. Use `chrome.storage.local` for the `mcpAuthKey` [cite: 57]. Use `wss://` [cite: 59]. Emphasize user interaction for file access [cite: 60, 61].

**5. Diagrams:**

- **Component Diagram (Refined):**
    
    Code snippet
    
    ```
    graph LR
        subgraph Browser Extension
            OptionsPage[Options UI (options.html/js)] -- Settings --> SettingsService
            ContentScript[Content Script (content.ts)] -- Detects Command / Injects Prompt --> ClaudeUI([Claude Web UI/API])
            ContentScript -- MCP Cmd / Prompt Data --> BackgroundScript
            subgraph BackgroundScript[Background Script (background.js)]
                direction TB
                MCPProcessor[MCP Command Processor] -- Uses --> SettingsService
                MCPProcessor -- Sends Request / Receives Response --> WSManager[WebSocket Manager]
                MCPProcessor -- Needs Artifact --> ArtifactReader[Artifact Reader *]
                WSManager -- Uses --> SettingsService
            end
            ContentScript --> ClaudeExt[ClaudeExtension]
            ClaudeExt --> ResponseMonitorLogic -- Detects Command --> ContentScript
            ClaudeExt --> PromptInjectorLogic -- Injects Prompt --> ContentScript
        end
    
        SettingsService -- Reads/Writes --> ChromeStorage[(chrome.storage)]
        BackgroundScript -- WebSocket --> MCPServer([Remote MCP Server])
        ArtifactReader -- Requests File --> UserInteraction[User File Selection]
        UserInteraction -- File Content --> ArtifactReader
    
        style ChromeStorage fill:#f9f,stroke:#333,stroke-width:2px
        style ArtifactReader fill:#f00,stroke:#333,stroke-width:2px,color:#fff
        style UserInteraction fill:#ff0,stroke:#333,stroke-width:2px
        style ClaudeUI fill:#ccf,stroke:#333,stroke-width:2px
        style MCPServer fill:#ccf,stroke:#333,stroke-width:2px
        style ResponseMonitorLogic fill:#eef,stroke:#999,stroke-width:1px,stroke-dasharray: 5 5
        style PromptInjectorLogic fill:#eef,stroke:#999,stroke-width:1px,stroke-dasharray: 5 5
    
    ```
    
- **Sequence Diagrams:** The original sequence diagrams (`Standard MCP Command Flow` [cite: 39, 40] and `write_artifact Command Flow` [cite: 41, 42, 43]) remain conceptually valid, but replace "Monitor" and "Injector" actions with interactions originating from/targeting the `ContentScript`/`ClaudeExtension` and its integrated logic. The `ArtifactReader` interaction needs to explicitly show the user file selection step [cite: 42].
    

