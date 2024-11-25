# ROOT CAUSE ANALYSIS PROCEDURE

When asked to perform a Root Cause Analysis, follow these steps:

1. CREATE A TABLE with the following columns:
   - Fact
   - Source
   - New Problem
   - Hypothesis
   - Root Cause
   - Confirmations Needed
   - Solution Approach
   - Solution Robustness
   - Code to Change

2. POPULATE THE TABLE:
   - Use distinct rows for each Fact.
   - Ensure each column is filled with appropriate information as described below.

3. COLUMN DETAILS:

   a. FACT:
      - Itemize all possible facts from the test result, one per line.
      - For expectation differences, explain test expectations vs. actual results.
      - For HTML targets, describe searchable characteristic attributes.
      - Include information from console output and error messages.

   b. SOURCE:
      - Speculate on the code responsible for each fact.

   c. NEW PROBLEM:
      - Indicate if this is a new issue or a continuation of a previously "fixed" problem.

   d. HYPOTHESIS:
      - Speculate on the cause based on code functionality.
      - For recurring issues, analyze why the previous fix didn't work.
      - Use the Five Whys approach for thorough understanding.

   e. ROOT CAUSE:
      - Determine if this is a definite root cause or if more information is needed.

   f. CONFIRMATIONS NEEDED:
      - If not a root cause, explain what information is needed and how to obtain it.
      - Suggest adding tracing or new granular test cases.
      - Verify if unknowns can be answered by examining the existing code.

   g. SOLUTION APPROACH:
      - Explain the principle to apply for fixing the problem.
      - Use the Five Whys to ensure a deep explanation.
      - For recurring issues, consider previous efforts to avoid repeating unsuccessful fixes.

   h. SOLUTION ROBUSTNESS:
      - Explain what makes the proposed solution robust to changes within the component under test.

   i. CODE TO CHANGE:
      - Indicate necessary code changes and their rationale.
      - Ensure proposed solutions are resilient to future component modifications.
      - Follow best practices, not just aiming to pass the test.

4. OUTPUT AND REVIEW:
   - Present only the completed table and snippets of changed code.
   - DO NOT generate complete updated files at this stage.
   - Wait for human approval before proceeding.

5. IMPLEMENTATION:
   - If the human agrees to the code changes:
     - Apply the approved changes.
     - Generate FULL files, including ALL tests and ALL code, not just modifications.

6. FUTURE USE:
   - Employ this approach for all future troubleshooting tasks.

REMEMBER: Generating complete files prevents tedious and error-prone manual merging of multiple versions.