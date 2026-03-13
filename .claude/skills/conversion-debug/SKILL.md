---
name: conversion-debug
description: "Debug conversion tracking issues using Browser MCP + Cloudflare MCP. Trace click_id flow, verify Voluum S2S postback, check pixel events, diagnose LeadsGate callbacks. Use when conversions are missing or revenue doesn't match."
---

# Conversion Debugging (Browser MCP + Cloudflare MCP)

Debug ปัญหา conversion tracking แบบ end-to-end

## Flow Overview

```
User lands on LP
    ↓
click_id จาก Voluum URL param เก็บใน sessionStorage
    ↓
Pixel events fire → pixel-worker D1 (pixel_events)
    ↓
User submits form → LeadsGate iframe
    ↓
LeadsGate callback → worker D1 (lead_callbacks)
    ↓
Worker dedup check → dedup_keys
    ↓
Upload conversion → Voluum S2S API
    ↓
Log result → conversion_uploads
```

---

## Step-by-Step Debug

### Step 1: ตรวจ click_id บน LP (Browser MCP)

```javascript
// ใช้ Browser MCP → navigate → LP URL พร้อม click_id
// เช่น: https://domain.com/?clickid=TEST123

// จากนั้น evaluate:
{
  url_params: new URLSearchParams(window.location.search).get('clickid'),
  session_storage: sessionStorage.getItem('clickId') || sessionStorage.getItem('click_id'),
  all_session: JSON.stringify(Object.fromEntries(
    Object.keys(sessionStorage).map(k => [k, sessionStorage.getItem(k)])
  ))
}
```

**Expected:** click_id ต้องอยู่ใน sessionStorage หลัง page load

---

### Step 2: ตรวจ pixel events fire (Browser MCP)

```javascript
// ตรวจ network calls ไป pixel-worker
// ใช้ Browser MCP → get_network_logs
// Filter: URL contains "/e" หรือ "t." หรือ "/track"

// หรือ evaluate:
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/e') || r.name.includes('/track'))
  .map(r => ({ url: r.name, duration: r.duration, status: r.responseStatus }))
```

---

### Step 3: ตรวจ pixel_events ใน D1 (Cloudflare MCP)

```sql
-- หา events จาก session ล่าสุด
SELECT event, session_id, click_id, url, created_at
FROM pixel_events
WHERE click_id = 'TEST123'  -- ใส่ click_id ที่ test
ORDER BY created_at DESC;

-- หรือดูตาม domain
SELECT event, COUNT(*) as count, MAX(created_at) as latest
FROM pixel_events
WHERE domain = 'yourdomain.com'
  AND created_at > datetime('now', '-1 hour')
GROUP BY event
ORDER BY latest DESC;
```

---

### Step 4: ตรวจ LeadsGate callback (Cloudflare MCP)

```sql
-- ดู callbacks ล่าสุดจาก account
SELECT type, lead_id, click_id, price, received_at, raw_payload
FROM lead_callbacks
WHERE account_id = 'YOUR_ACCOUNT_ID'
ORDER BY received_at DESC
LIMIT 10;

-- หา callback จาก click_id เฉพาะ
SELECT *
FROM lead_callbacks
WHERE click_id = 'TEST123'
ORDER BY received_at DESC;
```

---

### Step 5: ตรวจ conversion upload (Cloudflare MCP)

```sql
-- ดู upload result สำหรับ click_id
SELECT status, payout, error_message, created_at
FROM conversion_uploads
WHERE click_id = 'TEST123';

-- ดู failed uploads ล่าสุด
SELECT account_id, click_id, lead_id, payout, error_message, created_at
FROM conversion_uploads
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

---

### Step 6: ตรวจ dedup (Cloudflare MCP)

```sql
-- ตรวจว่า conversion ถูก dedup ทิ้งไหม
-- dedup_key = sha256(click_id + ":" + lead_id)
SELECT dedup_key, account_id, created_at
FROM dedup_keys
WHERE account_id = 'YOUR_ACCOUNT_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Diagnostic Queries

### Revenue ที่หายไป (ล่าสุด 24 ชั่วโมง)
```sql
SELECT
  cb.click_id,
  cb.lead_id,
  cb.price as expected_payout,
  cu.payout as uploaded_payout,
  cu.status,
  cu.error_message
FROM lead_callbacks cb
LEFT JOIN conversion_uploads cu ON cb.click_id = cu.click_id AND cb.account_id = cu.account_id
WHERE cb.type = 'soldLead'
  AND cb.received_at > datetime('now', '-24 hours')
ORDER BY cb.received_at DESC;
```

### Callbacks ที่ไม่มี pixel events (click_id ไม่ match)
```sql
-- Callbacks ที่ไม่เคย fire pixel
SELECT cb.click_id, cb.type, cb.received_at
FROM lead_callbacks cb
WHERE cb.click_id NOT IN (
  SELECT DISTINCT click_id FROM pixel_events WHERE click_id != ''
)
AND cb.received_at > datetime('now', '-24 hours')
LIMIT 20;
```

---

## Common Problems

### ปัญหา: click_id ไม่ถูกส่งไปกับ callback
**สาเหตุ:** LeadsGate ไม่ pass click_id กลับมา
**ตรวจ:** `raw_payload` ใน `lead_callbacks` — มี `click_id` field ไหม?
```sql
SELECT raw_payload FROM lead_callbacks
WHERE account_id = 'X' ORDER BY received_at DESC LIMIT 3;
```

### ปัญหา: Voluum upload failed
**สาเหตุ:** API key หมดอายุ หรือ click_id ไม่ valid ใน Voluum
**ตรวจ:** `error_message` ใน `conversion_uploads`
**Fix:** อัปเดต `voluum_api_key` ใน `accounts` table

### ปัญหา: Duplicate conversion
**สาเหตุ:** LeadsGate ส่ง callback มากกว่า 1 ครั้ง
**ตรวจ:** `dedup_keys` — dedup ทำงานไหม?
**Expected behavior:** ครั้งที่ 2 ต้อง reject โดยไม่ upload ซ้ำ

### ปัญหา: Pixel ไม่ fire
**ตรวจ Browser MCP:**
```javascript
// ตรวจ pixel-worker URL configured ถูกต้องไหม
document.querySelector('[data-pixel-endpoint]')?.dataset.pixelEndpoint
// หรือดูใน source code: tracking-pixel.js
```

---

## Tools Summary

| ขั้นตอน | MCP | Tool |
|--------|-----|------|
| ตรวจ click_id บน LP | Browser | navigate + evaluate |
| ตรวจ pixel fire | Browser | get_network_logs |
| ตรวจ pixel_events D1 | Cloudflare | d1_database_query |
| ตรวจ lead_callbacks | Cloudflare | d1_database_query |
| ตรวจ conversion_uploads | Cloudflare | d1_database_query |
| ตรวจ dedup_keys | Cloudflare | d1_database_query |
