import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { writeFile } from 'fs/promises'
import path from 'path'

const root = path.resolve(process.cwd())
const inputPng = path.join(root, 'public', 'Quick-O_logo.png')
const outCompressedPng = path.join(root, 'public', 'Quick-O_logo.compressed.png')
const outCompressedWebp = path.join(root, 'public', 'Quick-O_logo.compressed.webp')
const outCompressed192 = path.join(root, 'public', 'Quick-O_logo.compressed-192.png')
const outCompressed512 = path.join(root, 'public', 'Quick-O_logo.compressed-512.png')

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

  // Sized PNGs for manifest icons
  const png192 = await sharp(src)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 60, compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  await writeFile(outCompressed192, png192)

  const png512 = await sharp(src)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 60, compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  await writeFile(outCompressed512, png512)

  console.log('Compressed logo written to:', outCompressedPng)
  console.log('Compressed logo (webp) written to:', outCompressedWebp)
  console.log('Compressed 192x192 written to:', outCompressed192)
  console.log('Compressed 512x512 written to:', outCompressed512)
}

run().catch(err => { console.error(err); process.exit(1) })
