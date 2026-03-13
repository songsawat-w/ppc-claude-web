---
name: lp-qa
description: "Visual QA for landing pages using Browser MCP. Screenshot, mobile viewport check, compliance text verification, pixel fire testing, form submission flow. Use before deploying or after changes to landing pages."
---

# Landing Page QA (Browser MCP)

Visual QA ของ landing pages โดยใช้ Browser MCP — ตรวจก่อน deploy ทุกครั้ง

## MCP Tool ที่ใช้

**Browser MCP** — tools หลัก:
- `mcp__browser__navigate` — เปิด URL
- `mcp__browser__screenshot` — capture screenshot
- `mcp__browser__get_console_logs` — ดู console logs
- `mcp__browser__evaluate` — run JavaScript
- `mcp__browser__click` — click element
- `mcp__browser__get_network_logs` — ดู network requests

---

## QA Checklist

### 1. Visual Check (Desktop + Mobile)

```
Desktop: 1280×800
Mobile: 375×812 (iPhone 14)
```

**ตรวจ:**
- [ ] Hero section โหลดครบ ไม่มี broken images
- [ ] CTA button มองเห็นชัด อยู่ above the fold บน mobile
- [ ] ไม่มี overflow horizontal
- [ ] Font โหลดครบ ไม่มี FOUT
- [ ] สี theme ถูกต้องตาม color_id
- [ ] Logo / brand name แสดงถูกต้อง

### 2. Compliance Check (Loan Products)

**ต้องมีทุก LP:**
- [ ] APR range แสดงชัดเจน (เช่น "5.99% - 35.99% APR")
- [ ] Loan amount range (เช่น "$100 - $5,000")
- [ ] Disclaimer text ครบถ้วน
- [ ] ไม่มี PII collection (ชื่อ, เลข SSN, บัตรเครดิต)
- [ ] LeadsGate form อยู่ใน iframe (ไม่ใช่ direct form)
- [ ] Privacy Policy link ใช้งานได้

### 3. Pixel Verification

ตรวจว่า tracking pixel fire ถูกต้อง:

```javascript
// ใช้ Browser MCP → evaluate:
// ตรวจ pixel events ที่ queue
window._pixelEvents || 'no pixel events'

// ตรวจ sessionStorage
Object.keys(sessionStorage).filter(k => k.includes('pixel') || k.includes('session'))
```

### 4. Network Check

ดู network requests ผ่าน Browser MCP:
- [ ] ไม่มี request ไป GTM/GA4 (privacy-safe)
- [ ] Pixel beacon ส่งไป `t.{domain}/e` หรือ `pixel-worker`
- [ ] Voluum click URL load ได้
- [ ] ไม่มี mixed content (HTTP บน HTTPS page)

### 5. Performance Spot Check

```javascript
// ใช้ Browser MCP → evaluate:
JSON.stringify({
  domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
  loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
  resources: performance.getEntriesByType('resource').length
})
```

Target: DOMContentLoaded < 1000ms, Load < 2500ms

---

## QA Workflow

### Pre-deploy QA (สำหรับ LP ใหม่)

```
Step 1: เปิด LP ด้วย Browser MCP → navigate
        URL: https://staging.domain.com หรือ localhost preview

Step 2: Screenshot desktop
        → screenshot (viewport 1280×800)

Step 3: Screenshot mobile
        → evaluate: window.innerWidth = 375
        → screenshot (viewport 375×812)

Step 4: ตรวจ console logs
        → get_console_logs (filter: error, warning)

Step 5: ตรวจ network requests
        → get_network_logs (ดู beacon, pixel calls)

Step 6: Click CTA button
        → click (#cta-button หรือ .cta-primary)
        → screenshot (ดู LeadsGate form โหลด)

Step 7: ตรวจ compliance text
        → evaluate: document.querySelector('.disclaimer')?.textContent
```

### Quick Visual Check (หลัง hotfix)

```
Step 1: navigate → screenshot desktop → screenshot mobile
Step 2: get_console_logs (errors only)
Step 3: Done ✓
```

---

## Common Issues

### Image ไม่โหลด
```javascript
// ใช้ Browser MCP → evaluate:
Array.from(document.images)
  .filter(img => !img.complete || img.naturalHeight === 0)
  .map(img => img.src)
```

### Font ไม่โหลด
```javascript
document.fonts.ready.then(() => {
  return Array.from(document.fonts).map(f => `${f.family}: ${f.status}`)
})
```

### Form ใน iframe ไม่ขึ้น
```javascript
// ตรวจว่า iframe โหลดครบ
Array.from(document.querySelectorAll('iframe')).map(f => ({
  src: f.src,
  loaded: f.contentDocument?.readyState
}))
```

### Pixel ไม่ fire
```javascript
// ตรวจ sendBeacon calls
// ดูจาก Network logs → filter "t." หรือ "/e"
```

---

## Viewport Sizes Reference

| Device | Width | Height | Use Case |
|--------|-------|--------|----------|
| Mobile S | 375 | 812 | iPhone 14 — primary target |
| Mobile M | 390 | 844 | iPhone 14 Pro |
| Tablet | 768 | 1024 | iPad |
| Desktop | 1280 | 800 | Standard desktop |
| Desktop L | 1440 | 900 | Large monitor |

---

## Tips
- ทำ QA บน staging URL ก่อน push production เสมอ
- Screenshot เก็บไว้เปรียบเทียบก่อน/หลัง เปลี่ยนแปลง
- ดู console errors ก่อน — มักบอกปัญหาได้ทันที
- ใช้ Browser MCP ทำ QA ได้โดยไม่ต้องเปิด browser จริง
- Lighthouse score ตรวจแยก (ใช้ wrangler pages deployment metrics)
