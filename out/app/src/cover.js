// Draws the multi-panel poster: photos in panel frames, a sunset/neon colour
// grade over each panel, a hand-drawn sun and skyline, and bold caption
// lettering across the foot. Everything is drawn with the canvas 2D API;
// no image, font or logo is loaded from outside the app.

export const GRADES = {
  sunset: { top: 'rgba(255,122,61,0.34)', bottom: 'rgba(214,38,120,0.62)', sky: '#ff9a3d', sun: '#ffe9a8', band: 'rgba(20,6,32,0.88)' },
  neon: { top: 'rgba(255,46,136,0.30)', bottom: 'rgba(24,190,220,0.55)', sky: '#ff2e88', sun: '#8ef3ff', band: 'rgba(8,6,32,0.88)' },
  dusk: { top: 'rgba(124,58,237,0.34)', bottom: 'rgba(13,148,136,0.58)', sky: '#a78bfa', sun: '#fde68a', band: 'rgba(16,8,36,0.88)' },
  gold: { top: 'rgba(245,158,11,0.30)', bottom: 'rgba(190,24,93,0.60)', sky: '#fbbf24', sun: '#fff7d6', band: 'rgba(30,10,8,0.88)' },
};

/** Panel rectangles for a layout, as fractions of the cover (x, y, w, h). */
export function layoutPanels(layout, w, h) {
  const g = 10; // gutter, in cover pixels at 1080 wide, scaled below
  const s = w / 1080;
  const gap = g * s;
  if (layout === 'hero') {
    const topH = h * 0.58 - gap / 2;
    const botH = h - topH - gap;
    const half = (w - gap) / 2;
    return [
      { x: 0, y: 0, w, h: topH },
      { x: 0, y: topH + gap, w: half, h: botH },
      { x: half + gap, y: topH + gap, w: half, h: botH },
    ];
  }
  if (layout === 'split') {
    const leftW = w * 0.52 - gap / 2;
    const rightW = w - leftW - gap;
    const half = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: leftW, h },
      { x: leftW + gap, y: 0, w: rightW, h: half },
      { x: leftW + gap, y: half + gap, w: rightW, h: half },
    ];
  }
  // strips: three equal vertical panels
  const third = (w - gap * 2) / 3;
  return [
    { x: 0, y: 0, w: third, h },
    { x: third + gap, y: 0, w: third, h },
    { x: (third + gap) * 2, y: 0, w: third, h },
  ];
}

/** Fills one panel rect with a photo, cover-fit, zoomed and panned. */
function drawPanelPhoto(ctx, photo, rect, transform) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#241233';
  ctx.fillRect(x, y, w, h);
  if (photo) {
    const zoom = (transform?.zoom ?? 100) / 100;
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * base;
    const ph = photo.naturalHeight * base;
    const px = x + (w - pw) / 2 + ((transform?.panX ?? 0) / 100) * (pw - w) * 0.5;
    const py = y + (h - ph) / 2 + ((transform?.panY ?? 0) / 100) * (ph - h) * 0.5;
    ctx.drawImage(photo, px, py, pw, ph);
  } else {
    // Empty panel: a painted sunset sky with a sun disc, so the cover
    // still reads as a poster before any photo is loaded.
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.55, '#ff5e8a');
    sky.addColorStop(1, '#3b115f');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.38, Math.min(w, h) * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A thin white frame and a soft inner shadow so panels read as a poster. */
function framePanel(ctx, rect) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, rect.w / 360);
  ctx.strokeRect(rect.x + ctx.lineWidth / 2, rect.y + ctx.lineWidth / 2, rect.w - ctx.lineWidth, rect.h - ctx.lineWidth);
  ctx.restore();
}

/** Simple original skyline: staggered building blocks along the band's top. */
function drawSkyline(ctx, w, bandY, bandH, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  let x = 0;
  let seed = 7;
  while (x < w) {
    seed = (seed * 31 + 17) % 97;
    const bw = w * (0.05 + (seed % 9) * 0.008);
    const bh = bandH * (0.25 + (seed % 5) * 0.14);
    ctx.fillRect(x, bandY - bh, bw, bh + 2);
    // a lit window or two
    ctx.fillStyle = 'rgba(255,214,120,0.85)';
    if (seed % 3 === 0) ctx.fillRect(x + bw * 0.3, bandY - bh + 4, 3, 4);
    ctx.fillStyle = colour;
    x += bw + w * 0.012;
  }
  ctx.restore();
}

/** Bold caption lettering: huge caps, warm gradient fill, dark outline, glow. */
function drawCaption(ctx, text, tagline, w, h, grade, bandY) {
  const words = text.trim().toUpperCase();
  if (!words && !tagline.trim()) return;
  const bandH = h - bandY;
  const cx = w / 2;
  if (words) {
    let size = h * 0.105;
    ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older canvas: no letter-spacing */ }
    while (ctx.measureText(words).width > w * 0.92 && size > 14) {
      size -= 3;
      ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    }
    const ty = bandY + bandH * 0.58;
    const fill = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.2);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.6, '#ffe9a8');
    fill.addColorStop(1, grade.sky);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = size * 0.28;
    ctx.strokeStyle = 'rgba(20,4,32,0.95)';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(words, cx, ty);
    ctx.shadowBlur = 0;
    ctx.fillStyle = fill;
    ctx.fillText(words, cx, ty);
  }
  const tag = tagline.trim().toUpperCase();
  if (tag) {
    const tsize = Math.max(13, h * 0.024);
    ctx.font = `700 ${tsize}px Arial, Helvetica, sans-serif`;
    try { ctx.letterSpacing = `${tsize * 0.28}px`; } catch { /* no letter-spacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(tag, cx, bandY + bandH * 0.88);
  }
}

/**
 * Draws the whole cover onto `canvas` at its own size.
 * `photos` is an array of images (or nulls); `panelPhotos` maps each panel
 * to a photo index; `transforms` maps each panel to {zoom, panX, panY}.
 */
export function drawCoverArt(canvas, options) {
  const { photos, panelPhotos, transforms, layout, grade: gradeName, caption, tagline } = options;
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  const panels = layoutPanels(layout, w, h);

  ctx.fillStyle = '#12081c';
  ctx.fillRect(0, 0, w, h);
  panels.forEach((rect, i) => {
    drawPanelPhoto(ctx, photos[panelPhotos[i] ?? i] ?? null, rect, transforms[i]);
    const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    tint.addColorStop(0, grade.top);
    tint.addColorStop(1, grade.bottom);
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    framePanel(ctx, rect);
  });

  // Caption band across the foot, with sun disc and skyline above the words.
  const bandH = h * 0.24;
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(18,8,28,0)');
  band.addColorStop(0.35, grade.band);
  band.addColorStop(1, 'rgba(10,4,20,0.96)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // Sun disc rides just above the skyline, clear of the buildings.
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(w * 0.86, bandY - h * 0.055, Math.min(w, h) * 0.036, 0, Math.PI * 2);
  ctx.fill();
  drawSkyline(ctx, w, bandY + bandH * 0.12, bandH * 0.2, 'rgba(12,4,24,0.9)');
  drawCaption(ctx, caption, tagline, w, h, grade, bandY);
}
