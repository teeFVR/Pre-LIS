import React from 'react';

const Code39Map = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
  '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
};

export default function Barcode({ value, height = 40, showText = true, scale = 1 }) {
  if (!value) return null;
  const cleanVal = String(value).toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%\*]/g, '-');
  const codeToEncode = `*${cleanVal}*`;
  
  // Calculate bars
  // A narrow element (0) is 1 unit.
  // A wide element (1) is 3 units.
  // Inter-character gap is 1 unit (narrow space).
  const NARROW_WIDTH = 1;
  const WIDE_WIDTH = 2.5;
  const GAP_WIDTH = 1;
  
  let currentX = 0;
  const rects = [];
  
  for (let i = 0; i < codeToEncode.length; i++) {
    const char = codeToEncode[i];
    const pattern = Code39Map[char];
    if (!pattern) continue;
    
    // Draw 9 elements of the character
    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const elementWidth = isWide ? WIDE_WIDTH : NARROW_WIDTH;
      
      if (isBar) {
        rects.push(
          <rect
            key={`bar-${i}-${j}`}
            x={currentX}
            y={0}
            width={elementWidth}
            height={height}
          />
        );
      }
      currentX += elementWidth;
    }
    
    // Draw inter-character gap (always space, width = 1)
    if (i < codeToEncode.length - 1) {
      currentX += GAP_WIDTH;
    }
  }
  
  const totalWidth = currentX;
  const paddingX = 8;
  const svgWidth = (totalWidth + paddingX * 2) * scale;
  const svgHeight = (height + (showText ? 18 : 0)) * scale;
  
  return (
    <div className="barcode-wrapper" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`-${paddingX} 0 ${totalWidth + paddingX * 2} ${height + (showText ? 18 : 0)}`}
        style={{ color: 'var(--text-primary)', fill: 'currentColor' }}
      >
        <g>
          {rects}
        </g>
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 14}
            textAnchor="middle"
            fontSize="8"
            fontFamily="monospace"
            fill="var(--text-secondary)"
            letterSpacing="1"
          >
            {cleanVal}
          </text>
        )}
      </svg>
    </div>
  );
}
