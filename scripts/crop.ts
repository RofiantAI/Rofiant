import sharp from "sharp";

async function cropSections() {
  const metadata = await sharp("source.jpeg").metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  
  console.log(`Image: ${width}x${height}\n`);
  
  // Define sections based on typical landing page structure
  const sections = [
    { name: "01-header-hero", top: 0, height: 600 },
    { name: "02-stats-logos", top: 600, height: 400 },
    { name: "03-unify-section", top: 1000, height: 1200 },
    { name: "04-deploy-section", top: 2200, height: 1500 },
    { name: "05-protect-section", top: 3700, height: 1500 },
    { name: "06-scale-section", top: 5200, height: 1500 },
    { name: "07-monitor-section", top: 6700, height: 1500 },
    { name: "08-developer-section", top: 8200, height: 1500 },
    { name: "09-footer-cta", top: 9700, height: 2207 },
  ];
  
  for (const section of sections) {
    const sectionHeight = Math.min(section.height, height - section.top);
    if (sectionHeight <= 0) continue;
    
    await sharp("source.jpeg")
      .extract({ left: 0, top: section.top, width, height: sectionHeight })
      .toFile(`scripts/crops/${section.name}.png`);
    
    console.log(`Created: scripts/crops/${section.name}.png (${width}x${sectionHeight})`);
  }
  
  // Also create a smaller version for easier analysis
  await sharp("source.jpeg")
    .resize(700)
    .toFile("scripts/crops/source-small.png");
  
  console.log("\nCreated: scripts/crops/source-small.png (resized to 700px width)");
}

cropSections().catch(console.error);
