---
name: cloudflare-workers
description: "Cloudflare Workers development and management via Cloudflare MCP. Deploy workers, manage D1 databases, tail logs, handle DNS/zones, KV storage. Use for lander, worker, pixel-worker, api-worker, cf-proxy deployments."
---

# Cloudflare Workers (Cloudflare MCP)

จัดการ Cloudflare Workers ทั้งหมดในโปรเจ็คผ่าน MCP และ Wrangler

## Workers ในโปรเจ็ค

| Worker | Path | Role |
|--------|------|------|
| `worker` | `apps/worker/` | LeadsGate callback engine + Voluum postback |
| `pixel-worker` | `apps/pixel-worker/` | First-party tracking pixel |
| `api-worker` | `apps/api-worker/` | LP Factory REST API |
| `cf-proxy` | `apps/cf-proxy/` | CORS proxy |
| `lander` | `apps/lander/` | Astro static landing pages |

---

## MCP Tools ที่ใช้

**Cloudflare MCP** — tools หลัก:
- `mcp__cloudflare__worker_list` — list workers
- `mcp__cloudflare__worker_get` — ดู worker code
- `mcp__cloudflare__worker_put` — deploy worker
- `mcp__cloudflare__d1_database_list` — list D1 databases
- `mcp__cloudflare__d1_database_query` — query D1
- `mcp__cloudflare__kv_namespace_list` — list KV namespaces
- `mcp__cloudflare__dns_record_list` — list DNS records
- `mcp__cloudflare__zone_list` — list zones

---

## Deployment Commands (Wrangler)

### Deploy workers
```bash
# Deploy worker (callback engine)
cd apps/worker && npx wrangler deploy

# Deploy pixel-worker
cd apps/pixel-worker && npx wrangler deploy

# Deploy api-worker
cd apps/api-worker && npx wrangler deploy

# Deploy cf-proxy
cd apps/cf-proxy && npx wrangler deploy

# Deploy lander (Astro)
cd apps/lander && npm run build && npx wrangler pages deploy dist
```

### Tail logs (real-time)
```bash
# ดู logs แบบ real-time
npx wrangler tail worker-name --format pretty

# Filter specific logs
npx wrangler tail worker-name --search "error"
```

### Local development
```bash
# Run worker locally
cd apps/worker && npx wrangler dev

# With D1 local binding
npx wrangler dev --local
```

---

## D1 Management

### List databases
ใช้ Cloudflare MCP → `d1_database_list`

### Run migrations
```bash
# Apply migration to production
npx wrangler d1 execute DB --file=migrations/0001_init.sql

# Apply to local (dev)
npx wrangler d1 execute DB --local --file=migrations/0001_init.sql
```

### Query D1 via Wrangler
```bash
# Quick query
npx wrangler d1 execute DB --command="SELECT COUNT(*) FROM lead_callbacks WHERE received_at > datetime('now', '-24 hours')"

# Export table
npx wrangler d1 export DB --output=backup.sql
```

---

## wrangler.toml Reference

### Worker DB bindings
```toml
# apps/worker/wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "lp-factory-worker-db"
database_id = "7d31d941-f863-46f5-99c2-2179de821573"

# apps/api-worker/wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "lp-factory-api-db"
database_id = "<api-worker-db-id>"
```

---

## Common Operations

### ดู worker ที่ deploy อยู่
```
→ ใช้ Cloudflare MCP: worker_list
```

### ตรวจสอบ worker routes
```bash
npx wrangler routes list
```

### Manage Secrets
```bash
# Set secret
npx wrangler secret put API_TOKEN

# List secrets
npx wrangler secret list

# Delete secret
npx wrangler secret delete API_TOKEN
```

### KV Storage
```bash
# Write KV
npx wrangler kv key put --namespace-id=<id> "key" "value"

# Read KV
npx wrangler kv key get --namespace-id=<id> "key"

# List keys
npx wrangler kv key list --namespace-id=<id>
```

---

## DNS / Zone Management (Cloudflare MCP)

### ดู zones ทั้งหมด
```
→ ใช้ Cloudflare MCP: zone_list
```

### ดู DNS records ของ domain
```
→ ใช้ Cloudflare MCP: dns_record_list (zone_id)
```

### เพิ่ม DNS record
```
→ ใช้ Cloudflare MCP: dns_record_create
  type: "CNAME" | "A" | "TXT" | "MX"
  name: "subdomain.domain.com"
  content: "target"
  proxied: true | false
```

---

## Debugging Workflows

### Worker ไม่รับ callback
1. `wrangler tail worker` — ดู real-time logs
2. ตรวจ route config ใน wrangler.toml
3. ตรวจ D1 binding ถูก database ไหม

### D1 migration ไม่ขึ้น
```bash
# ตรวจ migration status
npx wrangler d1 migrations list DB

# Apply pending
npx wrangler d1 migrations apply DB
```

### Worker timeout / error
```bash
# ดู error logs
npx wrangler tail worker-name --format json | grep '"outcome":"exception"'
```

---

## Tips
- Cloudflare MCP ช่วย query D1 และ inspect workers ได้โดยไม่ต้องเปิด browser
- ใช้ `wrangler tail` แบบ real-time ขณะ debug callback
- `--local` flag ทำให้ test D1 queries โดยไม่กระทบ production
- Worker logs เก็บ 24 ชั่วโมงเท่านั้น — ตรวจสอบทันที
