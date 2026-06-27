import sharp from "sharp";

async function findBrightAreas() {
  const metadata = await sharp("source.jpeg").metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  
  console.log(`Image: ${width}x${height}\n`);
  
  // Find the brightest pixels in different horizontal bands
  const bands = [
    { name: "band-0-500", startY: 0, endY: 500 },
    { name: "band-500-1000", startY: 500, endY: 1000 },
    { name: "band-1000-1500", startY: 1000, endY: 1500 },
    { name: "band-1500-2000", startY: 1500, endY: 2000 },
    { name: "band-2000-3000", startY: 2000, endY: 3000 },
    { name: "band-3000-4000", startY: 3000, endY: 4000 },
  ];
  
  for (const band of bands) {
    const bandHeight = Math.min(band.endY - band.startY, height - band.startY);
    if (bandHeight <= 0) continue;
    
    // Extract the band and find max brightness
    const { data } = await sharp("source.jpeg")
      .extract({ left: 0, top: band.startY, width, height: bandHeight })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    let maxBrightness = 0;
    let maxPixel = { x: 0, y: 0, r: 0, g: 0, b: 0 };
    
    // Sample every 10th pixel for speed
    for (let y = 0; y < bandHeight; y += 5) {
      for (let x = 0; x < width; x += 5) {
        const idx = (y * width + x) * 3;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          maxPixel = { x, y: y + band.startY, r, g, b };
        }
      }
    }
    
    const hex = `#${maxPixel.r.toString(16).padStart(2, "0")}${maxPixel.g.toString(16).padStart(2, "0")}${maxPixel.b.toString(16).padStart(2, "0")}`;
    console.log(`${band.name}: brightest=${hex} (rgb: ${maxPixel.r}, ${maxPixel.g}, ${maxPixel.b}) at (${maxPixel.x}, ${maxPixel.y})`);
  }
  
  // Now sample specific points where I expect yellow/white text
  console.log("\n--- Text and accent samples ---");
  const textSamples = [
    // Hero section - should have white text
    { x: 700, y: 180, name: "hero-center" },
    { x: 700, y: 220, name: "hero-center-2" },
    { x: 700, y: 260, name: "hero-center-3" },
    
    // Try different x positions for hero text
    { x: 350, y: 180, name: "hero-left" },
    { x: 1050, y: 180, name: "hero-right" },
    
    // Navigation
    { x: 700, y: 35, name: "nav-center" },
    
    // Try to find yellow by scanning a small area
    { x: 400, y: 170, name: "scan-1" },
    { x: 450, y: 170, name: "scan-2" },
    { x: 500, y: 170, name: "scan-3" },
    { x: 550, y: 170, name: "scan-4" },
    { x: 600, y: 170, name: "scan-5" },
  ];
  
  for (const point of textSamples) {
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

findBrightAreas().catch(console.error);
