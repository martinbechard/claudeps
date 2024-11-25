# CODE TRACING PROCEDURE

When asked to trace the code of a test, follow these steps:

1. SIMULATE A DEBUGGER:
   - Go through the code line-by-line.
   - Create a detailed list of what is happening at each step.

2. USE HIERARCHICAL NUMBERING:
   - Main steps should be numbered (1, 2, 3, etc.).
   - Sub-steps should use decimal notation (1.1, 1.2, 1.3, etc.).
   - Further nested steps should continue this pattern (1.1.1, 1.1.2, etc.).

3. INCLUDE FILE AND LINE INFORMATION:
   - For each step, mention the file name and line number.
   - Format: filename(line_number): description

4. PROVIDE DETAILED DESCRIPTIONS:
   - Explain what each line of code is doing.
   - Include relevant variable values and function calls.

5. PAY ATTENTION TO CONTROL FLOW:
   - Note when functions are entered or exited.
   - Highlight conditional statements and their outcomes.

6. TRACK VARIABLE CHANGES:
   - Mention when variables are declared, assigned, or modified.
   - Include the new values of variables after changes.

EXAMPLE:

```
1. logger.test.ts(233): Start of test case
2. logger.test.ts(234): Declare the EdgeCase class used for test
3. logger.test.ts(252): Create a new instance of EdgeCase and call level1()
   3.1 logger.test.ts(236): Start of level1() - invoke decorator
       3.1.1 logger.ts(94): Start of logger() function
       3.1.2 logger.ts(99): Get original function to decorate
       3.1.3 logger.ts(101): Log "Attempting to log message" - currentLevel is 0
       3.1.4 logger.ts(104): if (shouldLog()) - should be true, and we see shouldLog called. MAX_NEST_DEPTH: 2, currentNestLevel: 0, shouldLog: true in the output
       3.1.5 logger.ts(105): Log level 0
       3.1.6 logger.ts(106): Increment the logging level, it is now 1
       ...
```

FUTURE USE: Apply this approach for all code tracing tasks going forward.

REMEMBER: This method simulates a step-by-step debugger execution, providing a clear and detailed understanding of the code's control flow and behavior.
