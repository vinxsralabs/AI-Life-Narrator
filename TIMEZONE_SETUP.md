# Timezone Implementation for Life Narrator

This document explains the timezone implementation that ensures all stories and events are captured based on the user's local timezone.

## Overview

The application now supports timezone-aware timestamps throughout the system. All datetime operations are performed in UTC for storage and converted to the user's local timezone for display.

## Features

- **UTC Storage**: All timestamps are stored in UTC in the database
- **Local Display**: All dates and times are displayed in the user's local timezone
- **Automatic Conversion**: Seamless conversion between UTC and local timezone
- **Historical Migration**: One-time migration script to update existing data

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Timezone

Set your local timezone in the environment variables:

```bash
# In your .env file
USER_TIMEZONE=America/New_York  # Replace with your timezone
```

Common timezone examples:
- `America/New_York` - Eastern Time
- `America/Los_Angeles` - Pacific Time
- `Europe/London` - British Time
- `Asia/Tokyo` - Japan Time
- `Australia/Sydney` - Australian Eastern Time

### 3. Run Migration Script

Execute the migration script to update historical timestamps:

```bash
# From the project root
python run_timezone_migration.py
```

This script will:
- Create a backup of your database
- Update all existing timestamps to be timezone-aware
- Verify the migration was successful

### 4. Restart the Application

After running the migration, restart your backend server:

```bash
cd backend
uvicorn main:app --reload
```

## Implementation Details

### Backend Changes

1. **Timezone Utilities** (`backend/timezone_utils.py`)
   - Functions for timezone conversion
   - User timezone detection
   - UTC/local time conversion

2. **Database Models** (`backend/database.py`)
   - Updated to use timezone-aware default functions
   - All `created_at` and `date` fields now use UTC

3. **API Routes** (`backend/routes.py`)
   - Updated to use timezone-aware datetime functions
   - All new timestamps are created in UTC

### Frontend Changes

1. **Timezone Utilities** (`frontend/src/utils/timezone.ts`)
   - Local timezone detection
   - Date formatting functions
   - UTC to local conversion

2. **Component Updates**
   - Dashboard, MyReflections, and other components updated
   - All date displays now use local timezone

## Migration Process

The migration script performs the following steps:

1. **Backup Creation**: Creates a backup of your database
2. **Timestamp Analysis**: Identifies all datetime fields
3. **Timezone Conversion**: Converts naive timestamps to UTC
4. **Verification**: Confirms all timestamps are timezone-aware

## Testing

After setup, verify the timezone implementation:

1. **Create a new entry** and check the timestamp
2. **View existing entries** to ensure they display in your local time
3. **Check different timezones** by changing the `USER_TIMEZONE` environment variable

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure `pytz` is installed
   ```bash
   pip install pytz
   ```

2. **Migration Failures**: Check database permissions and ensure the database file is not locked

3. **Incorrect Times**: Verify your `USER_TIMEZONE` setting is correct

### Timezone List

For a complete list of valid timezone names, visit:
https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## API Changes

The API now returns timezone-aware timestamps in ISO format with UTC timezone information. The frontend automatically converts these to the user's local timezone for display.

## Security Considerations

- All timestamps are stored in UTC to prevent timezone-related security issues
- User timezone preferences are handled client-side for display purposes
- No sensitive timezone information is exposed in API responses

## Future Enhancements

- User-specific timezone preferences stored in user profile
- Automatic timezone detection based on user location
- Support for daylight saving time transitions 