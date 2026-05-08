import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'

const svg = readFileSync('app/icon.svg')
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]

mkdirSync('resources/icons', { recursive: true })

for (const size of sizes) {
  const outPath = `resources/icons/${size}x${size}.png`
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(outPath)
  console.log(`Generated ${outPath}`)
}
