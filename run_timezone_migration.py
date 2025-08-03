#!/usr/bin/env python3
"""
Script to run the timezone migration for the Life Narrator application.
This will update all historical timestamps to be timezone-aware.
"""

import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def main():
    print("Life Narrator - Timezone Migration")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('backend'):
        print("Error: Please run this script from the project root directory")
        sys.exit(1)
    
    # Change to backend directory
    os.chdir('backend')
    
    try:
        # Import and run the migration
        from migrate_timestamps import migrate_timestamps, verify_migration, backup_database
        
        # Create backup
        print("Creating database backup...")
        backup_database()
        
        # Run migration
        print("\nRunning timestamp migration...")
        migrate_timestamps()
        
        # Verify migration
        print("\nVerifying migration...")
        verify_migration()
        
        print("\n✅ Timezone migration completed successfully!")
        print("\nNext steps:")
        print("1. Restart your backend server")
        print("2. Set the USER_TIMEZONE environment variable to your timezone (e.g., 'America/New_York')")
        print("3. Test the application to ensure dates are displayed correctly")
        
    except ImportError as e:
        print(f"Error: Could not import migration module: {e}")
        print("Make sure you have installed all requirements: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 