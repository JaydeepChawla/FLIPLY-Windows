/**
 * Pure Node.js PNG icon generator (No external dependencies)
 * Generates valid PNG and ICO files for FLIPLY desktop packaging
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  // Each scanline starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crcTarget = buf.subarray(4, 8 + len);
  const crc = crc32(crcTarget);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Pixel drawing function for FLIPLY split-flap icon
function renderFliplyIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Outer Squircle Background
  const cx = 0.5;
  const cy = 0.5;
  const dx = Math.abs(nx - cx);
  const dy = Math.abs(ny - cy);
  const dist = Math.pow(dx, 4) + Math.pow(dy, 4);

  if (dist > 0.05) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Divider slit across center
  if (Math.abs(ny - 0.5) < 0.018) {
    return [7, 7, 9, 255];
  }

  // Card bounds
  const insideCard = nx >= 0.2 && nx <= 0.8 && ny >= 0.22 && ny <= 0.78;

  if (insideCard) {
    // Stylized 'F' pattern
    // Vertical stem of F
    const isStem = nx >= 0.35 && nx <= 0.44 && ny >= 0.32 && ny <= 0.68;
    // Top bar of F
    const isTopBar = nx >= 0.35 && nx <= 0.68 && ny >= 0.32 && ny <= 0.41;
    // Middle bar of F
    const isMidBar = nx >= 0.35 && nx <= 0.60 && ny >= 0.53 && ny <= 0.60;

    if (isStem || isTopBar || isMidBar) {
      return [245, 245, 247, 255]; // Crisp white-silver
    }

    // Card background
    if (ny < 0.5) {
      // Top half of split-flap card
      const grad = Math.floor(34 - ny * 20);
      return [grad, grad + 2, grad + 6, 255];
    } else {
      // Bottom half of split-flap card
      const grad = Math.floor(22 + (ny - 0.5) * 15);
      return [grad, grad + 2, grad + 5, 255];
    }
  }

  // Squircle dark container
  return [14, 15, 18, 255];
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generate 32x32 for Tray
const png32 = createPng(32, 32, renderFliplyIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-32.png'), png32);

// Generate 512x512 for Window / App
const png512 = createPng(512, 512, renderFliplyIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);

// Create valid basic .ICO header wrapping PNG
// ICO format: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG image data
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Image type (1 = Icon)
icoHeader.writeUInt16LE(1, 4); // Number of images (1)

// Directory entry
icoHeader[6] = 0; // 256 or 0 for 256/512
icoHeader[7] = 0; // Height
icoHeader[8] = 0; // Color count
icoHeader[9] = 0; // Reserved
icoHeader.writeUInt16LE(1, 10); // Color planes
icoHeader.writeUInt16LE(32, 12); // Bits per pixel
icoHeader.writeUInt32LE(png512.length, 14); // Size of image data
icoHeader.writeUInt32LE(22, 18); // Offset to image data

const icoFile = Buffer.concat([icoHeader, png512]);
fs.writeFileSync(path.join(iconsDir, 'icon-512.ico'), icoFile);

console.log('Successfully generated icon-32.png, icon-512.png, and icon-512.ico in public/icons/');
