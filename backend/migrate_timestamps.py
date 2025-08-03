#!/usr/bin/env python3
"""
Migration script to update historical timestamps to be timezone-aware.
This script will:
1. Add timezone info to all existing datetime fields
2. Convert naive timestamps to UTC
3. Update the database schema if needed
"""

import sys
import os
from datetime import datetime
import pytz
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base, engine, SessionLocal
from timezone_utils import now_utc

def migrate_timestamps():
    """Migrate all historical timestamps to be timezone-aware"""
    print("Starting timestamp migration...")
    
    db = SessionLocal()
    
    try:
        # Get all tables with datetime columns
        tables_to_migrate = [
            ('users', 'created_at'),
            ('entries', 'date'),
            ('entries', 'created_at'),
            ('audio_files', 'created_at'),
            ('images', 'created_at'),
            ('narratives', 'start_date'),
            ('narratives', 'end_date'),
            ('narratives', 'created_at'),
            ('mood_entries', 'date'),
            ('mood_entries', 'created_at'),
            ('highlights', 'created_at'),
        ]
        
        total_updated = 0
        
        for table_name, column_name in tables_to_migrate:
            print(f"Migrating {table_name}.{column_name}...")
            
            # Get all records with naive timestamps
            query = text(f"""
                SELECT id, {column_name} 
                FROM {table_name} 
                WHERE {column_name} IS NOT NULL
            """)
            
            result = db.execute(query)
            records = result.fetchall()
            
            updated_count = 0
            for record in records:
                record_id = record[0]
                timestamp = record[1]
                
                if timestamp and timestamp.tzinfo is None:
                    # Convert naive timestamp to UTC
                    # Assume existing timestamps are in UTC
                    utc_timestamp = timestamp.replace(tzinfo=pytz.UTC)
                    
                    # Update the record
                    update_query = text(f"""
                        UPDATE {table_name} 
                        SET {column_name} = :timestamp 
                        WHERE id = :record_id
                    """)
                    
                    db.execute(update_query, {
                        'timestamp': utc_timestamp,
                        'record_id': record_id
                    })
                    
                    updated_count += 1
            
            print(f"  Updated {updated_count} records in {table_name}.{column_name}")
            total_updated += updated_count
        
        # Commit all changes
        db.commit()
        print(f"\nMigration completed! Total records updated: {total_updated}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_migration():
    """Verify that all timestamps are now timezone-aware"""
    print("\nVerifying migration...")
    
    db = SessionLocal()
    
    try:
        tables_to_verify = [
            ('users', 'created_at'),
            ('entries', 'date'),
            ('entries', 'created_at'),
            ('audio_files', 'created_at'),
            ('images', 'created_at'),
            ('narratives', 'start_date'),
            ('narratives', 'end_date'),
            ('narratives', 'created_at'),
            ('mood_entries', 'date'),
            ('mood_entries', 'created_at'),
            ('highlights', 'created_at'),
        ]
        
        all_good = True
        
        for table_name, column_name in tables_to_verify:
            query = text(f"""
                SELECT COUNT(*) as count
                FROM {table_name} 
                WHERE {column_name} IS NOT NULL 
                AND {column_name} IS NOT NULL
            """)
            
            result = db.execute(query)
            total_records = result.fetchone()[0]
            
            if total_records > 0:
                # Check for naive timestamps
                naive_query = text(f"""
                    SELECT COUNT(*) as count
                    FROM {table_name} 
                    WHERE {column_name} IS NOT NULL 
                    AND {column_name} IS NOT NULL
                    AND {column_name} LIKE '%+00:00'
                """)
                
                result = db.execute(naive_query)
                naive_count = result.fetchone()[0]
                
                if naive_count == 0:
                    print(f"  ✓ {table_name}.{column_name}: All {total_records} records are timezone-aware")
                else:
                    print(f"  ✗ {table_name}.{column_name}: {naive_count} records still have naive timestamps")
                    all_good = False
            else:
                print(f"  - {table_name}.{column_name}: No records to verify")
        
        if all_good:
            print("\n✓ All timestamps are now timezone-aware!")
        else:
            print("\n✗ Some timestamps still need migration")
            
    except Exception as e:
        print(f"Error during verification: {e}")
        raise
    finally:
        db.close()

def backup_database():
    """Create a backup of the database before migration"""
    import shutil
    from pathlib import Path
    
    db_path = Path("life_narrator.db")
    if db_path.exists():
        backup_path = Path("life_narrator_backup.db")
        shutil.copy2(db_path, backup_path)
        print(f"Database backed up to: {backup_path}")
    else:
        print("No database file found to backup")

if __name__ == "__main__":
    print("Timestamp Migration Script")
    print("=" * 50)
    
    # Check if user wants to proceed
    response = input("This will update all historical timestamps. Create backup? (y/n): ")
    if response.lower() == 'y':
        backup_database()
    
    response = input("Proceed with migration? (y/n): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        sys.exit(0)
    
    try:
        migrate_timestamps()
        verify_migration()
        print("\nMigration completed successfully!")
    except Exception as e:
        print(f"\nMigration failed: {e}")
        sys.exit(1) 