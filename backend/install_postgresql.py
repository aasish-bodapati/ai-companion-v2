#!/usr/bin/env python3
"""
PostgreSQL Installation Helper
Provides instructions for installing PostgreSQL on Windows
"""

import subprocess
import sys
import os

def check_postgresql_installed():
    """Check if PostgreSQL is already installed"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ PostgreSQL already installed: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    return False

def install_postgresql_windows():
    """Provide instructions for installing PostgreSQL on Windows"""
    
    print("🐘 PostgreSQL Installation Guide for Windows")
    print("=" * 50)
    
    print("\n📥 Method 1: Download from Official Website")
    print("1. Go to: https://www.postgresql.org/download/windows/")
    print("2. Download PostgreSQL 15 or 16")
    print("3. Run the installer")
    print("4. Remember the password you set for 'postgres' user")
    print("5. Default port: 5432")
    
    print("\n📦 Method 2: Using Chocolatey (if you have it)")
    print("1. Open PowerShell as Administrator")
    print("2. Run: choco install postgresql")
    
    print("\n📦 Method 3: Using Winget")
    print("1. Open PowerShell")
    print("2. Run: winget install PostgreSQL.PostgreSQL")
    
    print("\n🔧 After Installation:")
    print("1. Start PostgreSQL service")
    print("2. Test connection with pgAdmin")
    print("3. Run our migration script")
    
    print("\n💡 Default Connection Details:")
    print("- Host: localhost")
    print("- Port: 5432")
    print("- Username: postgres")
    print("- Password: [what you set during installation]")
    print("- Database: ai_companion_powerbi (will be created)")

def install_python_dependencies():
    """Install Python dependencies for PostgreSQL"""
    
    print("\n🐍 Installing Python dependencies...")
    
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements_postgresql.txt'], check=True)
        print("✅ Python dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def main():
    """Main installation process"""
    
    print("🚀 PostgreSQL Setup for Power BI")
    print("=" * 40)
    
    # Check if PostgreSQL is installed
    if check_postgresql_installed():
        print("✅ PostgreSQL is already installed!")
    else:
        print("❌ PostgreSQL not found")
        install_postgresql_windows()
        print("\n⚠️ Please install PostgreSQL first, then run this script again")
        return
    
    # Install Python dependencies
    if install_python_dependencies():
        print("\n🎉 Setup complete!")
        print("📊 You can now run: python setup_postgresql.py")
    else:
        print("\n❌ Setup failed. Please install dependencies manually:")
        print("pip install -r requirements_postgresql.txt")

if __name__ == "__main__":
    main()
