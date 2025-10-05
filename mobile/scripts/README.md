# Migration Scripts

This directory contains scripts to help automate the migration process from old components to new unified components.

## 📁 Files

### `migrationScripts.ts` (React Native Compatible)
- **Purpose**: Used within the React Native app for demonstration and UI
- **Location**: `src/scripts/migrationScripts.ts`
- **Usage**: Imported by the Migration Dashboard
- **Limitations**: Cannot perform actual file operations (Node.js modules not available)

### `node-migration-scripts.js` (Node.js)
- **Purpose**: Actual file operations for migration
- **Location**: `scripts/node-migration-scripts.js`
- **Usage**: Run from command line or Node.js environment
- **Capabilities**: Full file system access for real migrations

## 🚀 Usage

### React Native App (Migration Dashboard)
1. Open the mobile app
2. Navigate to the "Migration" tab
3. Use the interactive buttons to run migration scripts
4. View results and status updates

### Node.js Environment (Actual Migration)
```bash
# Navigate to mobile directory
cd mobile

# Run all migration scripts
node scripts/node-migration-scripts.js

# Or run specific scripts programmatically
node -e "
const scripts = require('./scripts/node-migration-scripts.js');
scripts.replaceHardcodedStyles('src/components/MyComponent.tsx');
"
```

## 📋 Available Scripts

### 1. `replaceHardcodedStyles(filePath)`
- **Purpose**: Replace hardcoded style values with constants
- **Example**: `backgroundColor: '#f8fafc'` → `backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC`
- **Auto-adds**: Import statement for `DUPLICATE_STYLES`

### 2. `replaceConsoleLogs(filePath)`
- **Purpose**: Replace console.log statements with DebugUtils
- **Example**: `console.log('message')` → `DebugUtils.log('message')`
- **Auto-adds**: Import statement for `DebugUtils`

### 3. `replaceLoadingPatterns(filePath)`
- **Purpose**: Add TODO comments for loading state migration
- **Example**: Adds comment above `useState(false)` patterns

### 4. `addDeprecationWarnings(filePath, componentName, replacement)`
- **Purpose**: Add deprecation warnings to old components
- **Example**: Adds `deprecateComponent('OldComponent', 'NewComponent')` calls

### 5. `findFilesNeedingMigration(directory)`
- **Purpose**: Scan directory for files that need migration
- **Returns**: Object with arrays of file paths by migration type

### 6. `runAllMigrations(directory)`
- **Purpose**: Run all migration scripts on a directory
- **Usage**: `node scripts/node-migration-scripts.js`

## 🔧 Configuration

### Style Replacements
The scripts look for these common hardcoded values:
- `backgroundColor: '#f8fafc'` → `DUPLICATE_STYLES.BACKGROUND_F8FAFC`
- `borderRadius: 16` → `DUPLICATE_STYLES.BORDER_RADIUS_16`
- `paddingHorizontal: 20` → `DUPLICATE_STYLES.PADDING_HORIZONTAL_20`
- `fontSize: 18` → `DUPLICATE_STYLES.FONT_SIZE_18`
- `color: '#3b82f6'` → `DUPLICATE_STYLES.COLORS.PRIMARY`
- `color: '#1f2937'` → `DUPLICATE_STYLES.COLORS.TEXT_PRIMARY`
- `color: '#6b7280'` → `DUPLICATE_STYLES.COLORS.TEXT_SECONDARY`

### Console.log Replacements
- `console.log()` → `DebugUtils.log()`
- `console.warn()` → `DebugUtils.warn()`
- `console.error()` → `DebugUtils.error()`
- `console.info()` → `DebugUtils.info()`

## ⚠️ Safety Features

### Backup
- Always backup your code before running migrations
- Use version control (git) to track changes
- Test changes in a development environment first

### Validation
- Scripts validate file existence before processing
- Error handling for file system operations
- Detailed logging of all operations

### Rollback
- All changes are logged with before/after content
- Git can be used to revert changes if needed
- Feature flags allow gradual rollout

## 📊 Example Output

```
🔍 Scanning for files needing migration in src...
📊 Found 5 files with hardcoded styles
📊 Found 12 files with console.log statements
📊 Found 3 files with loading patterns

📝 Processing hardcoded styles...
✅ Updated src/components/MyComponent.tsx with 3 style replacements
✅ Updated src/screens/MyScreen.tsx with 2 style replacements

📝 Processing console.log statements...
✅ Updated src/services/MyService.ts with 4 console.log replacements
✅ Updated src/utils/MyUtils.ts with 2 console.log replacements

✅ Migration complete!
```

## 🛠️ Development

### Adding New Replacements
1. Edit the `replacements` array in `node-migration-scripts.js`
2. Add the pattern to match and the replacement
3. Test with a sample file
4. Update the React Native version for UI consistency

### Customizing Scripts
- Modify the regex patterns for different file types
- Add new migration types by extending the `filesToMigrate` object
- Customize import statements for different project structures

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify file paths are correct
3. Ensure you have proper permissions
4. Test with a single file first
5. Check the git status for changes

## 🔄 Integration with Migration Dashboard

The React Native version provides a UI for:
- Viewing migration status
- Running scripts with visual feedback
- Toggling feature flags
- Monitoring progress
- Managing the migration process

The Node.js version provides:
- Actual file operations
- Batch processing
- Command-line interface
- Integration with CI/CD pipelines
