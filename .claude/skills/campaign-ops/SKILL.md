---
name: campaign-ops
description: "Full campaign lifecycle operations combining all 3 MCPs (Cloudflare + Neon + Browser). Create LP, verify deployment, check leads, monitor performance. Master workflow for end-to-end campaign management."
---

# Campaign Operations (Cloudflare + Neon + Browser MCP)

Master workflow สำหรับจัดการ campaign ครบวงจร ใช้ทั้ง 3 MCPs พร้อมกัน

## MCPs ที่ใช้

| MCP | Use Case |
|-----|----------|
| **Cloudflare** | Query D1 leads, callbacks, pixel events, DNS management |
| **Neon** | Site configs, settings, deploy history |
| **Browser** | Visual QA, pixel verification, form testing |

---

## Workflow 1: Launch Campaign ใหม่

### Phase 1: ตรวจ Site Config (Neon MCP)
```sql
-- ตรวจ site config ก่อน deploy
SELECT id, data->>'brand' as brand, data->>'domain' as domain,
       data->>'loan_type' as type, data->>'network' as network,
       data->>'redirect_url' as redirect_url
FROM sites
WHERE id = 'SITE_ID';
```

**ตรวจ:**
- [ ] domain ถูกต้อง
- [ ] network = 'LeadsGate'
- [ ] redirect_url ตั้งค่าแล้ว
- [ ] compliance = 'standard' หรือ 'extended'

### Phase 2: ตรวจ DNS (Cloudflare MCP)
```
→ Cloudflare MCP: dns_record_list (zone_id ของ domain)
ตรวจ:
- CNAME/A record ชี้ไปถูก worker/pages
- Proxy status (orange cloud = on)
```

### Phase 3: Visual QA (Browser MCP)
```
→ navigate → https://domain.com/?clickid=TESTCLICK123
→ screenshot (desktop 1280×800)
→ screenshot (mobile 375×812)
→ get_console_logs (errors only)
→ evaluate: sessionStorage.getItem('clickId')
   Expected: 'TESTCLICK123'
```

### Phase 4: ตรวจ Pixel (Browser MCP + Cloudflare MCP)
```
Browser MCP:
→ get_network_logs (filter: "/e" หรือ "/track")
   Expected: POST request to pixel endpoint

Cloudflare MCP:
→ d1_database_query:
SELECT event, click_id, created_at FROM pixel_events
WHERE click_id = 'TESTCLICK123'
ORDER BY created_at DESC;
Expected: page_view event ขึ้นภายใน 5 วินาที
```

### Phase 5: เพิ่ม Account Config (Cloudflare MCP)
```sql
-- ตรวจ account มีอยู่แล้วไหม
SELECT account_id, active FROM accounts WHERE account_id = 'ACCOUNT_ID';

-- เพิ่ม account ใหม่ (ถ้าจำเป็น)
INSERT INTO accounts (account_id, callback_token, voluum_api_key, domains, active)
VALUES ('ACCOUNT_ID', 'TOKEN', 'VOLUUM_KEY', '["domain.com"]', 1);
```

---

## Workflow 2: Daily Performance Check

### Morning Check (ทุกวัน)

**ขั้นตอน 1: Revenue Summary (Cloudflare MCP)**
```sql
SELECT
  account_id,
  COUNT(CASE WHEN type = 'soldLead' THEN 1 END) as sold,
  COUNT(CASE WHEN type = 'newLead' THEN 1 END) as new_leads,
  ROUND(SUM(CASE WHEN type = 'soldLead' THEN price ELSE 0 END), 2) as revenue,
  ROUND(COUNT(CASE WHEN type = 'soldLead' THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN type = 'newLead' THEN 1 END), 0), 1) as conv_pct
FROM lead_callbacks
WHERE received_at > datetime('now', '-24 hours')
GROUP BY account_id;
```

**ขั้นตอน 2: Failed Conversions (Cloudflare MCP)**
```sql
SELECT click_id, error_message, created_at
FROM conversion_uploads
WHERE status = 'failed'
  AND created_at > datetime('now', '-24 hours');
```

**ขั้นตอน 3: Pixel Health (Cloudflare MCP)**
```sql
SELECT domain, event, COUNT(*) as count
FROM pixel_events
WHERE created_at > datetime('now', '-24 hours')
GROUP BY domain, event
ORDER BY domain, count DESC;
```

**ขั้นตอน 4: Quick Visual Check (Browser MCP)**
```
→ navigate → top performing domain
→ screenshot mobile
→ ตรวจว่า LP ยังใช้งานได้ปกติ
```

---

## Workflow 3: Debug Campaign ที่ Revenue หาย

### Checklist แบบ Step-by-Step

```
1. Cloudflare MCP: ดู lead_callbacks 24h
   → callbacks เข้ามาไหม?

2. Cloudflare MCP: ดู conversion_uploads ที่ failed
   → error_message บอกอะไร?

3. Cloudflare MCP: ตรวจ dedup_keys
   → อาจ dedup ทิ้งทั้งหมด?

4. Browser MCP: เปิด LP + ตรวจ pixel fire
   → click_id ถูก capture ไหม?

5. Cloudflare MCP: ตรวจ pixel_events
   → events เข้า D1 ไหม?

6. Neon MCP: ตรวจ site config
   → redirect_url, network ถูกต้องไหม?
```

---

## Workflow 4: เพิ่ม Domain ใหม่

### Full Flow
```
1. Neon MCP: สร้าง site config
INSERT INTO sites (id, data, created_at)
VALUES (gen_random_uuid(), '{"brand":"X","domain":"newdomain.com",...}', NOW());

2. Cloudflare MCP: เพิ่ม DNS record
→ dns_record_create: CNAME newdomain.com → worker.username.workers.dev

3. Cloudflare MCP: ตรวจ DNS propagate
→ dns_record_list: ดู record ที่เพิ่ง add

4. Browser MCP: QA
→ navigate → https://newdomain.com
→ screenshot + ตรวจ console

5. Cloudflare MCP: Update account domains
UPDATE accounts
SET domains = json_insert(domains, '$[#]', 'newdomain.com')
WHERE account_id = 'ACCOUNT_ID';
```

---

## Quick Reference: ใช้ MCP ไหน?

| Task | MCP |
|------|-----|
| ดู leads / revenue | Cloudflare (D1) |
| ดู failed conversions | Cloudflare (D1) |
| ดู pixel events | Cloudflare (D1) |
| ตรวจ DNS record | Cloudflare (DNS) |
| ดู site config | Neon |
| ดู deploy history | Neon |
| อัปเดต settings | Neon |
| Visual QA LP | Browser |
| Debug pixel fire | Browser + Cloudflare |
| Test form submission | Browser |
| Screenshot mobile | Browser |

---

## KPIs ที่ต้องติดตาม

| Metric | Target | Query |
|--------|--------|-------|
| Conv Rate | > 15% | soldLead / newLead |
| Revenue/day | ตาม budget | SUM(price) WHERE type='soldLead' |
| Failed uploads | < 5% | failed / total conversions |
| Pixel fire rate | > 90% | pixel_events / lead_callbacks |
| LP load time | < 2.5s | Browser MCP performance API |
