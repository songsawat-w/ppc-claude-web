---
name: simplify
description: Review changed code for reuse, quality, and efficiency, then fix any issues found
---

# Simplify: Code Quality Review

## When to Use

After implementing a feature or fix, run `/simplify` to review changed code for:
- Unnecessary duplication (can existing utilities be reused?)
- Over-engineering (is there a simpler way?)
- Performance issues (N+1 queries, unnecessary re-renders, large payloads)
- Dead code or unused imports
- Type safety gaps

## Review Checklist

### Reuse
- [ ] Is there an existing utility/helper that does this already?
- [ ] Can this logic be extracted into a shared function?
- [ ] Are constants defined once or repeated inline?

### Quality
- [ ] Are types accurate and non-`any`?
- [ ] Are error cases handled at system boundaries?
- [ ] Is the code self-documenting (no need for excessive comments)?

### Efficiency
- [ ] No unnecessary API calls or DB queries in loops
- [ ] No redundant state or derived state stored separately
- [ ] Async operations run in parallel where independent

## Protocol

1. `git diff HEAD` — identify what changed
2. Read each changed file
3. Apply checklist above
4. Fix issues directly (don't just report)
5. Confirm: "Simplified — removed X duplications, improved Y"

## Examples

**Before:**
```typescript
const user = await db.users.findOne({ id: userId });
const name = user.first_name + " " + user.last_name;
```

**After:**
```typescript
const user = await db.users.findOne({ id: userId });
const name = getFullName(user); // existing util
```

---

**Before:**
```typescript
for (const id of ids) {
  const item = await db.items.findOne({ id }); // N+1
  results.push(item);
}
```

**After:**
```typescript
const results = await db.items.findMany({ id: { in: ids } });
```

## Scope

Only review code that was **changed in this session**. Do not refactor untouched code.
