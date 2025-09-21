# Hot Reload Troubleshooting Guide

## 🚀 Quick Fixes

### 1. **Restart Development Server**
```powershell
# Use the restart script
.\dev-restart.ps1

# Or manually
npm run dev:clean
```

### 2. **Clear All Caches**
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 3. **Check for Port Conflicts**
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill specific process
taskkill /PID <process_id> /F
```

## 🔧 Configuration Issues Fixed

### **Next.js Config (`next.config.js`)**
- ✅ **React Strict Mode**: Enabled for better development experience
- ✅ **SWC Minification**: Enabled for better performance
- ✅ **Webpack Watch Options**: Optimized polling (2000ms) and timeout (500ms)
- ✅ **Code Splitting**: Better chunk optimization for hot reload

### **Package.json Scripts**
- ✅ **Default Dev**: `npm run dev` (stable, no turbo)
- ✅ **Turbo Mode**: `npm run dev:turbo` (experimental)
- ✅ **Clean Start**: `npm run dev:clean` (clears cache)

## 🐛 Common Issues & Solutions

### **Issue: Hot reload not working**
**Solution**: 
1. Check if file changes are being detected
2. Try `npm run dev:clean`
3. Check browser console for errors

### **Issue: Server crashes on file save**
**Solution**:
1. Check for syntax errors
2. Use `npm run dev:webpack` (more stable)
3. Check TypeScript errors with `npm run typecheck`

### **Issue: Slow hot reload**
**Solution**:
1. Use `npm run dev:turbo` for faster builds
2. Check if too many files are being watched
3. Exclude large directories in `.gitignore`

### **Issue: Port already in use**
**Solution**:
1. Use `.\dev-restart.ps1`
2. Or manually kill process: `taskkill /PID <id> /F`
3. Use different port: `npm run dev:stable`

## 📊 Performance Tips

1. **Use Turbo Mode**: `npm run dev:turbo` for faster builds
2. **Clean Regularly**: Run `npm run dev:clean` when issues persist
3. **Check Dependencies**: Keep packages updated
4. **Monitor Memory**: Close unused browser tabs

## 🔍 Debug Commands

```powershell
# Check server status
netstat -ano | findstr :3000

# Check for errors
npm run typecheck

# Lint code
npm run lint

# Build test
npm run build
```

## 📝 Notes

- **Turbo Mode**: Experimental, may cause issues
- **Webpack Mode**: More stable, slower
- **React Strict Mode**: Helps catch issues early
- **File Watching**: Optimized for Windows file system

