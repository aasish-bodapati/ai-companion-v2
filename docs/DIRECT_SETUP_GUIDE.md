# 🚀 Direct Setup Guide (No Docker)

## **Overview**
This guide will help you run the AI Companion app directly on your system without Docker. This approach eliminates network configuration issues and makes it easier to access from other devices on your network.

## **Prerequisites**

### **Required Software**
- ✅ **Python 3.12+** (You have: Python 3.12.9)
- ✅ **Node.js 18+** (You have: Node.js v22.18.0)
- ✅ **Git** (for cloning the repository)

### **System Requirements**
- Windows 10/11 (You're on Windows 10.0.19045)
- At least 4GB RAM
- Stable internet connection

## **Quick Start**

### **Option 1: Use the Batch Files (Recommended)**
1. **Double-click `start-both.bat`** - This will start both servers automatically
2. **Wait for both servers to start** (about 10-15 seconds)
3. **Access the app:**
   - From your computer: `http://localhost:3000`
   - From your phone: `http://YOUR_COMPUTER_IP:3000`

### **Option 2: Manual Startup**
1. **Start Backend:** Double-click `start-backend.bat`
2. **Start Frontend:** Double-click `start-frontend.bat`
3. **Access the app** using the URLs above

## **Finding Your Computer's IP Address**

### **Windows Command Prompt:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (usually starts with 192.168.x.x)

### **Example Output:**
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.105
```

## **Access URLs**

### **From Your Computer:**
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

### **From Your Phone (Same WiFi):**
- **Frontend:** `http://192.168.1.105:3000` (replace with your actual IP)
- **Backend API:** `http://192.168.1.105:8000`

## **Troubleshooting**

### **Port Already in Use**
If you get "port already in use" errors:
1. **Close any existing terminals/command prompts**
2. **Check if other apps are using ports 3000 or 8000**
3. **Restart your computer if needed**

### **Firewall Issues**
Windows Firewall may block incoming connections:
1. **Open Windows Defender Firewall**
2. **Allow apps through firewall**
3. **Allow Python and Node.js**

### **Network Access Issues**
1. **Ensure both servers are running** (check both command windows)
2. **Verify your IP address** is correct
3. **Check that your phone is on the same WiFi network**

## **Development Workflow**

### **Making Changes**
1. **Backend changes** - Save Python files, server auto-reloads
2. **Frontend changes** - Save React files, browser auto-refreshes
3. **Database changes** - May require server restart

### **Stopping Servers**
1. **Close the command windows** for each server
2. **Or press Ctrl+C** in each terminal

## **File Structure**
```
ai-companion-v2/
├── start-both.bat          # Start both servers
├── start-backend.bat       # Start backend only
├── start-frontend.bat      # Start frontend only
├── backend/                # Python FastAPI backend
├── frontend/               # Next.js frontend
└── docs/                   # Documentation
```

## **Benefits of Direct Setup**

### **Advantages:**
- ✅ **No Docker complexity** - Direct Python/Node.js execution
- ✅ **Easier debugging** - Direct access to logs and errors
- ✅ **Faster startup** - No container initialization
- ✅ **Network access** - Automatically accessible from other devices
- ✅ **Development friendly** - Hot reload and debugging tools

### **Considerations:**
- ⚠️ **System dependencies** - Requires Python/Node.js on your machine
- ⚠️ **Port conflicts** - May conflict with other development tools
- ⚠️ **Environment differences** - May behave differently than production

## **Next Steps**

1. **Test the setup** - Run `start-both.bat` and access from your computer
2. **Test phone access** - Use your computer's IP address from your phone
3. **Start developing** - Make changes and see them live
4. **Customize** - Modify the batch files if needed

## **Support**

If you encounter issues:
1. **Check the console output** in both command windows
2. **Verify prerequisites** are installed correctly
3. **Check network configuration** and firewall settings
4. **Restart both servers** if needed

---

**Happy Coding! 🎉**
