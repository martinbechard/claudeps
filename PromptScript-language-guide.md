# PromptScript Language Guide

[Previous content remains the same until the command summary table]

#### Summary of Commands and Abbreviations

| Command           | Abbreviation | Description                                                                     |
| ----------------- | ------------ | ------------------------------------------------------------------------------- |
| `/repeat`         | `/rp`        | Repeat the following prompt                                                     |
| `/stop_if`        | `/p`         | Stop repeating or stop the script if the LLM response contains a string         |
| `/stop_if_not`    | `/p`         | Stop repeating or stop the script if the LLM response does not contain a string |
| `/alias`          | `/@+`        | Define a new alias                                                              |
| `/delete_alias`   | `/@-`        | Delete an existing alias                                                        |
| `/list_alias`     | `/@?`        | List all defined aliases                                                        |
| `/conversation`   | `/c`         | Export the current chat                                                         |
| `/artifacts`      | `/a`         | Export artifacts as markdown files                                              |
| `/project`        | `/p`         | List chats in the current project                                               |
| `/search_project` | `/sp`        | Search projects for specified text                                              |
| `/query_project`  | `/qp`        | Execute a prompt against every chat in the project                              |
| `/knowledge`      | `/k`         | Access knowledge base and documentation                                         |
| `/settings`       | `/s`         | View or update extension settings                                               |
| `/root`           | `/r`         | View or set download root path                                                  |

[Previous content remains the same until the ClaudePS Commands section]

## 6. ClaudePS Commands

ClaudePS is a Chrome Extension that implements the PS language for use with the Claude Projects web application. It provides the following Claude-specific commands:

### Content Commands

#### `/conversation` (`/c`)

- **Description:** Export the current chat
- **Options:**
  - `/artifacts` (`/a`): Include artifacts in the export

#### `/artifacts` (`/a`)

- **Description:** Export artifacts as markdown files

### Project Commands

#### `/project` (`/p`)

- **Description:** List chats in the current project

#### `/search_project` (`/sp`)

- **Description:** Search projects for specified text
- **Usage:** `/sp <search_term>`
- **Example:** `/sp budget report`

#### `/query_project` (`/qp`)

- **Description:** Execute a prompt against every chat in the project
- **Usage:** `/qp <prompt_text>`
- **Example:** `/qp Summarize the key points discussed.`

### Documentation Commands

#### `/knowledge` (`/k`)

- **Description:** Access knowledge base and documentation

### Settings Command

#### `/settings` (`/s`)

- **Description:** View or update extension settings
- **Usage:**
  - View current settings: `/settings`
  - Update settings: `/settings <option>=<value>`
- **Options:**
  - `enable_api`: Enable/disable Anthropic API (true/false)
  - `api_key`: Set Anthropic API key (must start with "sk-ant-")
  - `model`: Set Claude model (e.g., "claude-3-5-sonnet-20241022")
  - `theme`: Set UI theme ("light" or "dark")
  - `debug_trace`: Enable/disable API request tracing (true/false)
  - `debug_window`: Enable/disable window event tracing (true/false)
- **Examples:**
  - `/settings theme=dark`
  - `/settings enable_api=true api_key=sk-ant-your-key`
  - `/settings debug_trace=true debug_window=false`

### Root Command

#### `/root` (`/r`)

- **Description:** View or set download root path
- **Usage:**
  - View current root: `/root`
  - Set root path: `/root <path>`
  - Clear root path: `/root clear`
- **Examples:**
  - `/root /Users/username/Downloads`
  - `/root clear`

### Command Visibility

Commands are only visible and available based on the current context:

- `/project`, `/search_project`, `/query_project`, and `/knowledge` require being in a project context
- `/conversation` and `/artifacts` require being in a chat context
- `/settings` and `/root` are available in any context

[Rest of the content remains the same]
