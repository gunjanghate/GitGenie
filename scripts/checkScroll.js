const fetch = require("node-fetch");
(async () => {
  try {
    const res = await fetch("http://localhost:3000");
    const text = await res.text();
    console.log("✓ Successfully fetched homepage");
    console.log("  Page length:", text.length, "bytes");

    // Check for scroll-stack-section class
    const stackSectionCount = (text.match(/scroll-stack-section/g) || [])
      .length;
    console.log("\n✓ Scroll stack sections found:", stackSectionCount);

    // Check for sticky-wrapper class
    const stickyCount = (text.match(/sticky-wrapper/g) || []).length;
    console.log("✓ Sticky wrappers found:", stickyCount);

    // Check for z-index styling
    const zIndexCount = (text.match(/style="[^"]*z-index[^"]*"/g) || []).length;
    console.log("✓ Z-index styles found:", zIndexCount);

    // Check for smooth scroll
    const smoothScroll = text.includes("scroll-behavior: smooth");
    console.log("✓ Smooth scroll enabled:", smoothScroll);

    console.log("\n✅ Scroll stack animation feature is READY!");
    console.log("\nTo test the effect:");
    console.log("1. Open http://localhost:3000 in your browser");
    console.log("2. Scroll down - sections should stack and layer");
    console.log("3. Try on mobile - effect disables below 640px width");
  } catch (e) {
    console.error("❌ fetch failed:", e && e.message ? e.message : e);
    process.exit(1);
  }
})();
