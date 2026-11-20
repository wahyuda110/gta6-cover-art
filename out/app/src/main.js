// Wires the editor: photos in, panels and caption edited, PNG out.
// A `?shot=` query builds a fixed scene for screenshots (./shots.js).
import { drawCoverArt } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const photoStatus = document.getElementById('photo-status');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const layoutInput = document.getElementById('layout');
const gradeInput = document.getElementById('grade');
const sizeInput = document.getElementById('size');
const panelInput = document.getElementById('panel');
const panelPhotoInput = document.getElementById('panel-photo');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');

// Three user photos, three panels. Each panel points at one photo and
// carries its own crop: zoom plus a left-right and up-down position.
const photos = [null, null, null];
const panelPhotos = [0, 1, 2];
const transforms = [
  { zoom: 100, panX: 0, panY: 0 },
  { zoom: 100, panX: 0, panY: 0 },
  { zoom: 100, panX: 0, panY: 0 },
];

function currentSize() {
  const [w, h] = sizeInput.value.split('x').map(Number);
  return { w, h };
}

function redraw() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCoverArt(canvas, {
    photos,
    panelPhotos,
    transforms,
    layout: layoutInput.value,
    grade: gradeInput.value,
    caption: captionInput.value,
    tagline: taglineInput.value,
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPhoto(index, img) {
  photos[index] = img;
  document.getElementById(`file${index}`).closest('.file-btn').classList.add('loaded');
  const loaded = photos.filter(Boolean).length;
  photoStatus.textContent = `${loaded} photo${loaded === 1 ? '' : 's'} loaded — each panel can use any of them.`;
  redraw();
}

async function loadFile(index, file) {
  if (!file) return;
  setPhoto(index, await loadImage(URL.createObjectURL(file)));
}

async function loadSample(index, name) {
  setPhoto(index, await loadImage(`samples/${name}.jpg`));
}

[0, 1, 2].forEach((i) => {
  document.getElementById(`file${i}`).addEventListener('change', (e) => loadFile(i, e.target.files[0]));
});
document.getElementById('sample-pier').addEventListener('click', () => loadSample(0, 'pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample(1, 'boulevard'));

function syncPanelControls() {
  const i = Number(panelInput.value);
  const t = transforms[i];
  panelPhotoInput.value = String(panelPhotos[i]);
  zoomInput.value = String(t.zoom);
  panXInput.value = String(t.panX);
  panYInput.value = String(t.panY);
  document.getElementById('zoom-val').textContent = `${t.zoom}%`;
  document.getElementById('panx-val').textContent = String(t.panX);
  document.getElementById('pany-val').textContent = String(t.panY);
}

panelInput.addEventListener('change', syncPanelControls);
panelPhotoInput.addEventListener('change', () => {
  panelPhotos[Number(panelInput.value)] = Number(panelPhotoInput.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  transforms[Number(panelInput.value)].zoom = Number(zoomInput.value);
  document.getElementById('zoom-val').textContent = `${zoomInput.value}%`;
  redraw();
});
panXInput.addEventListener('input', () => {
  transforms[Number(panelInput.value)].panX = Number(panXInput.value);
  document.getElementById('panx-val').textContent = panXInput.value;
  redraw();
});
panYInput.addEventListener('input', () => {
  transforms[Number(panelInput.value)].panY = Number(panYInput.value);
  document.getElementById('pany-val').textContent = panYInput.value;
  redraw();
});

layoutInput.addEventListener('change', redraw);
gradeInput.addEventListener('change', redraw);
sizeInput.addEventListener('change', redraw);
captionInput.addEventListener('input', redraw);
taglineInput.addEventListener('input', redraw);

document.getElementById('export').addEventListener('click', () => {
  redraw();
  const { w, h } = currentSize();
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
  }, 'image/png');
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadImage,
    setPhoto,
    setCaption: (text) => { captionInput.value = text; },
    setTagline: (text) => { taglineInput.value = text; },
    setLayout: (value) => { layoutInput.value = value; },
    setGrade: (value) => { gradeInput.value = value; },
    setSize: (value) => { sizeInput.value = value; },
    setPanelPhotos: (list) => { list.forEach((p, i) => { panelPhotos[i] = p; }); },
    redraw,
  });
} else {
  syncPanelControls();
  redraw();
}
