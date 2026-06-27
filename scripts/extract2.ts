import sharp from "sharp";

async function extractMoreColors() {
  const metadata = await sharp("source.jpeg").metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  
  console.log(`Image: ${width}x${height}\n`);
  
  // Sample at different Y positions to find content areas
  const samplePoints = [
    // Header area (top 100px)
    { x: 70, y: 30, name: "logo-area" },
    { x: 300, y: 30, name: "nav-text" },
    { x: 600, y: 30, name: "nav-link" },
    { x: 900, y: 30, name: "sign-in-btn" },
    
    // Hero area (100-400px)
    { x: 200, y: 150, name: "hero-heading" },
    { x: 200, y: 200, name: "hero-subheading" },
    { x: 200, y: 250, name: "hero-text" },
    { x: 300, y: 300, name: "hero-cta-primary" },
    { x: 450, y: 300, name: "hero-cta-secondary" },
    
    // Stats area (400-600px)
    { x: 150, y: 500, name: "stat-number" },
    { x: 150, y: 520, name: "stat-label" },
    
    // Yellow accent areas
    { x: 250, y: 180, name: "yellow-highlight" },
    { x: 350, y: 180, name: "yellow-highlight-2" },
    
    // Card areas (800-2000px)
    { x: 200, y: 900, name: "card-title" },
    { x: 200, y: 950, name: "card-description" },
    { x: 500, y: 900, name: "card-code" },
    
    // Code editor areas
    { x: 600, y: 1200, name: "code-editor-bg" },
    { x: 620, y: 1220, name: "code-line" },
    
    // Gateway section
    { x: 400, y: 3000, name: "gateway-bg" },
    { x: 400, y: 3100, name: "gateway-text" },
    
    // Footer
    { x: 400, y: 11500, name: "footer-text" },
    { x: 400, y: 11800, name: "footer-bg" },
  ];
  
  for (const point of samplePoints) {
    const x = Math.min(point.x, width - 1);
    const y = Math.min(point.y, height - 1);
    
    const { data } = await sharp("source.jpeg")
      .extract({ left: x, top: y, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    
    console.log(`${point.name}: ${hex} (rgb: ${r}, ${g}, ${b}) at (${x}, ${y})`);
  }
  
  // Sample yellow accent regions more precisely
  console.log("\n--- Yellow accent samples ---");
  const yellowSamples = [
    { x: 180, y: 175, name: "yellow-1" },
    { x: 200, y: 175, name: "yellow-2" },
    { x: 220, y: 175, name: "yellow-3" },
    { x: 240, y: 175, name: "yellow-4" },
    { x: 260, y: 175, name: "yellow-5" },
  ];
  
  for (const point of yellowSamples) {
    const x = Math.min(point.x, width - 1);
    const y = Math.min(point.y, height - 1);
    
    const { data } = await sharp("source.jpeg")
      .extract({ left: x, top: y, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    
    console.log(`${point.name}: ${hex} (rgb: ${r}, ${g}, ${b})`);
  }
}

extractMoreColors().catch(console.error);
