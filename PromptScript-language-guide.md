# PromptScript Language Guide

Copyright (c) 2024 Martin Bechard Martin.Bechard@DevConsult.ca

## Introducing the PromptScript Language for LLMs

**PromptScript** is a scripting language designed to control a Large Language Model (LLM). 
It enables users to automate complex scenarios, for example leveraging chain-of-thought.

PS is an acronym that stands for Prompt Script, which was the original name, but because it can be a tongue-twister to say quickly, was shortened to just "PS". 

PromptScript automates interactions with the LLM by sending prompts, executing commands, and issuing follow-up prompts based on the responses received.

It also provides features to make reuse of prompts easy, and support extraction of files created by the LLM.


**Note:** All commands start with `/` to make it easier to distinguish them from prompts that might contain some of the same words. Keywords are **not case-sensitive**.

### The ClaudePS Tool
ClaudePS is a Chrome Extension that implements the PS language for use with the Claude Projects environment. It is available as Open Source on github: 

![[Screenshot 2024-11-03 at 8.07.31 PM.png]]

_Interesting factoid: most of the code of ClaudePS was generated with Claude Sonnet 3.5!_

---

## 1. Basic Structure

- **Script Composition:**

  - A script consists of one or more prompts or commands to be sent to the LLM.
  - Prompts and commands are separated by semicolons `;`.
  - All commands and keywords start with `/` and are not case-sensitive.
  - A certain number of commands can result in interactive execution of functions which will help manage projects, conversations and artifacts
  - Quotes can be used to include semicolons within a prompt without splitting it.
  
- **Execution Flow:**
  - Each prompt is sent to the LLM one at a time.
    After each prompt, the interpreter waits for the LLM's response before proceeding to the next statement.
  - The flow of the script can be controlled using conditional commands like `/stop_if` and `/stop_if_not`.

- **Keyword Abbreviations:**

  - Commands and options can be abbreviated to their first letter(s) if applicable.
  - Example: `/c /a` is equivalent to `/conversation /artifacts`.
  - 
  - **PromptScript Sample**
  The following script helps overcome a size limitation when generating a large file:

```promptscript
 Generate a Draw.io diagram XML based on the previously described processes and interconnections. To avoid exhausing all tokens, split up the diagram into artifacts of up to 50 lines. Name them with the part number e.g. "Diagram- Part N". Say "All Done." when reaching the end of the diagram.;
 
/repeat /stop_if "All Done."
 ok;


```

- **Emulated LLM Interaction:**

  _Prompt:_
```
 Generate a Draw.io diagram XML based on the previously described processes and interconnections. To avoid exhausing all tokens, split up the diagram into artifacts of up to 50 lines. Name them with the part number e.g. "Diagram- Part N". Say "All Done." when reaching the end of the diagram.
```
  _LLM Response:_
 ```
Generating "Diagram - Part 1".
Do you want to continue with part 2?
```

_Prompt:_
```
 ok.
```
  _LLM Response:_
 ```
Generating "Diagram - Part 2".
Do you want to continue with part 3?
```

_Prompt:_
```
 ok.
```
  _LLM Response:_
 ```
Generating "Diagram - Part 3".
All done.
```

The script ends because the response contains the string "All done."

#### Summary of Commands and Abbreviations

| Command         | Abbreviation | Description                                                                     |
| --------------- | ------------ | ------------------------------------------------------------------------------- |
| `/repeat`       | `/r`         | Repeat the following prompt                                                     |
| `/stop_if`      | `/p`         | Stop repeating or stop the script if the LLM response contains a string         |
| `/stop_if_not`  | `/p`         | Stop repeating or stop the script if the LLM response does not contain a string |
| `/alias`        | /@+          | Define a new alias.                                                             |
| `/delete_alias` | /@-          | Delete an existing alias.                                                       |
| `/list_alias`   | /@?          | List all defined aliases.                                                       |

---

## 2. Simple Prompt

- **Syntax:**

  ```promptscript
  <prompt_text1>; <prompt_text2>; ...
  ```

- **Description:**

  - Each `<prompt_text>` is sent to the LLM in sequence.
  - The interpreter waits for a response after each prompt before sending the next.

- **Example:**
  The following promptscript consists of two prompts separated by a semicolon. Each prompt will be executed in turn.

  ```promptscript
  Tell me a joke;
  What is the capital of France?
  ```

- **Emulated LLM Interaction:**

  **Prompt 1:**

  ```
  Tell me a joke
  ```

  **LLM Response:**

  ```
  Why don't scientists trust atoms? Because they make up everything!
  ```

  **Prompt 2:**

  ```
  What is the capital of France?
  ```

  **LLM Response:**

  ```
  The capital of France is Paris.
  ```

---

## 3. Conditional Execution with `/stop_if`

### `/stop_if`

- **Syntax:**

  ```promptscript
  /stop_if <condition>
  ```

- **Description:**
  - After a prompt is sent and the response is received, if the `<condition>` is found in the response, the script execution ends.

### `/stop_if_not`

- **Syntax:**

  ```promptscript
  /stop_if_not <condition>
  ```

- **Description:**

  - After a prompt is sent and the response is received, if the `<condition>` is **not** found in the response, the script execution ends.

- **Notes:**

  - `/stop_if` and `/stop_if_not` are **not case-sensitive**.
  - They are separate commands that follow the prompt.
  - Multiple conditions can be specified by using multiple `/stop_if` or `/stop_if_not` commands.

- **Examples:**
  The following script produces an artifact unless there was a failure:

  ```promptscript
  Check the status of the operation;
  /stop_if fail
  Create an artifact with the operation output
  ```

- **Emulated LLM Interaction:**

  **Prompt:**

  ```
  Check the status of the operation
  ```

  **LLM Response:**

  ```
  The operation failed.
  ```

  - The response contains "fail", so the script execution ends.

The following script makes recommendations if there were errors

```promptscript
Verify the data integrity;
/stop_if "No errors found"
List the failure reasons and recommendations to resolve the issue
```

- **Emulated LLM Interaction:**

  **Prompt:**

  ```
  Verify the data integrity
  ```

  **LLM Response:**

  ```
  Errors were detected during data verification.
  ```

**Prompt:**

```
 List the failure reasons and recommendations to resolve the issue
```

**LLM Response:**

```
Insufficient data
```

- The response does **not** contain "No errors found", so the script conitnues

---

## 4. Loop Scripts with `/repeat`

### `/repeat` Command

- **Syntax:**


  ```promptscript
  /repeat [/max <number>] [ /stop_if <condition> | /stop_if_not <condition> ]
    <statements>
  ```
or
  ```promptscript
  /repeat [/max <number>] [ /stop_if <condition> | /stop_if_not <condition> ]
  (
    <statements>
  )
  ```

- **Components:**

  - `/repeat`: Indicates the start of a loop script.
  - `/max <number>` _(optional)_: Sets the maximum number of iterations (default is 5).
  - `/stop_if <condition>` _(optional)_: Stops the loop if the `<condition>` is found in the response.
  - `/stop_if_not <condition>` _(optional)_: Stops the loop if the `<condition>` is **not** found in the response.
  - `<statements>`: Prompts or commands to execute in each iteration, enclosed within parentheses `()`.

- **Description:**

  - The script executes the statements repeatedly until the `/stop_if` condition is met or the maximum number of iterations is reached.
  - If no `/stop_if` or `/stop_if_not` is specified, the loop runs until the maximum number of iterations.

- **Rules:**

  - The statements to repeat must be enclosed within parentheses `()`.
  - If another `/repeat` command is encountered at the same nesting level, the previous `/repeat` ends.
  - To nest `/repeat` blocks, you must use parentheses to define the scope.
  - There is no limit to the number of nested parentheses.

- **Examples:**

#### Example 1: `/repeat` with `/stop_if` Condition

```promptscript
/repeat /max 3 /stop_if success
(
  Attempt to perform the task;
  Check the result
)
```

- **Emulated LLM Interaction:**

==Iteration 1:

**Prompt 1.1:**

```
Attempt to perform the task
```

*LLM Response:

```
The task failed due to network issues.
```

**Prompt 1.2:**

```
Check the result
```

LLM Response:

```
Current status: failure.
```

- "success" not found, proceed to next iteration.

==Iteration 2:

**Prompt 2.1:**

```
Attempt to perform the task
```

LLM Response:

```
The task was completed successfully.
```

**Prompt 2.2:**

```
Check the result
```

LLM Response:

```
Current status: success.
```

- "success" found in the response, script execution ends.

#### Example 2: `/repeat` without `/stop_if` (Runs until max iterations)

```promptscript
/repeat /max 2
(
  Run the simulation;
  Collect the results
)
```

- **Emulated LLM Interaction:**

==Iteration 1:

**Prompt 1.1:**

```
Run the simulation
```

LLM Response:

```
Simulation completed. Results are available.
```

**Prompt 1.2:**

```
Collect the results
```

LLM Response:

```
Results have been collected.
```

==Iteration 2:

**Prompt 2.1:**

```
Run the simulation
```

LLM Response:

```
Simulation completed. Results are available.
```

**Prompt 2.2:**

```
Collect the results
```

LLM Response:

```
Results have been collected.
```

**Example 3: Nested `/repeat` Blocks**

```promptscript
/repeat /max 2
(
  Initialize system;
  /repeat
  (
    Perform test iteration;
    /stop_if initialization complete
  );
  Shutdown system
)
```

- **Emulated LLM Interaction:**

==Outer Iteration 1:

**Prompt:**

```
Initialize system
```

LLM Response:

```
System initialization in progress.
```

**Inner Loop:**

==Inner Iteration 1:

**Prompt:**

```
Perform test iteration
```

LLM Response:

```
Test iteration completed. Initialization not complete.
```

- `/stop_if initialization complete` condition not met.

==Inner Iteration 2:

**Prompt:**

```
Perform test iteration
```

LLM Response:

```
Test iteration completed. Initialization complete.
```

- `/stop_if initialization complete` condition met. Inner loop ends.

**Prompt:**

```
Shutdown system
```

LLM Response:

```
System has been shut down.
```

### Nested  `/repeat` 

The `/repeat` command can be nested in another /repeat command, like any other statement
```promptscript
go through the errors one by one and follow the troubleshooting procedures until all errors have been diagnosed, then say "All errors done."

/repeat /stop_if "All errors done."
(	
	/repeat /stop_if "No conflict."
		VERIFY that the proposed solution doesn't conflict with any
		specifications, and IF there are none, say "No conflict" 
		OTHERWISE explain the conflict and wait for my instructions;
	Next error;
)
```
### Multiple  `/repeat` statements

The `/repeat` command can follow another `/repeat` command, like, like any other statement
```promptscript

Go through the errors one by one and follow the troubleshooting procedures until all errors have been diagnosed but do not propose any solution, then say "All errors done.";

/repeat /stop_if "All errors done."
(	
	Next error;
);

Go through all of the identified root cases and generate fixes that don't conflict with any of the other fixes, one by one, then say "All fixes done";

/repeat /stop_if "All fixes done."
(	
	Next error;
);

list all fixes grouping them by file;

Go through all of the identified files and generate them as artifacts one by one, then say "All files done";

/repeat /stop_if "All files done."
(	
	Next file;
);


```


---

## 5. Alias Commands

### Define an Alias

- **Syntax:**

```promptscript
/alias @<alias_name> <alias_text>
```
or

```promptscript
/@+ @<alias_name> <alias_text>
```

- **Description:**

  - Creates an alias that can be used in prompts to represent longer text.
  - Aliases are expanded before executing each prompt. Aliases can be defined during execution of a script, acting as a local variable
  - An alias can be used within another alias, but expansion is only one level deep; recursive expansion does not occur.
  - **Keywords and alias names are not case-sensitive.**

- **Example:**

```promptscript
/alias @greet Hello, how can I assist you today?
```

- **Emulated Action:**
  - Defines an alias `@greet` with the text "Hello, how can I assist you today?"

### Delete an Alias

- **Syntax:**

```promptscript
/alias_delete @<alias_name>
```
or

```promptscript
/@- @<alias_name> <alias_text>
```


- **Description:**

  - Removes an existing alias.

- **Example:**

```promptscript
/alias_delete @greet
```

- **Emulated Action:**
  - Deletes the alias `@greet`.

### List All Aliases

- **Syntax:**

```promptscript
/alias_list
```
or

```promptscript
/@? @<alias_name> <alias_text>
```


- **Description:**

  - Displays all currently defined aliases.

- **Example:**

```promptscript
/alias_list
```

- **Emulated Output:**
  ```
  @greet: Hello, how can I assist you today?
  @reminder: Don't forget to submit your timesheet.
  ```

### Using Aliases in Prompts

- **Syntax:**

```promptscript
<prompt_text_with_@alias_name>
```

- **Description:**

  - Use `@alias_name` within your prompt to include the alias text.
  - Ensure aliases are defined before using them.
  - Aliases within aliases are expanded only once.

- **Example:**

```promptscript
@greet

How can I help with your project today?
```

- **Emulated LLM Interaction:**

**Prompt:**

```
Hello, how can I assist you today?

How can I help with your project today?
```

**LLM Response:**

```
Thank you for reaching out. I'm looking for assistance with project management tools.
```

- **Alias within Alias Example:**

```promptscript
/alias @signature Best regards, @name
/alias @name Alice

Please send the following message:
Thank you for your time.
@signature
```

- **Emulated LLM Interaction:**

**Prompt:**

```
Please send the following message:
Thank you for your time.
Best regards, @name
```

**LLM Response:**

```
Message sent:

Thank you for your time.
Best regards, @name
```

- Note: `@name` within `@signature` is not expanded further.

---


## 6. Examples

### Simple Prompt Sequence

```promptscript
What is the weather today?;
Should I carry an umbrella?
```

- **Emulated LLM Interaction:**

  **Prompt 1:**

  ```
  What is the weather today?
  ```

  **LLM Response:**

  ```
  Today's weather is sunny with a high of 25°C.

  ```

  **Prompt 2:**

  ```
  Should I carry an umbrella?
  ```

  **LLM Response:**

  ```
  It doesn't look like rain today, so you probably won't need an umbrella.
  ```

### `/repeat` with `/stop_if` Condition

```promptscript
/repeat /max 3 /stop_if "Order confirmed"
(
  Place the order and confirm receipt
)
```

- **Emulated LLM Interaction:**

  **Iteration 1:**

  **Prompt:**

  ```
  Place the order and confirm receipt
  ```

  **LLM Response:**

  ```
  The order could not be processed due to payment issues.
  ```

  - "Order confirmed" not found.

  **Iteration 2:**

  **Prompt:**

  ```
  Place the order and confirm receipt
  ```

  **LLM Response:**

  ```
  Your order has been placed successfully. Order confirmed.
  ```

  - "Order confirmed" found. Loop ends.

### `/repeat` without `/stop_if` (Runs until max iterations)

```promptscript
/repeat /max 5
(
  Run the simulation;
  Collect the results
)
```

- **Emulated LLM Interaction:**

  The prompts "Run the simulation" and "Collect the results" are executed five times, with the LLM providing appropriate responses each time.

### `/repeat` with Nested Blocks

```promptscript
/repeat /max 2
(
  Initialize system;
  /repeat
  (
    Perform test iteration;
    /stop_if initialization complete
  );
  Shutdown system
)
```

- **Emulated LLM Interaction:**

  Similar to previous nested loop examples, with the LLM responses guiding the flow based on the `/stop_if` condition.

### Using an Alias in a Prompt

```promptscript
@daily_update;

Please provide today's report.
```

- **Emulated LLM Interaction:**

  **Assuming `@daily_update` is defined as "Daily Standup Meeting Notes:"**

  **Prompt:**

  ```
  Daily Standup Meeting Notes:

  Please provide today's report.
  ```

  **LLM Response:**

  ```
  Sure, here's today's report:

  - Completed tasks...
  ```

### Defining and Using an Alias

```promptscript
/alias @reminder "Don't forget to submit your timesheet.";

@reminder
```

- **Emulated LLM Interaction:**

  **Prompt:**

  ```
  Don't forget to submit your timesheet.
  ```

  **LLM Response:**

  ```
  Thank you for the reminder. I'll submit it promptly.
  ```

### Alias within Alias (One-Level Expansion)

```promptscript
/alias @greeting "Hello @name"
/alias @name "Alice"

@greeting
```

- **Emulated LLM Interaction:**

  **Prompt:**

  ```
  Hello @name
  ```

  **LLM Response:**

  ```
  Hello @name! How can I assist you today?
  ```

  - Note: `@name` is not expanded further within `@greeting`.

### Script with `/stop_if_not` Condition

```promptscript
Start the process;
/stop_if_not "Process started successfully";
Check for errors;
/stop_if "No errors detected"
```

- **Emulated LLM Interaction:**

  **Prompt 1:**

  ```
  Start the process
  ```

  **LLM Response:**

  ```
  The process started successfully.
  ```

  - Contains "Process started successfully", continue.

  **Prompt 2:**

  ```
  Check for errors
  ```

  **LLM Response:**

  ```
  No errors detected.
  ```

  - Contains "No errors detected", script execution ends.

---

## 7. ClaudePS

ClaudePS is a Chrome Extension that implements the PS language for use with the Claude Projects web application. It is available as free Open Source on GitHub: 
#### ClaudePS Commands and Abbreviations

 In addition to the standard PS language, it provides the following Claude-specific commands

| Command           | Abbreviation | Description                                                                         |
| ----------------- | ------------ | ----------------------------------------------------------------------------------- |
| `/docs`           | `/d`         | List available documents.                                                           |
| `/project`        | `/p`         | List conversations in the current project.                                          |
| `/conversation`   | `/c`         | Export the current conversation.                                                    |
| `/artifacts`      | `/a`         | Export artifacts as markdown files.                                                 |
| `/search_project` | `/sp`        | Search projects for specified text. Requires a search term as an argument.          |
| `/query_project`  | `/qp`        | Execute a prompt against every conversation in the project. Requires a prompt text. |

#### Options

- **Notes:**
  - Options are specified with `/` and can be abbreviated.
  - Options must be compatible with the command (e.g., `/multiple` is valid with `/artifacts`).
  - For `/search_project` and `/query_project`, a search term or prompt must be provided.
  - Commands and options are **not case-sensitive**.

#### Examples

- **Export the current conversation including artifacts:**

```promptscript
/c /a
```

- **Emulated Action:**

  - The current conversation is exported along with its artifacts.

- **Export artifacts as separate files:**

```promptscript
/a /m
```

- **Emulated Action:**

  - Artifacts are exported as separate markdown files.

- **Search projects for the term "report":**

```promptscript
/sp report
```

- **Emulated Action:**

  - The application searches all projects for the term "report" and displays the results.

- **Query all conversations with a prompt:**

```promptscript
/qp Summarize the key points discussed.
```

- **Emulated Action:**
  - The prompt "Summarize the key points discussed." is executed against every conversation in the project, and the summaries are displayed.

---

### ClaudePS Commands Requiring Prompts

### `/search_project`

- **Syntax:**

  ```promptscript
  /sp <search_term>
  ```

- **Description:**

  - Searches projects for the specified `<search_term>`.

- **Example:**

  ```promptscript
  /sp budget report
  ```

  - **Emulated Action:**
    - The application searches all projects for "budget report" and displays matching conversations.

### `/query_project`

- **Syntax:**

  ```promptscript
  /qp <prompt_text>
  ```

- **Description:**

  - Executes `<prompt_text>` against every conversation in the project.
  - Useful for generating summaries or extracting information across multiple conversations.

- **Example:**

  ```promptscript
  /qp Summarize the key points discussed.
  ```

  - **Emulated Action:**
    - The prompt is run against each conversation, and the LLM provides summaries for each.

---

