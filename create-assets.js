const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Função para gerar um PNG válido sem dependências externas
function createPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type 6: RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw pixel data with filter type 0 at start of each scanline
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData.writeUInt8(0, rowOffset); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData.writeUInt8(r, pxOffset);
      rawData.writeUInt8(g, pxOffset + 1);
      rawData.writeUInt8(b, pxOffset + 2);
      rawData.writeUInt8(a, pxOffset + 3);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcValue = crc32(crcData);
  buffer.writeUInt32BE(crcValue, 8 + length);
  return buffer;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Criar ícones elegantes em tons de azul/índigo (#4F46E5 -> rgb(79, 70, 229))
const iconBuffer = createPng(512, 512, 79, 70, 229);
const adaptiveIconBuffer = createPng(512, 512, 79, 70, 229);
const splashBuffer = createPng(1024, 1024, 18, 20, 24); // Dark background #121418
const faviconBuffer = createPng(48, 48, 79, 70, 229);

fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIconBuffer);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashBuffer);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuffer);

console.log('✅ Assets gerados com sucesso na pasta assets/!');
