---
name: db-ops
description: "Neon PostgreSQL database operations via Neon MCP. Manage settings, sites, deploy_history tables. Use for schema changes, data queries, migrations, and database troubleshooting."
---

# Database Operations (Neon MCP → PostgreSQL)

จัดการ Neon PostgreSQL ผ่าน MCP โดยตรง

## MCP Tool ที่ใช้

**Neon MCP** — tools หลัก:
- `mcp__neon__run_sql` — execute SQL query
- `mcp__neon__run_sql_transaction` — run multiple queries as transaction
- `mcp__neon__list_projects` — list Neon projects
- `mcp__neon__describe_table_schema` — ดู table schema
- `mcp__neon__get_connection_string` — get connection string

---

## Schema Reference

```sql
-- Key-value store สำหรับ app settings
settings(key TEXT PK, value JSONB, updated_at TIMESTAMP)

-- Landing page configurations
sites(id TEXT PK, data JSONB, created_at TIMESTAMP, updated_at TIMESTAMP)

-- Deployment history
deploy_history(id TEXT PK, site_id TEXT FK, target TEXT, url TEXT, status TEXT, brand TEXT, created_at TIMESTAMP)
```

---

## Common Queries

### ดู settings ทั้งหมด
```sql
SELECT key, value, updated_at
FROM settings
ORDER BY key;
```

### ดู/แก้ไข setting เฉพาะ key
```sql
-- Read
SELECT value FROM settings WHERE key = 'apiEndpoint';

-- Upsert
INSERT INTO settings (key, value, updated_at)
VALUES ('apiEndpoint', '"https://api.example.com"', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
```

### ดู sites ล่าสุด
```sql
SELECT id, data->>'brand' as brand, data->>'domain' as domain,
       data->>'status' as status, created_at
FROM sites
ORDER BY created_at DESC
LIMIT 20;
```

### ดู site ตาม domain
```sql
SELECT id, data, updated_at
FROM sites
WHERE data->>'domain' = 'example.com';
```

### ดู deploy history
```sql
SELECT id, site_id, brand, url, status, target, created_at
FROM deploy_history
ORDER BY created_at DESC
LIMIT 30;
```

### นับ deploys แยก status
```sql
SELECT status, COUNT(*) as count, MAX(created_at) as latest
FROM deploy_history
GROUP BY status
ORDER BY count DESC;
```

### ดู deploys ของ site ที่ระบุ
```sql
SELECT dh.*, s.data->>'brand' as brand_name
FROM deploy_history dh
JOIN sites s ON dh.site_id = s.id
WHERE dh.site_id = 'SITE_ID_HERE'
ORDER BY dh.created_at DESC;
```

---

## Schema Management

### ดู table schema
```
→ ใช้ Neon MCP: describe_table_schema
  table: "sites" | "settings" | "deploy_history"
```

### เพิ่ม column (migration)
```sql
-- ตัวอย่าง: เพิ่ม column ใหม่ใน deploy_history
ALTER TABLE deploy_history ADD COLUMN deployed_by TEXT DEFAULT '';
```

### สร้าง index
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_brand
ON sites((data->>'brand'));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deploy_history_brand
ON deploy_history(brand, created_at DESC);
```

### Backup table
```sql
-- Snapshot sites ก่อน migration
CREATE TABLE sites_backup_20260313 AS SELECT * FROM sites;
```

---

## JSONB Operations (sites.data)

```sql
-- ดู specific fields จาก data
SELECT
  id,
  data->>'brand' as brand,
  data->>'domain' as domain,
  data->>'loan_type' as loan_type,
  (data->>'amount_max')::INTEGER as max_amount,
  data->>'color_id' as theme
FROM sites;

-- Filter by JSONB field
SELECT * FROM sites
WHERE data->>'loan_type' = 'personal'
  AND (data->>'amount_max')::INTEGER > 3000;

-- Update specific field ใน JSONB
UPDATE sites
SET data = data || '{"status": "active"}'::jsonb,
    updated_at = NOW()
WHERE id = 'SITE_ID_HERE';
```

---

## Maintenance

### Vacuum / Analyze
```sql
VACUUM ANALYZE sites;
VACUUM ANALYZE deploy_history;
```

### ดู table sizes
```sql
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### ดู slow queries (pg_stat_statements)
```sql
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Connection

Connection string อยู่ใน:
- Settings → Neon Connection String (localStorage: `lpf2-settings`)
- หรือใช้ Neon MCP: `get_connection_string`

Format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

---

## Tips
- ใช้ Neon MCP แทนการเปิด Neon console — query ได้เลยใน conversation
- JSONB `->` return JSON type, `->>` return TEXT — ระวัง type casting
- ใช้ `ON CONFLICT` แทน try/catch สำหรับ upserts
- ทำ `CREATE INDEX CONCURRENTLY` เพื่อไม่ lock table ระหว่าง index creation
