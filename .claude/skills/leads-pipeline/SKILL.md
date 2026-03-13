---
name: leads-pipeline
description: "Leads pipeline management using Cloudflare MCP. Query D1 for leads, callbacks, conversion uploads, dedup keys, and pixel events. Use for debugging lead flow, checking Voluum postbacks, and monitoring campaign performance."
---

# Leads Pipeline (Cloudflare MCP → D1)

จัดการ lead flow ทั้งหมดผ่าน Cloudflare MCP โดยตรง ไม่ต้องเปิด dashboard

## MCP Tool ที่ใช้

**Cloudflare MCP** — `mcp__cloudflare__d1_database_query`
- Database ID: ดูได้จาก Settings → D1 Database ID
- Account ID: ดูได้จาก Settings → Cloudflare Account ID

---

## D1 Schema Reference

### Worker DB (Callback Engine)
```sql
-- Raw callbacks จาก LeadsGate
lead_callbacks(id, account_id, type, lead_id, click_id, price, created, raw_payload, received_at)

-- Dedup keys ป้องกัน double-posting ไป Voluum
dedup_keys(dedup_key, account_id, created_at)

-- Audit trail การ upload conversion ไป Voluum
conversion_uploads(id, account_id, click_id, lead_id, payout, status, error_message, created_at)

-- Account configs พร้อม Voluum API keys
accounts(account_id, callback_token, voluum_api_key, domains, active, created_at)
```

### API Worker DB (LP Factory)
```sql
-- Landing page configs
sites(id, brand, domain, tagline, loan_type, amount_min, amount_max, color_id, font_id, layout, ...)

-- Deployment history
deploys(id, site_id, brand, url, type, deployed_by, created_at)

-- Ops: domains, accounts, profiles, payments
ops_domains, ops_accounts, ops_profiles, ops_payments, ops_logs
```

### Pixel Worker DB
```sql
-- First-party pixel events จาก landing pages
pixel_events(id, event, session_id, click_id, gclid, timestamp, url, referrer, domain, details, created_at)
```

---

## Common Queries

### ดู leads ล่าสุด (24 ชั่วโมง)
```sql
SELECT account_id, type, lead_id, click_id, price, received_at
FROM lead_callbacks
WHERE received_at > datetime('now', '-24 hours')
ORDER BY received_at DESC
LIMIT 50;
```

### นับ leads แยกตาม type
```sql
SELECT type, COUNT(*) as count, DATE(received_at) as date
FROM lead_callbacks
WHERE received_at > datetime('now', '-7 days')
GROUP BY type, DATE(received_at)
ORDER BY date DESC, count DESC;
```

### ดู conversion uploads ที่ failed
```sql
SELECT account_id, click_id, lead_id, payout, error_message, created_at
FROM conversion_uploads
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

### ตรวจสอบ duplicate ของ click_id
```sql
SELECT click_id, COUNT(*) as count
FROM lead_callbacks
WHERE click_id IS NOT NULL
  AND received_at > datetime('now', '-24 hours')
GROUP BY click_id
HAVING count > 1;
```

### ดู dedup keys ล่าสุด
```sql
SELECT dedup_key, account_id, created_at
FROM dedup_keys
ORDER BY created_at DESC
LIMIT 20;
```

### ดู pixel events แยก domain
```sql
SELECT domain, event, COUNT(*) as count
FROM pixel_events
WHERE created_at > datetime('now', '-24 hours')
GROUP BY domain, event
ORDER BY count DESC;
```

### Conversion rate (soldLead / totalLead)
```sql
SELECT
  account_id,
  COUNT(CASE WHEN type = 'soldLead' THEN 1 END) as sold,
  COUNT(CASE WHEN type = 'newLead' THEN 1 END) as new_leads,
  ROUND(COUNT(CASE WHEN type = 'soldLead' THEN 1 END) * 100.0 / COUNT(*), 2) as conv_pct,
  ROUND(SUM(CASE WHEN type = 'soldLead' THEN price ELSE 0 END), 2) as revenue
FROM lead_callbacks
WHERE received_at > datetime('now', '-7 days')
GROUP BY account_id;
```

### ดู sites ที่ active
```sql
SELECT id, brand, domain, loan_type, status, created_at
FROM sites
ORDER BY created_at DESC
LIMIT 20;
```

### ดู deploy history
```sql
SELECT d.brand, d.url, d.type, d.created_at, s.domain
FROM deploys d
LEFT JOIN sites s ON d.site_id = s.id
ORDER BY d.created_at DESC
LIMIT 20;
```

---

## Debugging Workflows

### Workflow 1: Lead ไม่เข้า Voluum
1. ตรวจ `lead_callbacks` — callback เข้ามาไหม?
2. ตรวจ `conversion_uploads` — status = 'failed' มี error_message ไหม?
3. ตรวจ `dedup_keys` — อาจ dedup ทิ้ง
4. ตรวจ `accounts` — voluum_api_key ถูกต้องไหม?

### Workflow 2: Pixel ไม่ fire
1. ตรวจ `pixel_events` แยก domain
2. ดู event types: `page_view`, `scroll_50`, `scroll_90`, `form_start`, `form_submit`
3. เทียบ session_id กับ click_id — flow ถูกต้องไหม?

### Workflow 3: Revenue discrepancy
```sql
-- เทียบ revenue ระหว่าง callbacks vs uploaded
SELECT
  cb.account_id,
  SUM(cb.price) as callback_revenue,
  SUM(cu.payout) as uploaded_payout,
  SUM(cb.price) - SUM(cu.payout) as diff
FROM lead_callbacks cb
LEFT JOIN conversion_uploads cu ON cb.click_id = cu.click_id
WHERE cb.type = 'soldLead'
  AND cb.received_at > datetime('now', '-7 days')
GROUP BY cb.account_id;
```

---

## Tips
- ใช้ Cloudflare MCP query แทน dashboard — เร็วกว่าและ filter ได้ละเอียดกว่า
- D1 ใช้ SQLite syntax — ใช้ `datetime('now', '-N hours/days')` สำหรับ time filters
- `raw_payload` ใน lead_callbacks เก็บ JSON ดิบจาก LeadsGate ไว้ตรวจสอบได้เสมอ
