const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.25);
    ctx.lineTo(size * 0.8, size * 0.25);
    ctx.lineTo(size * 0.8, size * 0.75);
    ctx.lineTo(size * 0.2, size * 0.75);
    ctx.closePath();
    ctx.fill();

    // Book pages
    ctx.fillStyle = 'white';
    ctx.fillRect(size * 0.25, size * 0.3, size * 0.5, size * 0.4);

    // Magnifying glass
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();

    // Magnifying glass handle
    ctx.beginPath();
    ctx.moveTo(size * 0.6, size * 0.6);
    ctx.lineTo(size * 0.7, size * 0.7);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = size * 0.03;
    ctx.stroke();

    return canvas.toBuffer('image/png');
}

// Generate icons in different sizes
[16, 48, 128].forEach(size => {
    const iconBuffer = generateIcon(size);
    fs.writeFileSync(`icons/icon${size}.png`, iconBuffer);
}); 