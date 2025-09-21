#!/usr/bin/env python3
"""
Database Audit Script - Analyze table usage and identify redundant tables
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text
from collections import defaultdict
import os

def get_all_tables():
    """Get all tables in the database"""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result.fetchall()]
        return tables
    finally:
        db.close()

def get_table_row_counts():
    """Get row counts for all tables"""
    db = SessionLocal()
    try:
        tables = get_all_tables()
        counts = {}
        for table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table};"))
                count = result.scalar()
                counts[table] = count
            except Exception as e:
                counts[table] = f"Error: {str(e)}"
        return counts
    finally:
        db.close()

def analyze_table_usage():
    """Analyze which tables are referenced in the codebase"""
    # Search for table references in Python files
    table_usage = defaultdict(list)
    
    # Get all tables first
    tables = get_all_tables()
    
    # Search in backend code
    backend_dirs = ['app/models', 'app/crud', 'app/api', 'app/schemas']
    
    for root, dirs, files in os.walk('.'):
        # Skip hidden directories and __pycache__
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Check for table references
                    for table in tables:
                        if table in content:
                            table_usage[table].append(file_path)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return table_usage

def main():
    print("🔍 DATABASE AUDIT - TABLE USAGE ANALYSIS")
    print("=" * 60)
    
    # Get all tables
    tables = get_all_tables()
    print(f"\n📊 Total tables in database: {len(tables)}")
    print("\n📋 All Tables:")
    for table in tables:
        print(f"  ✅ {table}")
    
    # Get row counts
    print(f"\n📈 Table Row Counts:")
    counts = get_table_row_counts()
    for table, count in counts.items():
        print(f"  📊 {table}: {count} rows")
    
    # Analyze usage
    print(f"\n🔍 Table Usage Analysis:")
    usage = analyze_table_usage()
    
    # Categorize tables
    unused_tables = []
    lightly_used_tables = []
    heavily_used_tables = []
    
    for table in tables:
        if table not in usage or len(usage[table]) == 0:
            unused_tables.append(table)
        elif len(usage[table]) <= 2:
            lightly_used_tables.append(table)
        else:
            heavily_used_tables.append(table)
    
    print(f"\n🚨 UNUSED TABLES ({len(unused_tables)}):")
    for table in unused_tables:
        print(f"  ❌ {table} - No references found")
    
    print(f"\n⚠️  LIGHTLY USED TABLES ({len(lightly_used_tables)}):")
    for table in lightly_used_tables:
        print(f"  ⚠️  {table} - {len(usage[table])} references: {', '.join(usage[table])}")
    
    print(f"\n✅ HEAVILY USED TABLES ({len(heavily_used_tables)}):")
    for table in heavily_used_tables:
        print(f"  ✅ {table} - {len(usage[table])} references")
    
    # Summary
    print(f"\n📊 SUMMARY:")
    print(f"  Total tables: {len(tables)}")
    print(f"  Unused: {len(unused_tables)}")
    print(f"  Lightly used: {len(lightly_used_tables)}")
    print(f"  Heavily used: {len(heavily_used_tables)}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if unused_tables:
        print(f"  🗑️  Consider removing unused tables: {', '.join(unused_tables)}")
    if lightly_used_tables:
        print(f"  🔍 Review lightly used tables: {', '.join(lightly_used_tables)}")
    
    return {
        'total_tables': len(tables),
        'unused_tables': unused_tables,
        'lightly_used_tables': lightly_used_tables,
        'heavily_used_tables': heavily_used_tables,
        'row_counts': counts
    }

if __name__ == "__main__":
    main()
