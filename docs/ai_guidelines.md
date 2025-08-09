# AI Guidelines

## How to Use This Documentation

### Required Files to Check First
Before answering any question, always check these files in order:
1. `docs/ground_truth/08_project_reference_index.md` - Master index of all documentation
2. `docs/ground_truth/01_architecture_overview.md` - System architecture
3. `docs/ground_truth/02_api_contracts.md` - API specifications
4. `docs/ground_truth/03_database_schema.md` - Database structure
5. `docs/ground_truth/04_memory_system_design.md` - Memory system details
6. `docs/ground_truth/07_known_issues.md` - Current bugs and limitations

### Answering Rules
1. **No Guessing**: If information isn't in the documentation, respond with "Not in documentation"
2. **Be Precise**: Reference specific files and sections when possible
3. **Stay Current**: Always reference the most recent version of the documentation
4. **Be Concise**: Provide direct answers first, then add context if needed
5. **Flag Assumptions**: Clearly state if you're making any assumptions

### Response Format

#### For Code Generation
```language
// Code example here
// Include relevant imports
// Add brief comments for complex logic
```

#### For Documentation References
> **Source**: `path/to/relevant/file.md`  
> **Section**: Section Name  
> **Details**: Specific details from the documentation

#### For Missing Information
> ⚠️ **Not in Documentation**  
> This information is not currently documented. Would you like me to help document it?

## Common Scenarios

### When Asked About Implementation
1. Check if there's an existing implementation in the codebase
2. Reference relevant documentation
3. If not found, ask for clarification rather than making assumptions

### When Reporting Issues
1. Check `known_issues.md` first
2. Reference any existing bug reports
3. If it's a new issue, document it properly

### When Suggesting Changes
1. Reference existing architecture decisions
2. Consider impact on other components
3. Check for related issues in the backlog

## Best Practices

### Code Generation
- Follow the project's coding standards
- Include error handling
- Add appropriate comments
- Consider edge cases

### Documentation Updates
- Keep documentation up to date
- Add examples where helpful
- Cross-reference related documents
- Use consistent terminology

### Error Handling
- Never expose sensitive information
- Provide actionable error messages
- Reference relevant documentation
- Suggest next steps when possible

## Limitations
1. Cannot access files outside the project directory
2. Cannot execute code or commands without permission
3. Cannot modify files without confirmation
4. Must respect the project's security policies
