# Property Finder Lead Fetching — Backend API Documentation

## Overview

This backend implements comprehensive Property Finder lead ingestion via **webhook push** (real-time) and **polling fallback** (batch). Every available data field from Property Finder is extracted and stored.

---

## Architecture Summary

### Webhook Flow (Primary)
1. Property Finder sends `POST` to `/api/ingestion/property-finder/webhook`
2. Backend validates HMAC-SHA256 signature using `PROPERTY_FINDER_WEBHOOK_SECRET`
3. Payload is persisted to `IngestionEvent` table (durable storage)
4. Endpoint responds `200 OK` immediately
5. Async processor extracts all fields and creates/updates lead
6. Failed events are retried by cron job (max 5 attempts)

### Polling Flow (Fallback)
- Cron job runs periodically to fetch leads via `GET /v1/leads` API
- Fetches leads created since last successful poll (stored in `SyncCursor`)
- Same field extraction logic as webhook
- Limited to past 3 months per PF API spec

---

## API Endpoints for Frontend

### 1. Property Finder Webhook Endpoint

**Endpoint:** `POST /api/ingestion/property-finder/webhook`

**Purpose:** Receives real-time lead notifications from Property Finder

**Authentication:** HMAC-SHA256 signature validation (handled by backend)

**Request Headers:**
```
x-signature: <hex-encoded-hmac-sha256-signature>
Content-Type: application/json
```

**Request Body Structure:**
```json
{
  "id": "evt_abc123",
  "type": "lead.created",
  "timestamp": "2026-07-13T14:30:00Z",
  "entity": {
    "id": "lead_xyz789",
    "type": "lead"
  },
  "payload": {
    "channel": "whatsapp",
    "status": "sent",
    "entityType": "listing",
    "publicProfile": { "id": 12345 },
    "sender": {
      "name": "John Doe Smith",
      "contacts": [
        { "type": "email", "value": "john@example.com" },
        { "type": "phone", "value": "+971501234567" }
      ]
    },
    "listing": {
      "id": "listing_456",
      "reference": "PF-REF-001"
    },
    "responseLink": "https://propertyfinder.com/leads/xyz789/respond"
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Status Codes:**
- `200` - Webhook received and queued for processing
- `401` - Invalid signature
- `400` - Invalid JSON payload

**Notes:**
- This endpoint is **NOT** called by the frontend
- It's registered with Property Finder's webhook configuration
- Frontend does not need to interact with this endpoint directly

---

## Data Fields Extracted

### Complete Field Mapping

The backend extracts and stores the following fields for each Property Finder lead:

| Database Field | Source | Type | Description | Example |
|---|---|---|---|---|
| `externalLeadId` | `entity.id` | String | PF's unique lead ID (primary dedup key) | `"lead_xyz789"` |
| `leadName` | `payload.sender.name` (first word) | String | Lead's first name | `"John"` |
| `lastName` | `payload.sender.name` (remaining words) | String | Lead's last name | `"Doe Smith"` |
| `mobileNumber` | `payload.sender.contacts[]` (type=phone/mobile) | String | Lead's phone number | `"+971501234567"` |
| `email` | `payload.sender.contacts[]` (type=email) | String | Lead's email address | `"john@example.com"` |
| `source` | Static | String | Always `"Property Finder"` | `"Property Finder"` |
| `ingestionSource` | Static | Enum | Always `"property_finder"` | `"property_finder"` |
| `city` | Listing API: `uaeEmirate` or `location.name.en` | String | City/Emirate | `"Dubai"` |
| `locality` | Listing API: `location.name.en` | String | Area/Community | `"Dubai Marina"` |
| `projectName` | Listing API: `project.name.en` or `developer` or `title.en` | String | Project/Development name | `"Marina Heights Tower"` |
| `projectType` | Listing API: `type` or `category` | String | Property type | `"Apartment"`, `"Villa"` |
| `configuration` | Listing API: `configuration` or `bedrooms` | String | Unit configuration | `"2BR"`, `"3BR+Maid"` |
| `propertySize` | Listing API: `size` | String | Property size in sqft | `"1200"` |
| `price` | Listing API: `price.amounts.sale` or `price.amounts.rent` | String | Property price | `"2500000"` |
| `unitNumber` | Listing API: `unitNumber` | String | Unit/apartment number | `"A-1204"` |
| `responseLink` | `payload.responseLink` | String | PF portal link to respond | `"https://propertyfinder.com/leads/..."` |
| `comments` | Computed | String | Metadata string | `"Channel: whatsapp \| Entity: listing \| Status: sent \| Listing ref: PF-REF-001"` |
| `rawPayload` | Entire webhook payload | JSON | Full raw payload for debugging | `{...}` |
| `leadStatus` | Static | String | Always `"Fresh"` on ingestion | `"Fresh"` |
| `serviceType` | Static | String | Always `"Buy"` (default) | `"Buy"` |
| `createdAt` | Auto | DateTime | Timestamp when lead was created in DB | `"2026-07-13T14:30:00Z"` |

### Name Parsing Logic

The backend parses `payload.sender.name` using the following rules:

- **Empty/null** → `firstName = "Unknown"`, `lastName = "Lead"`
- **Single word** (e.g., `"John"`) → `firstName = "John"`, `lastName = "Lead"`
- **Multiple words** (e.g., `"John Doe Smith"`) → `firstName = "John"`, `lastName = "Doe Smith"`

### Contact Extraction Logic

- **Email:** First contact object where `type === "email"` → extract `value`
- **Phone:** First contact object where `type === "phone"` OR `type === "mobile"` → extract `value`
- **Validation:** Lead is rejected if **both** email and phone are null

### Listing Enrichment

When `entityType === "listing"` and `listing.id` is present:

1. Backend calls `GET https://atlas.propertyfinder.com/v1/listings?filter[ids]={listing.id}`
2. Extracts all property details from API response
3. Stores in corresponding lead fields

**Fields enriched via API:**
- `city`, `locality`, `projectName`, `projectType`, `configuration`, `propertySize`, `price`, `unitNumber`

**Note:** Enrichment happens **asynchronously** after webhook responds 200. If API call fails, lead is still created with basic contact info, and enrichment fields remain `null`.

---

## Deduplication Strategy

The backend prevents duplicate leads using two guards:

### 1. Primary Guard: External Lead ID
- Checks if `externalLeadId` (PF's `entity.id`) already exists in database
- If found → **skips creation**, but backfills missing enrichment fields (city, locality, projectName) if available

### 2. Secondary Guard: Mobile + Source + Time Window
- If same `mobileNumber` + `source="Property Finder"` exists within **last 7 days** → **skips creation**
- Prevents duplicate submissions where PF issues a new lead ID for the same inquiry

**Business Note:** The 7-day window suppresses genuine re-inquiries. Adjust `DEDUP_WINDOW_MS` in `@/c:\Users\khand.DANISHKHAN\deen-crm-backend\src\services\ingestion\ingestion.utils.ts:4` if needed.

---

## Frontend Integration Points

### 1. Viewing Property Finder Leads

**Endpoint:** `GET /api/leads`

**Query Parameters:**
```
?source=Property Finder
&page=1
&limit=50
&sortBy=createdAt
&sortOrder=desc
```

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid-123",
      "leadName": "John",
      "lastName": "Doe Smith",
      "mobileNumber": "+971501234567",
      "email": "john@example.com",
      "source": "Property Finder",
      "city": "Dubai",
      "locality": "Dubai Marina",
      "projectName": "Marina Heights Tower",
      "projectType": "Apartment",
      "configuration": "2BR",
      "propertySize": "1200",
      "price": "2500000",
      "unitNumber": "A-1204",
      "responseLink": "https://propertyfinder.com/leads/xyz789/respond",
      "comments": "Channel: whatsapp | Entity: listing | Status: sent | Listing ref: PF-REF-001",
      "leadStatus": "Fresh",
      "serviceType": "Buy",
      "ingestionSource": "property_finder",
      "externalLeadId": "lead_xyz789",
      "createdAt": "2026-07-13T14:30:00Z",
      "updatedAt": "2026-07-13T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### 2. Viewing Single Lead Details

**Endpoint:** `GET /api/leads/:id`

**Response:** Same structure as above, single lead object

### 3. Filtering by Property Finder Source

**Endpoint:** `GET /api/leads?source=Property Finder`

**Additional Filters:**
- `?city=Dubai` - Filter by city
- `?locality=Dubai Marina` - Filter by locality
- `?projectName=Marina Heights Tower` - Filter by project
- `?projectType=Apartment` - Filter by property type
- `?leadStatus=Fresh` - Filter by lead status
- `?ingestionSource=property_finder` - Filter by ingestion source

### 4. Viewing Raw Webhook Payload (Debugging)

Each lead has a `rawPayload` JSON field containing the complete original webhook payload. This is useful for:
- Debugging missing fields
- Auditing data transformations
- Investigating ingestion issues

**Access via:** `GET /api/leads/:id` → `lead.rawPayload`

### 5. Response Link Integration

The `responseLink` field contains a direct URL to the lead in Property Finder's portal. Frontend can:

**Display as a button:**
```jsx
{lead.responseLink && (
  <a 
    href={lead.responseLink} 
    target="_blank" 
    rel="noopener noreferrer"
    className="btn btn-primary"
  >
    View in Property Finder
  </a>
)}
```

---

## Ingestion Event Tracking

### Viewing Ingestion Events

**Endpoint:** `GET /api/ingestion/events`

**Query Parameters:**
```
?platform=property_finder
&status=processed
&page=1
&limit=50
```

**Response:**
```json
{
  "events": [
    {
      "id": "uuid-456",
      "platform": "property_finder",
      "externalId": "lead_xyz789",
      "status": "processed",
      "error": null,
      "attempts": 1,
      "createdAt": "2026-07-13T14:30:00Z",
      "processedAt": "2026-07-13T14:30:05Z",
      "rawPayload": { ... }
    }
  ],
  "pagination": { ... }
}
```

**Status Values:**
- `received` - Webhook received, queued for processing
- `processed` - Successfully processed and lead created
- `duplicate` - Skipped due to deduplication
- `failed` - Processing failed (will retry)

**Use Cases:**
- Monitor webhook delivery health
- Debug failed ingestions
- Audit trail for compliance

---

## Environment Variables Required

The following environment variables must be set for Property Finder integration:

```env
# Webhook Authentication
PROPERTY_FINDER_WEBHOOK_SECRET=your_webhook_secret_here

# API Authentication (for polling and enrichment)
PROPERTY_FINDER_API_KEY=your_40_char_api_key_here
PROPERTY_FINDER_API_SECRET=your_32_char_api_secret_here

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

---

## Migration Required

Before deploying, run the following migration to add the `responseLink` field:

```bash
npx prisma migrate dev --name add_response_link_to_leads
```

Or manually apply:

```sql
ALTER TABLE leads ADD COLUMN response_link TEXT;
```

Then regenerate Prisma client:

```bash
npx prisma generate
```

---

## Error Handling

### Webhook Validation Failures

**Scenario:** Invalid signature
- **Status:** `401 Unauthorized`
- **Response:** `{ "error": "Invalid signature" }`
- **Action:** Check `PROPERTY_FINDER_WEBHOOK_SECRET` matches PF configuration

### Missing Required Fields

**Scenario:** Both phone and email are null
- **Status:** `400 Bad Request` (after async processing)
- **Event Status:** `failed`
- **Action:** Lead is not created, event is marked failed and will retry

### API Enrichment Failures

**Scenario:** PF API returns 404 or 500 for listing details
- **Behavior:** Lead is still created with basic contact info
- **Enrichment Fields:** Remain `null`
- **Logged:** Warning in console logs
- **Action:** No retry - lead is usable without enrichment

### Duplicate Leads

**Scenario:** Lead with same `externalLeadId` already exists
- **Behavior:** Skips creation, backfills missing enrichment fields
- **Event Status:** `processed` (not `duplicate`)
- **Response:** `{ "created": false }`

---

## Testing Webhook Integration

### 1. Register Webhook with Property Finder

**Property Finder Dashboard:**
1. Navigate to **Settings → Webhooks**
2. Add new webhook:
   - **URL:** `https://your-backend-domain.com/api/ingestion/property-finder/webhook`
   - **Secret:** Generate a secure random string (min 32 chars)
   - **Events:** Select `lead.created`, `lead.updated`, `lead.assigned`
3. Save and copy the secret to `PROPERTY_FINDER_WEBHOOK_SECRET` env var

### 2. Test Webhook Delivery

**Using Property Finder's Test Tool:**
1. In PF Dashboard → Webhooks → Click "Test" next to your webhook
2. PF will send a sample `lead.created` event
3. Check backend logs for `[PF webhook] Processing lead...`
4. Verify lead appears in database

**Manual cURL Test:**
```bash
# Generate signature
SECRET="your_webhook_secret"
PAYLOAD='{"id":"test_evt_123","type":"lead.created","timestamp":"2026-07-13T14:30:00Z","entity":{"id":"test_lead_456","type":"lead"},"payload":{"channel":"email","status":"sent","entityType":"listing","sender":{"name":"Test User","contacts":[{"type":"email","value":"test@example.com"},{"type":"phone","value":"+971501234567"}]},"listing":{"id":"listing_789","reference":"TEST-001"},"responseLink":"https://propertyfinder.com/test"}}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST https://your-backend-domain.com/api/ingestion/property-finder/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### 3. Verify Lead Creation

**Check Database:**
```sql
SELECT 
  id, 
  "leadName", 
  "lastName", 
  "mobileNumber", 
  email, 
  source, 
  city, 
  locality, 
  "projectName", 
  "projectType", 
  configuration, 
  "propertySize", 
  price, 
  "unitNumber",
  "responseLink",
  "externalLeadId",
  "createdAt"
FROM leads
WHERE source = 'Property Finder'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Check Ingestion Events:**
```sql
SELECT 
  id, 
  platform, 
  status, 
  error, 
  attempts, 
  "createdAt", 
  "processedAt"
FROM ingestion_events
WHERE platform = 'property_finder'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: Leads not appearing in database

**Check:**
1. Webhook endpoint is publicly accessible (not localhost)
2. `PROPERTY_FINDER_WEBHOOK_SECRET` matches PF configuration
3. Check `ingestion_events` table for failed events
4. Review backend logs for errors

### Issue: Missing enrichment fields (city, locality, projectName, etc.)

**Possible Causes:**
1. PF API credentials invalid (`PROPERTY_FINDER_API_KEY`, `PROPERTY_FINDER_API_SECRET`)
2. Listing ID not found in PF API (404)
3. Rate limit hit (429) - backend will retry with exponential backoff
4. Network timeout

**Check:**
- Backend logs for `[PF] GET /v1/listings?filter[ids]=...` warnings
- Verify API credentials are correct
- Check if listing exists in PF portal

### Issue: Duplicate leads being created

**Check:**
1. `externalLeadId` is being extracted correctly (should be `entity.id`)
2. Database unique constraint on `externalLeadId` exists
3. Review deduplication window (7 days) - may need adjustment

---

## Performance Considerations

### Rate Limits

**Property Finder API:**
- Token endpoint: 60 req/min
- All other endpoints: 650 req/min

**Backend Handling:**
- Token is cached for 50 minutes (auto-refresh)
- 429 responses trigger exponential backoff with jitter
- Max 3 retries per request

### Webhook Processing

- Webhook responds `200 OK` in <50ms (before processing)
- Actual processing happens asynchronously
- Failed events retry every cron cycle (max 5 attempts)
- No blocking operations in webhook handler

### Database Indexes

Ensure these indexes exist for optimal query performance:

```sql
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_external_lead_id ON leads("externalLeadId");
CREATE INDEX idx_leads_created_at_desc ON leads("createdAt" DESC);
CREATE INDEX idx_leads_ingestion_source ON leads("ingestionSource");
CREATE INDEX idx_ingestion_events_status ON ingestion_events(status);
CREATE INDEX idx_ingestion_events_platform ON ingestion_events(platform);
```

---

## Summary for Frontend Team

### What You Need to Know

1. **Property Finder leads are automatically ingested** via webhook - no manual action required
2. **All available fields are extracted** - including name, contact, property details, and PF portal link
3. **Leads appear in the standard leads list** - filter by `source="Property Finder"` or `ingestionSource="property_finder"`
4. **Response Link** - Display the `responseLink` field as a button to open PF portal
5. **Deduplication is automatic** - same lead won't be created twice
6. **Enrichment is best-effort** - some fields may be null if PF API fails

### Key Fields for UI Display

**Essential:**
- `leadName` + `lastName` - Full name
- `mobileNumber` - Primary contact
- `email` - Secondary contact
- `source` - Always "Property Finder"

**Property Details:**
- `city` - Emirate/City
- `locality` - Area/Community
- `projectName` - Project/Development
- `projectType` - Apartment/Villa/etc.
- `configuration` - 2BR, 3BR+Maid, etc.
- `propertySize` - Square footage
- `price` - Property price
- `unitNumber` - Unit/apartment number

**Actions:**
- `responseLink` - Link to PF portal (display as button)

**Metadata:**
- `comments` - Channel, entity type, status, listing reference
- `createdAt` - When lead was received
- `leadStatus` - Current status (Fresh, Contacted, etc.)

---

## Contact

For backend issues or questions, contact the backend team.

For Property Finder API issues, refer to their Enterprise API documentation or contact PF support.
