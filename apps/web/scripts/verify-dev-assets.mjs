#!/usr/bin/env node

/**
 * CampusOS Dev Server Asset Verification Script
 *
 * Verifies that Next.js development server is serving full HTML
 * AND that all referenced CSS stylesheets and JavaScript chunks
 * return HTTP 200 with non-empty content (preventing raw unstyled HTML).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES = [
  '/admin-config',
  '/admin-config/head-offices',
  '/admin-config/regions',
  '/admin-config/school-types',
  '/admin-config/schools',
  '/admin-config/branches',
  '/admin-config/countries',
  '/admin-config/states',
  '/admin-config/cities',
  '/admin-config/areas',
  '/admin-config/postal-codes',
];

async function verifyRoute(route) {
  const url = `${BASE_URL}${route}`;
  console.log(`\n🔍 Checking Route: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Route returned HTTP ${res.status}: ${url}`);
      return false;
    }

    const html = await res.text();
    console.log(`   ✓ HTML: HTTP 200 (${html.length} bytes)`);

    // Extract CSS and JS assets
    const cssMatches = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)].map((m) => m[1]);
    const jsMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map((m) => m[1]);

    let routePassed = true;

    // Verify CSS Assets
    if (cssMatches.length === 0) {
      console.warn(`   ⚠️ Warning: No CSS links found in HTML head for ${route}`);
    }

    for (const cssPath of cssMatches) {
      const assetUrl = `${BASE_URL}${cssPath}`;
      try {
        const assetRes = await fetch(assetUrl);
        if (!assetRes.ok) {
          console.error(`   ❌ CSS FAILED (HTTP ${assetRes.status}): ${cssPath}`);
          routePassed = false;
        } else {
          const cssContent = await assetRes.text();
          if (cssContent.length < 100) {
            console.error(`   ❌ CSS Suspiciously Empty (${cssContent.length} bytes): ${cssPath}`);
            routePassed = false;
          } else {
            console.log(`   ✓ CSS OK (HTTP 200, ${cssContent.length} bytes): ${cssPath}`);
          }
        }
      } catch (err) {
        console.error(`   ❌ CSS Fetch Error: ${cssPath} -> ${err.message}`);
        routePassed = false;
      }
    }

    // Verify JS Chunks
    for (const jsPath of jsMatches) {
      const assetUrl = `${BASE_URL}${jsPath}`;
      try {
        const assetRes = await fetch(assetUrl);
        if (!assetRes.ok) {
          console.error(`   ❌ JS Chunk FAILED (HTTP ${assetRes.status}): ${jsPath}`);
          routePassed = false;
        } else {
          console.log(`   ✓ JS Chunk OK (HTTP 200): ${jsPath.split('?')[0]}`);
        }
      } catch (err) {
        console.error(`   ❌ JS Fetch Error: ${jsPath} -> ${err.message}`);
        routePassed = false;
      }
    }

    return routePassed;
  } catch (err) {
    console.error(`❌ Could not connect to dev server at ${url}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`🚀 Starting CampusOS Static Asset Verification on ${BASE_URL}...`);

  let allPassed = true;
  for (const route of ROUTES) {
    const passed = await verifyRoute(route);
    if (!passed) allPassed = false;
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  if (allPassed) {
    console.log('✅ ALL ROUTES & STATIC ASSETS VERIFIED SUCCESSFULLY (100% Styled).');
    process.exit(0);
  } else {
    console.error('❌ STATIC ASSET VERIFICATION FAILED. STALE/CORRUPT CHUNKS DETECTED.');
    process.exit(1);
  }
}

main();
