import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'

mkdirSync('resources', { recursive: true })

const svg = readFileSync('app/icon.svg')

await sharp(svg, { density: 300 })
  .resize(1024, 1024)
  .png()
  .toFile('resources/icon.png')

console.log('Generated resources/icon.png (1024×1024)')
