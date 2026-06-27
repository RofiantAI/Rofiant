import sharp from "sharp";

async function recropSections() {
  const metadata = await sharp("source.jpeg").metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  
  console.log(`Image: ${width}x${height}\n`);
  
  // Define sections based on actual content visible in screenshots
  const sections = [
    // Header is sticky, so we'll handle it separately
    { name: "section-01-hero", top: 0, height: 700 },
    { name: "section-02-unify", top: 700, height: 1400 },
    { name: "section-03-deploy", top: 2100, height: 2000 },
    { name: "section-04-protect", top: 4100, height: 1500 },
    { name: "section-05-scale", top: 5600, height: 1500 },
    { name: "section-06-monitor", top: 7100, height: 1500 },
    { name: "section-07-developer", top: 8600, height: 1500 },
    { name: "section-08-footer", top: 10100, height: 1807 },
  ];
  
  for (const section of sections) {
    const sectionHeight = Math.min(section.height, height - section.top);
    if (sectionHeight <= 0) continue;
    
    await sharp("source.jpeg")
      .extract({ left: 0, top: section.top, width, height: sectionHeight })
      .toFile(`scripts/crops/${section.name}.png`);
    
    console.log(`Created: scripts/crops/${section.name}.png (${width}x${sectionHeight})`);
  }
}

recropSections().catch(console.error);
