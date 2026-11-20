// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the finished cover alone, full-bleed.
// Query knobs: photo / photo2 / photo3 pick samples, caption and tagline
// the words, layout the panel arrangement, grade the colour grade, size
// the post size. window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const caption = query.get('caption') ?? 'Sunset Heist';
  const tagline = query.get('tagline') ?? 'NEON COAST · EST. 2026';
  const layout = query.get('layout') ?? 'strips';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? '1080x1080';
  const names = [
    query.get('photo') ?? 'pier',
    query.get('photo2') ?? 'boulevard',
    query.get('photo3') ?? 'pier',
  ];
  app.setLayout(layout);
  app.setGrade(grade);
  app.setSize(size);
  app.setCaption(caption);
  app.setTagline(tagline);
  const loaded = [];
  for (let i = 0; i < 3; i += 1) {
    loaded.push(app.loadImage(`samples/${names[i]}.jpg`).then((img) => app.setPhoto(i, img)));
  }
  await Promise.all(loaded);
  const panelParam = query.get('panels');
  if (panelParam) app.setPanelPhotos(panelParam.split(',').map(Number));
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
