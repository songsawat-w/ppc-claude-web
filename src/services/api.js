const API_BASE = window.__LP_API__ || "https://lp-factory-api.songsawat-w.workers.dev/api";

async function request(path, opts = {}, timeoutMs = 8000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const r = await fetch(`${API_BASE}${path}`, { ...opts, signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) {
            const text = await r.text().catch(() => '');
            return { error: `HTTP ${r.status}`, detail: text };
        }
        return r.json();
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

export const api = {
    get: (path) => request(path),
    post: (path, data) => request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    del: (path) => request(path, { method: "DELETE" }),
    patch: (path, data) => request(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    delBody: (path, data) => request(path, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
};
