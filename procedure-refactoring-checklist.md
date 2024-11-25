# Refactoring Checklist for Coding Assistants 


When asked to perform a refactoring task, follow these steps:

1. **Understand the Request**
   - [ ] Clarify the scope and goals of the refactoring
   - [ ] Identify which parts of the codebase are affected

2. **Analyze the Current Code**
   - [ ] Review the existing code structure and patterns
   - [ ] Identify inconsistencies or areas for improvement
   - [ ] Note any potential impacts on other parts of the system

3. **Plan the Refactoring**
   - [ ] Outline the proposed changes
   - [ ] Consider how to maintain backwards compatibility
   - [ ] Identify potential risks or challenges
   - [ ] Evaluate trade-offs between consistency and compatibility
   - [ ] Determine an approach that balances improved structure with minimal disruption to existing code

4. **Design the Solution**
   - [ ] Sketch out the new code structure
   - [ ] Ensure consistency with existing naming conventions and patterns
   - [ ] Plan for future extensibility
   - [ ] Consider a gradual migration strategy if breaking changes are necessary
   - [ ] Plan a deprecation strategy for old patterns, if applicable

5. **Implement the Changes**
   - [ ] Make the planned modifications
   - [ ] Ensure code adheres to project style guidelines
   - [ ] Add or update comments and documentation as needed

6. **Verify Backwards Compatibility**
   - [ ] Check that existing functionality is preserved
   - [ ] If breaking changes are necessary, implement the planned migration strategy

7. **Review and Optimize**
   - [ ] Look for any unnecessary complexity in the new code
   - [ ] Ensure the solution is as simple as possible while meeting all requirements
   - [ ] Perform at least two separate review passes of the implementation
   - [ ] On each pass, look for overlooked inconsistencies or potential issues

8. **Consider Edge Cases**
   - [ ] Think through potential edge cases or unusual scenarios
   - [ ] Ensure the refactored code handles these appropriately

9. **Update Tests**
   - [ ] Modify existing tests to match the new code structure
   - [ ] Add new tests to cover any new functionality or edge cases

10. **Document Changes**
    - [ ] Explain the rationale behind key decisions
    - [ ] Update any relevant documentation or README files
    - [ ] If implementing dual structures (old and new patterns), clearly document both

11. **Final Review**
    - [ ] Double-check for any lingering inconsistencies or errors
    - [ ] Ensure all project coding standards are met
    - [ ] Evaluate the refactoring in the context of the entire codebase
    - [ ] Verify that the refactored component interacts correctly with other parts of the system
    - [ ] Confirm the refactoring aligns with patterns and structures used elsewhere in the project

12. **Prepare Explanation**
    - [ ] Summarize the changes made and their benefits
    - [ ] Be ready to explain your approach to the human requester

13. **Suggest Next Steps**
    - [ ] Identify any related areas that might benefit from similar refactoring
    - [ ] Propose any additional improvements that were out of scope for this task
    - [ ] If a gradual migration strategy was implemented, suggest a timeline for completing the migration

By following this checklist, you'll ensure a thorough and well-considered approach to refactoring tasks, addressing key concerns and maintaining code quality while also considering the broader impact and future maintainability of the codebase.