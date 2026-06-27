import sharp from "sharp";

const representativePoints = [
  // Background areas
  { x: 100, y: 100, name: "bg-dark" },
  { x: 500, y: 300, name: "bg-section" },
  { x: 900, y: 600, name: "bg-card" },
  
  // Accent colors (yellow highlights)
  { x: 400, y: 150, name: "accent-yellow" },
  { x: 350, y: 180, name: "accent-yellow-2" },
  
  // Text colors
  { x: 300, y: 140, name: "text-primary" },
  { x: 300, y: 200, name: "text-secondary" },
  
  // UI elements
  { x: 800, y: 100, name: "button-bg" },
  { x: 200, y: 400, name: "card-bg" },
  { x: 600, y: 500, name: "code-bg" },
  
  // More representative points
  { x: 150, y: 250, name: "feature-bg" },
  { x: 700, y: 350, name: "gradient-start" },
  { x: 450, y: 450, name: "gradient-end" },
  { x: 250, y: 550, name: "stats-bg" },
  { x: 550, y: 650, name: "footer-bg" },
];

async function extractColors() {
  const metadata = await sharp("source.jpeg").metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}\n`);
  
  const results = [];
  
  for (const point of representativePoints) {
    // Clamp coordinates to image bounds
    const x = Math.min(point.x, metadata.width! - 1);
    const y = Math.min(point.y, metadata.height! - 1);
    
    const { data } = await sharp("source.jpeg")
      .extract({ left: x, top: y, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    
    results.push({
      name: point.name,
      x,
      y,
      r,
      g,
      b,
      hex,
    });
    
    console.log(`${point.name}: ${hex} (rgb: ${r}, ${g}, ${b}) at (${x}, ${y})`);
  }
  
  // Get average colors from larger regions
  console.log("\n--- Region averages ---");
  
  const regions = [
    { name: "header-region", left: 0, top: 0, width: 100, height: 50 },
    { name: "hero-region", left: 0, top: 50, width: 200, height: 100 },
    { name: "card-region", left: 100, top: 300, width: 150, height: 100 },
    { name: "code-region", left: 400, top: 400, width: 200, height: 150 },
  ];
  
  for (const region of regions) {
    const left = Math.min(region.left, metadata.width! - 1);
    const top = Math.min(region.top, metadata.height! - 1);
    const width = Math.min(region.width, metadata.width! - left);
    const height = Math.min(region.height, metadata.height! - top);
    
    const { data } = await sharp("source.jpeg")
      .extract({ left, top, width, height })
      .resize(1, 1)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    
    console.log(`${region.name}: ${hex} (rgb: ${r}, ${g}, ${b})`);
  }
}

extractColors().catch(console.error);
