# Lead Report Module - New Backend Routes Summary

This document describes the new backend endpoints required to support the enhanced Lead Report Module frontend implementation.

---

## 1. Priority Distribution Report

**Endpoint:** `GET /leads/report/priority`

**Query Parameters:**
- `dateFrom` (optional, string): ISO date string (YYYY-MM-DD)
- `dateTo` (optional, string): ISO date string (YYYY-MM-DD)

**Response Format:**
```typescript
{
  data: {
    priority: string;      // e.g., "High", "Medium", "Low"
    count: number;
    percentage: number;    // 0-100
  }[];
}
```

**Description:** Returns the distribution of leads by priority level within the specified date range. Used for the Priority Distribution donut chart.

---

## 2. Geographic Distribution Report

**Endpoint:** `GET /leads/report/geo`

**Query Parameters:**
- `dateFrom` (optional, string): ISO date string (YYYY-MM-DD)
- `dateTo` (optional, string): ISO date string (YYYY-MM-DD)

**Response Format:**
```typescript
{
  data: {
    region: string;        // e.g., "North", "South", "East", "West", or city/country
    count: number;
    percentage: number;    // 0-100
  }[];
}
```

**Description:** Returns the distribution of leads by geographic region. Used for the Geographic Heatmap visualization (if sufficient data).

---

## 3. Lead Report Summary

**Endpoint:** `GET /leads/report/summary`

**Query Parameters:**
- `dateFrom` (optional, string): ISO date string (YYYY-MM-DD)
- `dateTo` (optional, string): ISO date string (YYYY-MM-DD)

**Response Format:**
```typescript
{
  data: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;      // 0-100
    touchRate: number;           // 0-100
    avgResponseTime: number;     // in hours
    followUpCompletionRate: number; // 0-100
  };
}
```

**Description:** Returns aggregated KPI metrics for the lead report. Used for the KPI cards with period-over-period comparisons.

**Notes:**
- `convertedLeads` should count leads with status in `["Interested", "Existing Client"]`
- `touchRate` = (touched leads / total assigned leads) * 100
- `followUpCompletionRate` = (completed follow-ups / total follow-ups scheduled) * 100

---

## 4. Lead Time Series Report

**Endpoint:** `GET /leads/report/timeseries`

**Query Parameters:**
- `dateFrom` (optional, string): ISO date string (YYYY-MM-DD)
- `dateTo` (optional, string): ISO date string (YYYY-MM-DD)
- `groupBy` (optional, string): "day" | "week" | "month" (default: "day")

**Response Format:**
```typescript
{
  data: {
    date: string;      // ISO date string (YYYY-MM-DD)
    count: number;     // number of leads created
  }[];
}
```

**Description:** Returns lead creation counts grouped by time period. Used for the Lead Generation Trend chart.

---

## 5. Send Employee Reminder

**Endpoint:** `POST /leads/report/employee/:userId/remind`

**Path Parameters:**
- `userId` (string): The ID of the employee to send a reminder to

**Request Body:**
```typescript
{
  message?: string;   // Optional custom message
}
```

**Response Format:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Description:** Sends a reminder notification to an employee about their pending follow-ups or performance. Used for the "Send Reminder" quick action in Employee Performance Cards.

---

## 6. Enhanced Source Report (Extension to Existing Endpoint)

**Endpoint:** `GET /leads/report/source` (existing)

**Enhanced Response Format:**
```typescript
{
  data: {
    source: string;
    count: number;
    percentage: number;
    touched: number;          // NEW: number of leads from this source that have been touched
    converted: number;        // NEW: number of leads from this source that are converted
    conversionRate: number;   // NEW: 0-100
    statusBreakdown: {        // NEW: breakdown by lead status
      [status: string]: number;
    };
  }[];
}
```

**Description:** The existing source report endpoint should be extended to include additional metrics for richer source performance analytics.

---

## 7. Enhanced User Report (Extension to Existing Endpoint)

**Endpoint:** `GET /leads/report/user` (existing)

**Enhanced Response Format:**
```typescript
{
  data: {
    userId: string;
    fullName: string;
    assigned: number;
    touched: number;
    untouched: number;
    followedUp: number;
    missedFollowUps: number;
    converted: number;        // NEW: number of leads converted
    conversionRate: number;   // NEW: 0-100
    lastActivityAt: string;   // ISO datetime string
  }[];
}
```

**Description:** The existing user report endpoint should be extended to include conversion metrics.

---

## 8. Enhanced Activity Feed (Extension to Existing Endpoint)

**Endpoint:** `GET /leads/activity` (existing)

**Enhanced Query Parameters:**
- `actorId` (optional, string): Filter by user ID
- `dateFrom` (optional, string): ISO date string
- `dateTo` (optional, string): ISO date string
- `pageSize` (optional, number): Maximum number of results (default: 50)

**Response Format:** (no changes needed, but ensure metadata includes source info)

**Description:** The existing activity endpoint is used for employee activity feeds. Ensure that the `metadata` field includes lead source information for source distribution analysis.

---

## Implementation Notes

1. **Date Filtering:** All report endpoints should support optional `dateFrom` and `dateTo` query parameters. If not provided, return data for the last 30 days by default.

2. **Pagination:** For endpoints that may return large datasets (activity feed), implement pagination with `page` and `pageSize` parameters.

3. **Error Handling:** Return appropriate HTTP status codes (400 for invalid params, 401 for unauthorized, 500 for server errors) with error messages in the response body.

4. **Performance:** Consider caching report data for short periods (e.g., 5 minutes) to reduce database load for frequently accessed endpoints.

5. **Conversion Logic:** Use the following statuses to determine converted leads:
   - `Interested`
   - `Existing Client`

6. **Touch Rate Calculation:** A lead is considered "touched" if it has at least one activity record (comment, call, email, etc.) associated with it.

7. **Follow-up Completion Rate:** Calculate based on scheduled follow-ups vs. completed follow-ups. A follow-up is considered completed if the associated activity has a `completedAt` timestamp.

---

## Frontend Files Using These Endpoints

- `services/leads/reports.service.ts` - API service layer
- `hooks/useLeadReports.ts` - React Query hooks
- `app/(dashboard)/leads/reports/page.tsx` - Main reports page
- `app/(dashboard)/leads/reports/employee/[userId]/page.tsx` - Employee drill-down page
