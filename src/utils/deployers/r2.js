/**
 * Cloudflare R2 Deploy
 * R2 is S3-compatible — uses SigV4 with endpoint https://<accountId>.r2.cloudflarestorage.com
 * Region is always "auto". No ACLs — bucket public access is configured in CF dashboard.
 */

const PROXY_PASS = "https://lp-factory-api.songsawat-w.workers.dev/api/proxy/pass";

async function proxyFetch(url, opts = {}) {
  const proxyUrl = `${PROXY_PASS}?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl, opts);
}

async function hmacSha256(key, msg) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? new TextEncoder().encode(key) : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg)));
}

async function sha256Hex(data) {
  const buf = await crypto.subtle.digest("SHA-256", typeof data === "string" ? new TextEncoder().encode(data) : data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(date) {
  return toAmzDate(date).slice(0, 8);
}

async function signV4(method, url, headers, body, accessKey, secretKey) {
  const region = "auto";
  const service = "s3";
  const parsedUrl = new URL(url);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);

  headers["x-amz-date"] = amzDate;
  headers["x-amz-content-sha256"] = await sha256Hex(body || "");
  headers["host"] = parsedUrl.host;

  const sortedHeaders = Object.keys(headers).sort();
  const signedHeaders = sortedHeaders.map(h => h.toLowerCase()).join(";");
  const canonicalHeaders = sortedHeaders.map(h => `${h.toLowerCase()}:${headers[h].trim()}\n`).join("");
  const canonicalUri = parsedUrl.pathname;
  const canonicalQueryString = parsedUrl.search ? parsedUrl.search.slice(1) : "";

  const canonicalRequest = [
    method, canonicalUri, canonicalQueryString,
    canonicalHeaders, signedHeaders,
    headers["x-amz-content-sha256"],
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256", amzDate, credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate    = await hmacSha256("AWS4" + secretKey, dateStamp);
  const kRegion  = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");

  const signature = Array.from(await hmacSha256(kSigning, stringToSign))
    .map(b => b.toString(16).padStart(2, "0")).join("");

  headers["Authorization"] =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

export async function deploy(html, site, settings) {
  const { r2AccessKey, r2SecretKey, r2AccountId, r2Bucket, r2PublicUrl } = settings;

  if (!r2AccessKey || !r2SecretKey || !r2AccountId || !r2Bucket) {
    return { success: false, error: "Missing R2 credentials. Configure Access Key, Secret Key, Account ID, and Bucket in Settings." };
  }

  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const objectKey = `${site.id || "lp"}/index.html`;
  const r2Url = `${endpoint}/${r2Bucket}/${objectKey}`;

  const body = new TextEncoder().encode(html);

  try {
    const putHeaders = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    };

    const signedHeaders = await signV4("PUT", r2Url, { ...putHeaders }, body, r2AccessKey, r2SecretKey);
    delete signedHeaders["host"];

    const res = await proxyFetch(r2Url, {
      method: "PUT",
      headers: signedHeaders,
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `R2 upload failed (${res.status}): ${errText.slice(0, 200)}` };
    }

    // Public URL: custom domain > public bucket URL > endpoint fallback
    const publicBase = r2PublicUrl
      ? r2PublicUrl.replace(/\/$/, "")
      : `${endpoint}/${r2Bucket}`;

    const url = `${publicBase}/${objectKey}`;

    return {
      success: true,
      url,
      deployId: `r2-${Date.now()}`,
      target: "r2",
      meta: { bucket: r2Bucket, key: objectKey },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
