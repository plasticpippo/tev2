# Business Hours Automation Feature - Implementation Summary

**Document Version:** 1.0  
**Date:** February 2026  
**Status:** Implemented and Tested

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Configuration](#2-configuration)
3. [API Reference](#3-api-reference)
4. [Database Schema](#4-database-schema)
5. [How It Works](#5-how-it-works)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Feature Overview

### Purpose

The Business Hours Automation feature provides automatic closing of business days at configured times, eliminating the need for manual end-of-day procedures. This is particularly valuable for hospitality venues like bars, restaurants, and nightclubs that operate across midnight.

### Key Benefits

- **Automated Daily Closing**: No need to manually close business days - the system handles it automatically
- **Overnight Business Day Support**: Correctly handles venues that operate past midnight (e.g., 10 PM to 4 AM)
- **Accurate Reporting**: Ensures all transactions within a business period are grouped together for reports
- **Flexible Configuration**: Configurable end times in 30-minute increments
- **Real-time Status Display**: Shows scheduler status, last close time, and next scheduled close

### Use Cases

| Scenario | Configuration | Result |
|----------|--------------|--------|
| Bar open 10 PM - 4 AM | End Hour: 04:00 | Transactions at 2 AM belong to the previous day's business day |
| Restaurant open 6 AM - 11 PM | End Hour: 23:00 | Standard same-day business period |
| 24-hour establishment | End Hour: 06:00 | Business day resets at 6 AM daily |

---

## 2. Configuration

### Accessing Settings

1. Log in as an administrator
2. Navigate to **Admin Panel** > **Settings**
3. Locate the **Business Day Management** section

### Configuration Options

#### Business Day End Hour

- **Field**: `businessDayEndHour`
- **Type**: Time selector (HH:MM format, 24-hour)
- **Options**: 30-minute increments from 00:00 to 23:30
- **Default**: `06:00`
- **Purpose**: Defines when the business day ends

**Example Configuration:**

```
Business Day End Hour: 04:00
```

This means the business day ends at 4:00 AM. All transactions from the start time until 4:00 AM belong to the same business day.

#### Automatic Business Day Closing

- **Field**: `autoCloseEnabled`
- **Type**: Toggle switch
- **Default**: `false` (disabled)
- **Purpose**: Enables/disables automatic closing

**When Enabled:**
- The scheduler automatically creates a daily closing record at the configured end hour
- All transactions are finalized for the business period
- A new business day begins immediately after closing

**When Disabled:**
- Business days must be closed manually via the "Manually End Business Day" button
- No automatic closing occurs

### Status Display

The configuration panel shows real-time status:

| Status Item | Description |
|-------------|-------------|
| Scheduler Status | Shows if the scheduler is active (green indicator) or inactive |
| Closing in Progress | Amber indicator when a closing operation is running |
| Last Close Time | Timestamp of the most recent business day close |
| Next Scheduled Close | When the next automatic close will occur |

---

## 3. API Reference

### GET /api/settings

Retrieves current application settings including business day configuration.

**Response:**

```json
{
  "tax": { "mode": "none" },
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "04:00",
    "lastManualClose": "2026-02-19T04:00:00.000Z",
    "autoCloseEnabled": true
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `autoStartTime` | string | Time when business day starts (HH:MM) |
| `businessDayEndHour` | string | Time when business day ends (HH:MM) |
| `lastManualClose` | string \| null | ISO timestamp of last close, or null if never closed |
| `autoCloseEnabled` | boolean | Whether automatic closing is enabled |

---

### PUT /api/settings

Updates application settings including business day configuration.

**Request Body:**

```json
{
  "tax": { "mode": "none" },
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "04:00",
    "autoCloseEnabled": true
  }
}
```

**Response:** Returns updated settings object.

**Notes:**
- Updating settings clears the scheduler's cache, so changes take effect immediately
- The `lastManualClose` field is updated automatically by the system

---

### GET /api/settings/business-day-status

Retrieves the current status of the business day scheduler.

**Response:**

```json
{
  "scheduler": {
    "isRunning": true,
    "isClosingInProgress": false,
    "lastCloseTime": "2026-02-20T04:00:00.000Z",
    "nextScheduledClose": "2026-02-21T04:00:00.000Z"
  },
  "businessDay": {
    "autoCloseEnabled": true,
    "businessDayEndHour": "04:00"
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `scheduler.isRunning` | boolean | Whether the scheduler service is active |
| `scheduler.isClosingInProgress` | boolean | Whether a closing operation is currently running |
| `scheduler.lastCloseTime` | string \| null | ISO timestamp of last automatic close |
| `scheduler.nextScheduledClose` | string \| null | ISO timestamp of next scheduled close |
| `businessDay.autoCloseEnabled` | boolean | Current auto-close setting |
| `businessDay.businessDayEndHour` | string | Configured end hour |

---

## 4. Database Schema

### Settings Table

The [`Settings`](backend/prisma/schema.prisma:213) model stores business day configuration:

```prisma
model Settings {
  id                  Int       @id @default(autoincrement())
  taxMode             String
  autoStartTime       String
  businessDayEndHour  String    @default("06:00")
  autoCloseEnabled    Boolean   @default(false)
  lastManualClose     DateTime?

  @@map("settings")
}
```

### Field Descriptions

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | Int | Auto-increment | Primary key |
| `taxMode` | String | - | Tax calculation mode |
| `autoStartTime` | String | - | Business day start time (HH:MM) |
| `businessDayEndHour` | String | "06:00" | Business day end time (HH:MM) |
| `autoCloseEnabled` | Boolean | false | Enable automatic closing |
| `lastManualClose` | DateTime | null | Timestamp of last close |

### Migrations

#### 20260219130000_add_business_day_end_hour

Adds the `businessDayEndHour` column:

```sql
ALTER TABLE "settings" ADD COLUMN "businessDayEndHour" TEXT NOT NULL DEFAULT '06:00';
```

#### 20260220080000_add_auto_close_enabled

Adds the `autoCloseEnabled` column:

```sql
ALTER TABLE "settings" ADD COLUMN "autoCloseEnabled" BOOLEAN NOT NULL DEFAULT false;
```

---

## 5. How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend Server                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Business Day Scheduler                  │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         Cron Job (Every Minute)             │    │   │
│  │  │  • Check current time                       │    │   │
│  │  │  • Compare with businessDayEndHour          │    │   │
│  │  │  • Trigger closing if matched               │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         Settings Cache (1-minute TTL)       │    │   │
│  │  │  • autoCloseEnabled                         │    │   │
│  │  │  • businessDayEndHour                       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Daily Closing Service                     │   │
│  │  • Create closing record                             │   │
│  │  • Calculate transaction summary                     │   │
│  │  • Update lastManualClose                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Scheduler Service

The [`businessDayScheduler.ts`](backend/src/services/businessDayScheduler.ts:1) service manages automatic closing:

#### Initialization

The scheduler initializes when the server starts (see [`index.ts`](backend/src/index.ts:130)):

```typescript
initializeScheduler();
```

#### Cron Schedule

- **Frequency**: Every minute (`* * * * *`)
- **Timezone**: Europe/Berlin
- **Purpose**: Check if it's time to close the business day

#### Closing Logic

1. **Time Check**: Compare current time with configured `businessDayEndHour`
2. **Duplicate Prevention**: Skip if already closed within the last minute
3. **Settings Validation**: Only proceed if `autoCloseEnabled` is true
4. **Closing Execution**: Create daily closing record via [`createDailyClosing()`](backend/src/services/dailyClosingService.ts)

### Overnight Business Day Handling

The system correctly handles business days that cross midnight:

#### Example: Bar Open 22:00 - 04:00

```
Calendar Day: Tuesday              Calendar Day: Wednesday
|---------------------------|---------------------------|
         22:00                        04:00
            └──────── Business Day ────────┘
                    (Tuesday's Business Day)
```

**Logic** (from [`businessDay.ts`](backend/src/utils/businessDay.ts:51)):

```typescript
if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
  // Business day ends on the next calendar day
  end.setDate(end.getDate() + 1);
}
```

When closing at 04:00:
1. System determines the business day started at 06:00 the previous calendar day
2. Creates closing record for that business period
3. All transactions from 06:00 previous day to 04:00 current day are included

### Settings Cache

To minimize database queries, settings are cached:

- **TTL**: 60 seconds
- **Clear Trigger**: Settings update via PUT `/api/settings`
- **Function**: [`clearSettingsCache()`](backend/src/services/businessDayScheduler.ts:152)

### Graceful Shutdown

The scheduler stops gracefully on server shutdown:

```typescript
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

This ensures no partial closing operations occur during deployment or restart.

---

## 6. Troubleshooting

### Common Issues

#### Issue: Automatic Closing Not Occurring

**Symptoms:**
- Business days not closing automatically
- No daily closing records being created

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Auto-close disabled | Enable via Settings toggle or API |
| Scheduler not running | Check server logs for scheduler initialization |
| Time mismatch | Verify `businessDayEndHour` matches expected time |
| Database connection issue | Check `/health` endpoint for database status |

**Diagnostic Steps:**

1. Check scheduler status:
   ```bash
   curl http://localhost:3001/api/settings/business-day-status
   ```

2. Verify settings:
   ```bash
   curl http://localhost:3001/api/settings
   ```

3. Check server logs for scheduler messages:
   ```
   "Business day scheduler initialized"
   "Starting automatic business day closing..."
   ```

---

#### Issue: Wrong Business Day for Transactions

**Symptoms:**
- Transactions appearing in wrong day's report
- Overnight sales not grouped correctly

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Incorrect `autoStartTime` | Set to when business day begins (e.g., 06:00) |
| Incorrect `businessDayEndHour` | Set to when business day ends (e.g., 04:00) |
| Timezone mismatch | System uses Europe/Berlin timezone |

**Example Configuration for Nightclub:**

```json
{
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "04:00",
    "autoCloseEnabled": true
  }
}
```

This configuration:
- Starts business day at 06:00
- Ends business day at 04:00 the next calendar day
- Transactions at 02:00 belong to the previous day's business period

---

#### Issue: Multiple Closings Created

**Symptoms:**
- Duplicate daily closing records
- Multiple closings at same time

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Server restart during closing | System prevents this with 1-minute duplicate check |
| Multiple server instances | Ensure only one backend instance is running |

**Prevention:**

The scheduler includes duplicate prevention:

```typescript
if (lastCloseTime && (now.getTime() - lastCloseTime.getTime()) < 60000) {
  logInfo('Skipping auto-close - already closed within the last minute');
  return;
}
```

---

#### Issue: Scheduler Shows Inactive

**Symptoms:**
- Status shows "Scheduler is inactive"
- No next scheduled close displayed

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Server not fully started | Wait for initialization, check logs |
| Scheduler initialization failed | Check for errors in server startup |
| Auto-close disabled | Enable auto-close to see next scheduled time |

---

### Log Messages Reference

| Log Message | Meaning |
|-------------|---------|
| `Business day scheduler initialized` | Scheduler started successfully |
| `Starting automatic business day closing...` | Closing process begun |
| `Automatic business day closing completed` | Closing finished successfully |
| `Skipping auto-close - already closed within the last minute` | Duplicate prevention triggered |
| `Settings cache cleared` | Settings updated, cache refreshed |
| `Business day scheduler stopped` | Graceful shutdown in progress |

---

### Health Check

Use the health endpoint to verify system status:

```bash
curl http://localhost:3001/health
```

Response includes database connectivity and memory status:

```json
{
  "status": "OK",
  "timestamp": "2026-02-20T10:00:00.000Z",
  "checks": {
    "server": { "status": "OK" },
    "database": { "status": "OK", "responseTimeMs": 5 },
    "memory": { "status": "OK", "heapUsedPercent": 45 }
  }
}
```

---

## Appendix: Test Results

All tests passed successfully. Full test report available at [`test-files/business-hours-automation-test-report.md`](../test-files/business-hours-automation-test-report.md).

### Test Summary

| Test Case | Status |
|-----------|--------|
| Business Day End Hour Setting | PASS |
| Auto-Close Toggle | PASS |
| Settings Persistence | PASS |
| API: GET /api/settings | PASS |
| API: GET /api/settings/business-day-status | PASS |

---

## Related Documentation

- [Business Hours Automation Plan](./business-hours-automation-plan.md)
- [Daily Closing Feature](./manual-structure.md) - Section on daily closing procedures
- [API Documentation](./manual-structure.md) - Full API reference

---

## Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial implementation documentation |
