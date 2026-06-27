import sharp from "sharp";

async function extractHeaderColors() {
  // Extract colors from the header-hero section
  const { data } = await sharp("scripts/crops/01-header-hero.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = 1400;
  const height = 600;
  
  const samples = [
    // Header background
    { x: 700, y: 10, name: "header-bg" },
    
    // Logo
    { x: 95, y: 30, name: "logo-text" },
    
    // Nav links
    { x: 640, y: 30, name: "nav-resources" },
    { x: 745, y: 30, name: "nav-pricing" },
    { x: 820, y: 30, name: "nav-docs" },
    { x: 885, y: 30, name: "nav-discord" },
    { x: 960, y: 30, name: "nav-github" },
    
    // Login button
    { x: 1150, y: 30, name: "login-btn-bg" },
    { x: 1150, y: 32, name: "login-btn-text" },
    
    // Sign Up button
    { x: 1250, y: 30, name: "signup-btn-bg" },
    { x: 1250, y: 32, name: "signup-btn-text" },
    
    // Hero text
    { x: 350, y: 340, name: "hero-heading" },
    { x: 350, y: 380, name: "hero-subheading" },
    
    // CTA buttons
    { x: 1090, y: 400, name: "cta-free-bg" },
    { x: 1090, y: 402, name: "cta-free-text" },
    { x: 1220, y: 400, name: "cta-github-bg" },
    { x: 1220, y: 402, name: "cta-github-text" },
    
    // Background network visualization
    { x: 400, y: 500, name: "network-square-1" },
    { x: 420, y: 520, name: "network-line" },
    { x: 400, y: 540, name: "network-yellow-1" },
    { x: 880, y: 540, name: "network-yellow-2" },
    
    // Background color
    { x: 700, y: 200, name: "bg-main" },
  ];
  
  for (const point of samples) {
    const idx = (point.y * width + point.x) * 3;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    
    console.log(`${point.name}: ${hex} (rgb: ${r}, ${g}, ${b})`);
  }
}

extractHeaderColors().catch(console.error);
