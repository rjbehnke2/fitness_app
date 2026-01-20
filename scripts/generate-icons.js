const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Create a simple fitness icon - dumbbell shape on blue background
async function generateIcon(size) {
  // Create SVG with a dumbbell icon
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#1e40af"/>
      <g transform="translate(${size * 0.15}, ${size * 0.35})">
        <!-- Dumbbell icon -->
        <rect x="0" y="${size * 0.08}" width="${size * 0.12}" height="${size * 0.14}" rx="${size * 0.02}" fill="white"/>
        <rect x="${size * 0.58}" y="${size * 0.08}" width="${size * 0.12}" height="${size * 0.14}" rx="${size * 0.02}" fill="white"/>
        <rect x="${size * 0.12}" y="${size * 0.11}" width="${size * 0.46}" height="${size * 0.08}" rx="${size * 0.01}" fill="white"/>
        <!-- Small weights on ends -->
        <rect x="${size * 0.03}" y="${size * 0.04}" width="${size * 0.06}" height="${size * 0.22}" rx="${size * 0.015}" fill="white"/>
        <rect x="${size * 0.61}" y="${size * 0.04}" width="${size * 0.06}" height="${size * 0.22}" rx="${size * 0.015}" fill="white"/>
      </g>
      <text x="${size / 2}" y="${size * 0.78}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" fill="white" text-anchor="middle">FIT</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

  console.log(`Generated icon-${size}x${size}.png`);
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate all icon sizes
  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('All icons generated successfully!');
}

main().catch(console.error);
