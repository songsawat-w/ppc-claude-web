/**
 * Pet Care Loans Template Generator
 * Pet care financing landing page with hero form, trust badges, and features
 * Based on PDL V3 architecture with pet-care-specific content and styling
 */

import { COLORS, FONTS } from '../../core/template-registry.js';

export function generate(site) {
  const c = COLORS.find(x => x.id === site.colorId) || COLORS[2]; // Default: Forest Green
  const f = FONTS.find(x => x.id === site.fontId) || FONTS[0];
  const brand = site.brand || "PetCareFund";
  const domain = site.domain || "petcarefund.com";

  // Pet-care-specific defaults
  const h1 = site.h1 || "Affordable Financing for Your Pet's Care";
  const sub = site.sub || "Don't let cost stand between your pet and the care they deserve. Quick approval, flexible plans.";
  const cta = site.cta || "Check My Options";
  const badge = site.badge || "Trusted by 10,000+ pet owners";
  const loanLabel = site.loanLabel || "Pet Care Financing";
  const amountMin = site.amountMin || 200;
  const amountMax = site.amountMax || 10000;
  const aprMin = site.aprMin || 5.99;
  const aprMax = site.aprMax || 35.99;
  const email = site.email || `support@${domain}`;

  // Tracking configs from Wizard Step 5
  const aid = site.aid || "14881";
  const network = site.network || "LeadsGate";
  const redirectUrl = site.redirectUrl || "#";
  const voluumId = site.voluumId || "";
  const voluumDomain = site.voluumDomain || "";
  const conversionId = site.conversionId || "";
  const formStartLabel = site.formStartLabel || "Form Start";
  const formSubmitLabel = site.formSubmitLabel || "Form Submit";

  const files = {};

  // ─── package.json ────────────────────────────────
  files["package.json"] = JSON.stringify({
    name: brand.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-pet-care-loans",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "astro dev",
      build: "astro build",
      preview: "astro preview"
    },
    dependencies: {
      astro: "^5.2.0"
    }
  }, null, 2);

  // ─── astro.config.mjs ─────────────────────────────
  files["astro.config.mjs"] = `import { defineConfig } from "astro/config";
export default defineConfig({
  output: "static",
  site: "https://${domain}",
  build: {
    assets: '_assets',
  },
});`;

  // ─── src/pages/index.astro ─────────────────────────
  files["src/pages/index.astro"] = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brand} — ${loanLabel}</title>
  <meta name="description" content="${sub}" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${f.import}&display=swap" rel="stylesheet">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${f.family}, system-ui, sans-serif;
      line-height: 1.6;
      color: hsl(${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}%);
      background: hsl(${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}%);
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }

    /* Header */
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: white;
      border-bottom: 1px solid hsl(${c.p[0]} ${c.p[1]}% 90%);
      padding: 16px 0;
    }
    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: hsl(${c.p[0]} ${c.p[1]}% ${c.p[2]}%);
      text-decoration: none;
    }
    .logo-icon { margin-right: 6px; }
    .nav-cta {
      background: hsl(${c.p[0]} ${c.p[1]}% ${c.p[2]}%);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .nav-cta:hover { opacity: 0.9; }

    /* Hero */
    .hero {
      padding: 80px 20px;
      background: linear-gradient(135deg, hsl(${c.p[0]} ${c.p[1]}% ${c.p[2]}%) 0%, hsl(${c.s[0]} ${c.s[1]}% ${c.s[2]}%) 100%);
      color: white;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
      backdrop-filter: blur(4px);
    }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 16px;
    }
    .hero .subtitle {
      font-size: clamp(1rem, 2vw, 1.2rem);
      opacity: 0.92;
      max-width: 600px;
      margin: 0 auto 32px;
    }

    /* Lead Form */
    .lead-form {
      max-width: 420px;
      margin: 0 auto;
      background: white;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
      text-align: left;
    }
    .form-title {
      font-size: 16px;
      font-weight: 700;
      color: hsl(${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}%);
      margin-bottom: 16px;
    }
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      margin-bottom: 4px;
    }
    .form-input {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 15px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-input:focus {
      outline: none;
      border-color: hsl(${c.p[0]} ${c.p[1]}% ${c.p[2]}%);
    }
    .form-submit {
      width: 100%;
      padding: 14px;
      background: hsl(${c.a[0]} ${c.a[1]}% ${c.a[2]}%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .form-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }
    .form-secure {
      text-align: center;
      font-size: 12px;
      color: #888;
      margin-top: 12px;
    }

    /* Features */
    .features {
      padding: 80px 20px;
      background: white;
    }
    .section-title {
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 12px;
    }
    .section-subtitle {
      text-align: center;
      color: #666;
      font-size: 16px;
      margin-bottom: 48px;
      max-width: 550px;
      margin-left: auto;
      margin-right: auto;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 28px;
    }
    .feature-card {
      background: hsl(${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}%);
      padding: 28px;
      border-radius: 14px;
      text-align: center;
      transition: transform 0.2s;
    }
    .feature-card:hover { transform: translateY(-4px); }
    .feature-icon { font-size: 36px; margin-bottom: 14px; }
    .feature-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
    .feature-desc { color: #666; font-size: 14px; line-height: 1.5; }

    /* Trust Badges */
    .trust {
      padding: 60px 20px;
      background: hsl(${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}%);
    }
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      text-align: center;
    }
    .trust-item { padding: 20px; }
    .trust-number {
      font-size: 32px;
      font-weight: 800;
      color: hsl(${c.p[0]} ${c.p[1]}% ${c.p[2]}%);
    }
    .trust-label { font-size: 14px; color: #666; margin-top: 4px; }

    /* Footer */
    .footer {
      padding: 40px 20px;
      background: hsl(${c.fg[0]} ${c.fg[1]}% 15%);
      color: rgba(255,255,255,0.7);
      text-align: center;
      font-size: 13px;
    }
    .footer a { color: rgba(255,255,255,0.9); text-decoration: underline; }
    .disclaimer {
      max-width: 700px;
      margin: 16px auto 0;
      font-size: 11px;
      line-height: 1.6;
      color: rgba(255,255,255,0.5);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .hero { padding: 48px 16px; }
      .lead-form { padding: 20px; }
      .features { padding: 48px 16px; }
      .trust { padding: 40px 16px; }
    }
  </style>

  <!-- GTM dataLayer -->
  <script>
    window.dataLayer = window.dataLayer || [];
  </script>

  <!-- Tracking Config -->
  <script>
    window.aid = "${aid}";
    window.network = "${network}";
    window.conversionId = "${conversionId}";
    window.formStartLabel = "${formStartLabel}";
    window.formSubmitLabel = "${formSubmitLabel}";
    window.redirectUrl = "${redirectUrl}";
  </script>

  ${voluumId ? `
  <!-- Voluum Tracking Script -->
  <script>
    (function(w,d,s,l,i){
      w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://${voluumDomain || voluumId + ".trck.pch"}/webp/e.js?v='+i;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${voluumId}');
  </script>` : ''}
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="container header-inner">
      <a href="/" class="logo"><span class="logo-icon">🐾</span>${brand}</a>
      <a href="#apply" class="nav-cta">${cta}</a>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      ${badge ? `<div class="hero-badge">🐾 ${badge}</div>` : ''}
      <h1>${h1}</h1>
      <p class="subtitle">${sub}</p>

      <!-- Lead Form -->
      <form class="lead-form" id="leadForm" onsubmit="handleFormSubmit(event)">
        <div class="form-title">Get your personalized rate — no impact on credit score</div>
        <div class="form-group">
          <label class="form-label">Desired Amount</label>
          <select class="form-input" name="amount" required>
            <option value="">Select amount...</option>
            <option value="${amountMin}">$${amountMin} - $500</option>
            <option value="1000">$500 - $1,000</option>
            <option value="2500">$1,000 - $2,500</option>
            <option value="5000">$2,500 - $5,000</option>
            ${amountMax > 5000 ? `<option value="${amountMax}">$5,000 - $${amountMax.toLocaleString()}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" name="email" placeholder="you@email.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">ZIP Code</label>
          <input type="text" class="form-input" name="zip" placeholder="12345" pattern="[0-9]{5}" maxlength="5" required />
        </div>
        <button type="submit" class="form-submit">${cta} →</button>
        <div class="form-secure">🔒 Secure · 256-bit encryption · No obligation</div>
      </form>
    </div>
  </section>

  <!-- Trust Numbers -->
  <section class="trust" id="trust">
    <div class="container">
      <div class="trust-grid">
        <div class="trust-item">
          <div class="trust-number">$${amountMin}–$${amountMax.toLocaleString()}</div>
          <div class="trust-label">Financing Range</div>
        </div>
        <div class="trust-item">
          <div class="trust-number">${aprMin}%–${aprMax}%</div>
          <div class="trust-label">APR Range</div>
        </div>
        <div class="trust-item">
          <div class="trust-number">2 min</div>
          <div class="trust-label">Application Time</div>
        </div>
        <div class="trust-item">
          <div class="trust-number">10k+</div>
          <div class="trust-label">Happy Pet Owners</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="features">
    <div class="container">
      <div class="section-title">Why Pet Owners Choose ${brand}</div>
      <div class="section-subtitle">Flexible financing designed around your pet's needs and your budget</div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏥</div>
          <div class="feature-title">Vet Bills & Surgery</div>
          <div class="feature-desc">Cover unexpected vet visits, surgeries, and emergency care without delay.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <div class="feature-title">Fast Approval</div>
          <div class="feature-desc">Get a decision in minutes with a simple online application. No hard credit pull.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📅</div>
          <div class="feature-title">Flexible Payments</div>
          <div class="feature-desc">Choose a repayment plan that fits your monthly budget. 3 to 24 month terms.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <div class="feature-title">No Hidden Fees</div>
          <div class="feature-desc">Transparent rates and terms. What you see is what you get — no surprises.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved. | <a href="mailto:${email}">${email}</a></p>
      <div class="disclaimer">
        ${brand} is not a lender. APR ranges from ${aprMin}% to ${aprMax}%. Loan amounts from $${amountMin} to $${amountMax.toLocaleString()}.
        Actual rate depends on credit score, loan amount, loan term, and credit usage and history.
        Not all applicants will qualify for the lowest rate.
        This is not an offer to lend. See terms for details.
      </div>
    </div>
  </footer>

  <!-- Form & Tracking Script -->
  <script>
    function handleFormSubmit(e) {
      e.preventDefault();

      var form = e.target;
      var email = form.email.value;
      var zip = form.zip.value;
      var amount = form.amount.value;

      // Tracking: Form Start Event
      if (window.dataLayer) {
        window.dataLayer.push({
          event: window.formStartLabel || 'form_start',
          conversion_id: window.conversionId,
          aid: window.aid,
          network: window.network,
          email: email,
          zip: zip,
          amount: amount
        });
      }

      // Tracking: Conversion Event
      if (window.dataLayer) {
        window.dataLayer.push({
          event: window.formSubmitLabel || 'generate_lead',
          conversion_id: window.conversionId,
          aid: window.aid,
          network: window.network,
          email: email,
          zip: zip,
          amount: amount
        });
      }

      // Show success message
      form.innerHTML = '<div style="text-align:center;padding:32px;"><div style="font-size:48px;margin-bottom:12px;">🐾</div><div style="color:#22c55e;font-size:20px;font-weight:700;">You\\'re All Set!</div><div style="color:#666;font-size:14px;margin-top:8px;">Redirecting to your options...</div></div>';

      // Redirect after delay
      setTimeout(function() {
        window.location.href = window.redirectUrl;
      }, 1500);
    }

    // Track page view
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page: '${brand}',
        aid: window.aid,
        network: window.network
      });
    }
  </script>
</body>
</html>`;

  // ─── public/robots.txt ─────────────────────────────
  files["public/robots.txt"] = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml`;

  // ─── README.md ─────────────────────────────────────
  files["README.md"] = `# ${brand} — ${loanLabel}

Pet care financing landing page with lead form, trust badges, and features grid.

## Features

- **Pet-Care Focused**: Content tailored for veterinary financing
- **Lead Form**: Amount selector, email, ZIP code with validation
- **Trust Section**: Financing range, APR, approval time stats
- **Full Tracking**: LeadsGate AID, Voluum, GTM dataLayer support
- **Responsive**: Mobile-first design, works on all devices
- **Zero JS Framework**: Pure HTML/CSS/JS for maximum performance

## Configuration

- **Brand**: ${brand}
- **Domain**: ${domain}
- **Color**: ${c.name}
- **Font**: ${f.name}
- **Tracking**:
  - AID: ${aid}
  - Network: ${network}
  - Redirect: ${redirectUrl || "(set in Wizard)"}
  - Voluum: ${voluumId || "(optional)"}

## Deploy

\`\`\`bash
npm install
npm run build
# Upload dist/ folder to your host
\`\`\`
`;

  return files;
}
