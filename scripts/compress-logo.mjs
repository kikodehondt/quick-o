import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { writeFile } from 'fs/promises'
import path from 'path'

const root = path.resolve(process.cwd())
const inputPng = path.join(root, 'public', 'Quick-O_logo.png')
const outCompressedPng = path.join(root, 'public', 'Quick-O_logo.compressed.png')
const outCompressedWebp = path.join(root, 'public', 'Quick-O_logo.compressed.webp')

async function run() {
  const src = await readFile(inputPng)
  // Aggressive PNG compression
  const pngBuf = await sharp(src)
    .png({ quality: 50, compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  await writeFile(outCompressedPng, pngBuf)

  // Aggressive WebP for runtime usage
  const webpBuf = await sharp(src)
    .webp({ quality: 50 })
    .toBuffer()
  await writeFile(outCompressedWebp, webpBuf)

  console.log('Compressed logo written to:', outCompressedPng)
  console.log('Compressed logo (webp) written to:', outCompressedWebp)
}

run().catch(err => { console.error(err); process.exit(1) })
