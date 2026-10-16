// =====================================================================
//  ART: every sprite here is ORIGINAL pixel art drawn with code.
//  Bigger and more shaded than the beta: 48x64 hero frames, parallax city,
//  particles. Leader heads come from their 3D TwiN art (assets/head_*.png).
// =====================================================================
const HW = 48, HH = 64;
const HERO_FRAMES = ['idle', 'idle2', 'run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'jump', 'fall', 'punch', 'shoot', 'hurt'];
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
const shade = (c, f) => { const r = Math.min(255, ((c >> 16) & 255) * f) | 0, g = Math.min(255, ((c >> 8) & 255) * f) | 0, b = Math.min(255, (c & 255) * f) | 0; return (r << 16) | (g << 8) | b; };

// Draw a chunky limb from (x0,y0) to (x1,y1)
function limb(ctx, x0, y0, x1, y1, w, color, outline) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (const [col, ww] of [[outline, w + 2], [color, w]]) {
    ctx.fillStyle = col;
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / steps), y = Math.round(y0 + (y1 - y0) * i / steps);
      ctx.fillRect(x - (ww >> 1), y - (ww >> 1), ww, ww);
    }
  }
}

// Hero poses (facing right). Shoulder ~ (24,34), hip ~ (24,48)
const HERO_POSES = {
  idle:  { fa: [30, 46], ba: [17, 46], fl: [29, 63], bl: [19, 63] },
  idle2: { fa: [31, 47], ba: [16, 47], fl: [29, 63], bl: [19, 63], dy: 1 },
  run1:  { fa: [34, 40], ba: [14, 46], fl: [36, 61], bl: [12, 60] },
  run2:  { fa: [31, 43], ba: [17, 45], fl: [32, 63], bl: [16, 58], dy: 1 },
  run3:  { fa: [24, 46], ba: [26, 43], fl: [24, 62], bl: [26, 57], dy: -1 },
  run4:  { fa: [14, 46], ba: [34, 40], fl: [12, 60], bl: [36, 61] },
  run5:  { fa: [17, 45], ba: [31, 43], fl: [16, 58], bl: [32, 63], dy: 1 },
  run6:  { fa: [26, 43], ba: [24, 46], fl: [26, 57], bl: [24, 62], dy: -1 },
  jump:  { fa: [34, 28], ba: [12, 32], fl: [31, 56], bl: [17, 52] },
  fall:  { fa: [36, 36], ba: [12, 36], fl: [30, 63], bl: [16, 60] },
  punch: { fa: [46, 36], ba: [18, 42], fl: [33, 63], bl: [15, 63] },
  shoot: { fa: [44, 38], ba: [18, 44], fl: [30, 63], bl: [18, 63], gun: true },
  hurt:  { fa: [10, 30], ba: [14, 34], fl: [30, 63], bl: [18, 63], lean: -3 }
};

function makeHero(scene, L) {
  const tex = scene.textures.createCanvas('hero_' + L.key, HW * HERO_FRAMES.length, HH), ctx = tex.getContext();
  const main = hx(L.color), dark = hx(L.dark), hi = hx(shade(L.color, 1.35)), O = '#0b0b14';
  const pants = '#1e1e3a', pantsD = '#14142a', boot = '#2a1a10', skin = '#d9a066';
  HERO_FRAMES.forEach((f, i) => {
    const p = HERO_POSES[f], ox = i * HW, lean = p.lean || 0, sx = ox + 24 + lean, sy = 34 + (p.dy || 0), hipx = ox + 24, hipy = 48 + (p.dy || 0);
    const o = pt => [ox + pt[0], pt[1]];
    // back leg & arm
    let [bx, by] = o(p.bl); limb(ctx, hipx - 3, hipy, (hipx - 3 + bx) / 2, (hipy + by) / 2 + 1, 6, pantsD, O); limb(ctx, (hipx - 3 + bx) / 2, (hipy + by) / 2 + 1, bx, by - 3, 6, pantsD, O);
    ctx.fillStyle = O; ctx.fillRect(bx - 5, by - 5, 11, 6); ctx.fillStyle = boot; ctx.fillRect(bx - 4, by - 4, 9, 4);
    [bx, by] = o(p.ba); limb(ctx, sx - 6, sy, (sx - 6 + bx) / 2, (sy + by) / 2 + 2, 5, dark, O); limb(ctx, (sx - 6 + bx) / 2, (sy + by) / 2 + 2, bx, by, 5, dark, O);
    ctx.fillStyle = O; ctx.fillRect(bx - 3, by - 3, 7, 7); ctx.fillStyle = '#eee'; ctx.fillRect(bx - 2, by - 2, 5, 5);   // glove
    // torso: jacket with highlight, shadow, zip, gold chain
    ctx.fillStyle = O; ctx.fillRect(sx - 10, sy - 6, 20, 20);
    ctx.fillStyle = main; ctx.fillRect(sx - 9, sy - 5, 18, 18);
    ctx.fillStyle = hi; ctx.fillRect(sx - 9, sy - 5, 4, 14);
    ctx.fillStyle = dark; ctx.fillRect(sx + 5, sy - 5, 4, 18); ctx.fillRect(sx - 9, sy + 10, 18, 3);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(sx - 5, sy - 4, 10, 2); ctx.fillRect(sx - 1, sy - 2, 3, 4);   // chain + X pendant
    ctx.fillStyle = '#ffd700'; ctx.fillRect(sx - 2, sy + 10, 4, 3);                                       // belt buckle
    // front leg
    [bx, by] = o(p.fl); limb(ctx, hipx + 3, hipy, (hipx + 3 + bx) / 2 + 1, (hipy + by) / 2, 6, pants, O); limb(ctx, (hipx + 3 + bx) / 2 + 1, (hipy + by) / 2, bx, by - 3, 6, pants, O);
    ctx.fillStyle = O; ctx.fillRect(bx - 5, by - 5, 12, 6); ctx.fillStyle = boot; ctx.fillRect(bx - 4, by - 4, 10, 4); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 4, by - 2, 10, 1);
    // front arm (+ arm blaster when shooting, Mega Man style)
    [bx, by] = o(p.fa); limb(ctx, sx + 6, sy, (sx + 6 + bx) / 2, (sy + by) / 2 + 2, 5, main, O); limb(ctx, (sx + 6 + bx) / 2, (sy + by) / 2 + 2, bx, by, 5, main, O);
    if (p.gun) { ctx.fillStyle = O; ctx.fillRect(bx - 6, by - 5, 12, 10); ctx.fillStyle = hx(L.glow); ctx.fillRect(bx - 5, by - 4, 10, 8); ctx.fillStyle = dark; ctx.fillRect(bx + 2, by - 2, 3, 4); }
    else { ctx.fillStyle = O; ctx.fillRect(bx - 4, by - 4, 8, 8); ctx.fillStyle = '#eee'; ctx.fillRect(bx - 3, by - 3, 6, 6); }
    polish(ctx, ox, 0, HW, HH, L.glow);
    tex.add(f, 0, ox, 0, HW, HH);
  });
  tex.refresh();
}

// Scam Bot: boxy walking robot with a spam-mail screen face
function makeScamBot(scene) {
  const W = 40, H = 48, frames = ['walk1', 'walk2', 'shoot', 'hurt'];
  const tex = scene.textures.createCanvas('scambot', W * frames.length, H), c = tex.getContext(), O = '#0b0b14';
  frames.forEach((f, i) => {
    const ox = i * W, step = f === 'walk2' ? 3 : 0;
    c.fillStyle = O; c.fillRect(ox + 8, 34, 8, 14 - step); c.fillRect(ox + 24, 34, 8, 14 - (3 - step));
    c.fillStyle = '#556'; c.fillRect(ox + 9, 35, 6, 12 - step); c.fillRect(ox + 25, 35, 6, 12 - (3 - step));
    c.fillStyle = O; c.fillRect(ox + 4, 6, 32, 30); c.fillStyle = f === 'hurt' ? '#fff' : '#2ecc71'; c.fillRect(ox + 5, 7, 30, 28);
    c.fillStyle = '#1a7a43'; c.fillRect(ox + 5, 29, 30, 6); c.fillStyle = '#7dffb0'; c.fillRect(ox + 5, 7, 30, 3);
    c.fillStyle = O; c.fillRect(ox + 9, 11, 22, 14); c.fillStyle = '#ff4060'; c.fillRect(ox + 10, 12, 20, 12);   // red screen
    c.fillStyle = '#fff'; c.fillRect(ox + 12, 14, 16, 8); c.fillStyle = '#ff4060'; c.fillRect(ox + 12, 14, 8, 4); c.fillRect(ox + 20, 14, 8, 4); // envelope
    c.fillStyle = O; c.fillRect(ox + 18, 0, 3, 7); c.fillStyle = '#ffcc00'; c.fillRect(ox + 16, 0, 7, 3);     // antenna
    if (f === 'shoot') { c.fillStyle = O; c.fillRect(ox + 30, 22, 10, 7); c.fillStyle = '#aaa'; c.fillRect(ox + 31, 23, 9, 5); }
    polish(c, ox, 0, W, H, 0x7dffb0);
    tex.add(f, 0, ox, 0, W, H);
  });
  tex.refresh();
}

// Phish Drone: a flying robo-fish with a hook and propeller
function makePhish(scene) {
  const W = 40, H = 32, tex = scene.textures.createCanvas('phish', W * 2, H), c = tex.getContext(), O = '#0b0b14';
  for (let i = 0; i < 2; i++) {
    const ox = i * W;
    c.fillStyle = O; c.beginPath(); c.ellipse(ox + 18, 18, 15, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#3aa0ff'; c.beginPath(); c.ellipse(ox + 18, 18, 13, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#a8dcff'; c.fillRect(ox + 8, 20, 18, 3);
    c.fillStyle = O; c.beginPath(); c.moveTo(ox + 32, 18); c.lineTo(ox + 40, 10); c.lineTo(ox + 40, 26); c.fill();      // tail
    c.fillStyle = '#ff4060'; c.fillRect(ox + 34, 14, 4, 8);
    c.fillStyle = '#fff'; c.fillRect(ox + 8, 14, 5, 5); c.fillStyle = O; c.fillRect(ox + 8, 15, 3, 3);                     // eye
    c.fillStyle = '#ccc'; c.fillRect(ox + 12, 25, 2, 6); c.fillRect(ox + 10, 29, 4, 2);                                     // hook
    c.fillStyle = O; c.fillRect(ox + 17, 4, 2, 6); c.fillStyle = '#ddd'; c.fillRect(ox + (i ? 10 : 14), 2, i ? 16 : 8, 3);  // propeller
  }
  polish(c, 0, 0, W * 2, H, 0xa8dcff, W);
  tex.add('f1', 0, 0, 0, W, H); tex.add('f2', 0, W, 0, W, H); tex.refresh();
}

// LOCz Don: big boss in a green track suit, padlock chain, shades
function makeBoss(scene) {
  const W = 80, H = 96, frames = ['idle', 'jump', 'throw', 'hurt'];
  const tex = scene.textures.createCanvas('don', W * frames.length, H), c = tex.getContext(), O = '#0b0b14';
  frames.forEach((f, i) => {
    const ox = i * W, g = f === 'hurt' ? '#ffffff' : '#1f9d55', gd = '#0f5c31';
    c.fillStyle = O; c.fillRect(ox + 22, 70, 14, 26); c.fillRect(ox + 44, 70, 14, 26);
    c.fillStyle = gd; c.fillRect(ox + 23, 71, 12, 22); c.fillRect(ox + 45, 71, 12, 22);
    c.fillStyle = '#111'; c.fillRect(ox + 20, 90, 18, 6); c.fillRect(ox + 42, 90, 18, 6);
    c.fillStyle = O; c.fillRect(ox + 14, 34, 52, 40); c.fillStyle = g; c.fillRect(ox + 15, 35, 50, 38);
    c.fillStyle = '#fff'; c.fillRect(ox + 15, 35, 3, 38); c.fillRect(ox + 62, 35, 3, 38);                      // track stripes
    c.fillStyle = '#c0c0c0'; for (let k = 0; k < 6; k++) c.fillRect(ox + 20 + k * 7, 44 + (k % 2) * 2, 6, 4);   // chain
    c.fillStyle = '#ffd700'; c.fillRect(ox + 34, 50, 12, 10); c.fillStyle = O; c.fillRect(ox + 38, 53, 4, 4);   // big padlock
    const armUp = f === 'throw' ? -24 : f === 'jump' ? -12 : 0;
    c.fillStyle = O; c.fillRect(ox + 4, 36 + armUp, 12, 30); c.fillRect(ox + 64, 36 + (f === 'throw' ? 0 : armUp), 12, 30);
    c.fillStyle = g; c.fillRect(ox + 5, 37 + armUp, 10, 28); c.fillRect(ox + 65, 37 + (f === 'throw' ? 0 : armUp), 10, 28);
    c.fillStyle = O; c.fillRect(ox + 24, 4, 32, 32); c.fillStyle = '#b07850'; c.fillRect(ox + 25, 5, 30, 30);    // head
    c.fillStyle = '#1f9d55'; c.fillRect(ox + 24, 2, 32, 9); c.fillRect(ox + 52, 6, 10, 4);                      // cap
    c.fillStyle = O; c.fillRect(ox + 27, 15, 26, 6); c.fillStyle = '#2aa8ff'; c.fillRect(ox + 29, 16, 9, 4); c.fillRect(ox + 42, 16, 9, 4); // shades
    c.fillStyle = O; c.fillRect(ox + 32, 27, 16, 3); c.fillStyle = '#ffd700'; c.fillRect(ox + 36, 27, 3, 2);    // gold tooth grin
    polish(c, ox, 0, W, H, 0x9aff9a);
    tex.add(f, 0, ox, 0, W, H);
  });
  tex.refresh();
}

// Rooftop tiles, parallax backgrounds, bullets, pickups, particles
function makeWorld(scene) {
  let t, c;
  makeBackdrop(scene);
  // moon + clouds texture
  t = scene.textures.createCanvas('moon', 64, 64); c = t.getContext();
  c.fillStyle = 'rgba(255,240,180,0.15)'; c.beginPath(); c.arc(32, 32, 32, 0, 7); c.fill();
  c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(32, 32, 20, 0, 7); c.fill(); c.fillStyle = '#e8d890'; c.fillRect(24, 26, 5, 5); c.fillRect(36, 36, 7, 4); t.refresh();
  makeShots(scene);
  t = scene.textures.createCanvas('b_spam', 12, 9); c = t.getContext();          // spam e-mail shot
  c.fillStyle = '#fff'; c.fillRect(0, 0, 12, 9); c.fillStyle = '#ff4060'; c.beginPath(); c.moveTo(0, 0); c.lineTo(6, 5); c.lineTo(12, 0); c.fill(); t.refresh();
  t = scene.textures.createCanvas('lock', 14, 16); c = t.getContext();          // boss padlock throw
  c.strokeStyle = '#c0c0c0'; c.lineWidth = 3; c.beginPath(); c.arc(7, 6, 4, Math.PI, 0); c.stroke();
  c.fillStyle = '#ffd700'; c.fillRect(1, 6, 12, 10); c.fillStyle = '#0b0b14'; c.fillRect(6, 9, 2, 4); t.refresh();
  // pickups
  const coin = (key, col) => { const tt = scene.textures.createCanvas(key, 16, 16), cc = tt.getContext();
    cc.fillStyle = '#0b0b14'; cc.beginPath(); cc.arc(8, 8, 8, 0, 7); cc.fill(); const gr = cc.createRadialGradient(5, 5, 1, 8, 8, 8); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, hx(col)); gr.addColorStop(1, hx(shade(col, 0.55))); cc.fillStyle = gr; cc.beginPath(); cc.arc(8, 8, 6.5, 0, 7); cc.fill();
    cc.fillStyle = 'rgba(0,0,0,0.35)'; cc.font = 'bold 9px monospace'; cc.fillText('N', 5, 11); cc.fillStyle = 'rgba(255,255,255,0.7)'; cc.fillRect(4, 4, 2, 3); tt.refresh(); };
  coin('p_copper', PICKUPS.copper.color); coin('p_silver', PICKUPS.silver.color); coin('p_gold', PICKUPS.gold.color);
  t = scene.textures.createCanvas('p_xrp', 16, 18); c = t.getContext();          // XRP drop: a water-drop with the X mark
  c.fillStyle = '#0b0b14'; c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(17, 11, 8, 18); c.quadraticCurveTo(-1, 11, 8, 0); c.fill();
  c.fillStyle = '#e8eef5'; c.beginPath(); c.moveTo(8, 2); c.quadraticCurveTo(15, 11, 8, 16); c.quadraticCurveTo(1, 11, 8, 2); c.fill();
  c.strokeStyle = '#23292f'; c.lineWidth = 2; c.beginPath(); c.moveTo(5, 8); c.lineTo(11, 14); c.moveTo(11, 8); c.lineTo(5, 14); c.stroke(); t.refresh();
  t = scene.textures.createCanvas('p_trustline', 20, 16); c = t.getContext();    // 1-UP: two linked rings
  c.strokeStyle = '#2aa8ff'; c.lineWidth = 3; c.beginPath(); c.arc(7, 8, 5, 0, 7); c.stroke(); c.beginPath(); c.arc(13, 8, 5, 0, 7); c.stroke(); t.refresh();
  t = scene.textures.createCanvas('px', 4, 4); c = t.getContext(); c.fillStyle = '#fff'; c.fillRect(0, 0, 4, 4); t.refresh();
  t = scene.textures.createCanvas('ring', 32, 32); c = t.getContext(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(16, 16, 13, 0, 7); c.stroke(); t.refresh();
}

function makeAllArt(scene) {
  LEADERS.forEach(L => makeHero(scene, L));
  makeScamBot(scene); makePhish(scene); makeBoss(scene); makeWorld(scene);
}

// =====================================================================
//  v2 LOOK (Mega Man 11-ish): soft shading, rim light, glows, layered city.
//  Everything is still drawn by code at load time (pre-rendered once), so
//  there are no extra image downloads.
// =====================================================================

// "polish" pass on a sprite frame: soft top-left light / bottom shadow,
// a coloured rim light on the back edge, a bright top edge and a clean outline.
function polish(ctx, x0, y0, w, h, rim, frameW) {
  const img = ctx.getImageData(x0, y0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const fw = frameW || w, rr = (rim >> 16) & 255, rg = (rim >> 8) & 255, rb = rim & 255;
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] < 128) {   // bold cartoon outline (2px, like the CBH art) around the sprite
      let n = false; for (let oy = -2; oy <= 2 && !n; oy++) for (let ox = -2; ox <= 2; ox++) if (Math.abs(ox) + Math.abs(oy) <= 2 && A(x + ox, y + oy) > 127) { n = true; break; }
      if (n) { d[i] = 8; d[i + 1] = 6; d[i + 2] = 12; d[i + 3] = 255; }
      continue;
    }
    const lx = (x % fw) / fw, ly = y / h;
    const v = 1.14 - ly * 0.32 - lx * 0.08; let f = v > 1.02 ? 1.12 : v > 0.9 ? 0.98 : 0.8;   // cartoon (cel) shading bands, light from top-left
    let r = src[i] * f, g = src[i + 1] * f, b = src[i + 2] * f;
    if (A(x, y - 1) < 128) { r += 45; g += 45; b += 45; } // specular top edge
    if (A(x - 1, y) < 128) { r = r * 0.45 + rr * 0.55; g = g * 0.45 + rg * 0.55; b = b * 0.45 + rb * 0.55; } // rim light (back edge)
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, x0, y0);
}

// radial glow sprite (used with ADD blend for light pools, auras, muzzle flash)
function radial(scene, key, size, stops) {
  const t = scene.textures.createCanvas(key, size, size), c = t.getContext(), r = size / 2;
  const g = c.createRadialGradient(r, r, 0, r, r, r); stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
}

function makeBackdrop(scene) {
  let t, c;
  radial(scene, 'glow', 64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
  radial(scene, 'spark', 8, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
  // sky: deep night gradient with a warm city glow at the horizon
  t = scene.textures.createCanvas('skyGrad', 16, 360); c = t.getContext();
  let g = c.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#0a0620'); g.addColorStop(0.45, '#2a1450'); g.addColorStop(0.75, '#7a2a6a'); g.addColorStop(1, '#ff7a5a');
  c.fillStyle = g; c.fillRect(0, 0, 16, 360); t.refresh();
  // stars
  t = scene.textures.createCanvas('stars', 320, 160); c = t.getContext();
  for (let i = 0; i < 70; i++) { const x = (i * 97) % 320, y = (i * 53) % 160; c.fillStyle = `rgba(255,255,255,${0.25 + (i % 4) * 0.18})`; c.fillRect(x, y, i % 9 ? 1 : 2, i % 9 ? 1 : 2); }
  t.refresh();
  // skyline layer helper: buildings with vertical gradient shading, rim on the lit side, glowing windows
  const sky = (key, w, h, top, bot, win, minH, maxH, seed, alphaFade, extra) => {
    const tt = scene.textures.createCanvas(key, w, h), cc = tt.getContext();
    let x = 0, i = seed;
    while (x < w) {
      const bw = 26 + (i * 37) % 48, bh = minH + (i * 53) % (maxH - minH), y = h - bh;
      const gg = cc.createLinearGradient(0, y, 0, h); gg.addColorStop(0, top); gg.addColorStop(1, bot);
      cc.fillStyle = gg; cc.fillRect(x, y, bw, bh);
      cc.fillStyle = 'rgba(255,140,200,0.18)'; cc.fillRect(x + bw - 2, y, 2, bh);          // magenta rim from the sky glow
      if (win) for (let wy = y + 6; wy < h - 4; wy += 8) for (let wx = x + 4; wx < x + bw - 4; wx += 6)
        if ((wx * 7 + wy * 3 + i) % 5 === 0) { cc.fillStyle = win; cc.globalAlpha = 0.35; cc.fillRect(wx - 1, wy - 1, 5, 6); cc.globalAlpha = 1; cc.fillRect(wx, wy, 3, 4); }
      if (extra) extra(cc, x, y, bw, i);
      x += bw + 1 + (i % 3); i++;
    }
    if (alphaFade) { const fg = cc.createLinearGradient(0, 0, 0, h); fg.addColorStop(0, 'rgba(255,120,140,0)'); fg.addColorStop(1, alphaFade); cc.globalCompositeOperation = 'source-atop'; cc.fillStyle = fg; cc.fillRect(0, 0, w, h); cc.globalCompositeOperation = 'source-over'; }
    tt.refresh();
  };
  sky('bgHaze', 640, 200, '#4a2a6a', '#6a3a7a', null, 70, 180, 2, 'rgba(255,120,140,0.35)');                       // 1 distant haze skyline
  sky('bgFar', 640, 200, '#2a1a4a', '#3a2258', '#a08ae0', 60, 170, 3, 'rgba(255,110,150,0.25)',                    // 2 far skyline
    (cc, x, y, w, i) => { if (i % 4 === 0) { cc.fillStyle = '#2a1a4a'; cc.fillRect(x + w / 2 - 1, y - 24, 2, 24); cc.fillStyle = '#ff4060'; cc.fillRect(x + w / 2 - 1, y - 26, 3, 3); } });
  sky('bgMid', 640, 220, '#1d1235', '#140c26', '#ffcf5a', 80, 200, 7, null, (cc, x, y, w, i) => {                 // 3 mid towers + neon roof strips
    if (i % 3 === 0) { cc.fillStyle = ['#2ecc71', '#ff3d8b', '#3aa0ff'][i % 3 === 0 ? (i / 3) % 3 | 0 : 0]; cc.globalAlpha = 0.25; cc.fillRect(x - 2, y - 3, w + 4, 7); cc.globalAlpha = 1; cc.fillRect(x, y, w, 2); } });
  // CBH-style chart scribbles (candles + zigzag "up only" arrows) baked on the mid skyline
  { const tt = scene.textures.get('bgMid'), cc = tt.getContext(); cc.lineWidth = 2; cc.lineJoin = 'round';
    for (let k = 0; k < 4; k++) { const bx = 40 + k * 160, by = 70 + (k % 2) * 30; cc.strokeStyle = ['#2ecc71', '#ff3d8b', '#ffd34d', '#7fdcff'][k]; cc.globalAlpha = 0.55;
      cc.beginPath(); cc.moveTo(bx, by + 30); for (let j = 1; j < 7; j++) cc.lineTo(bx + j * 10, by + 30 - j * 4 + (j % 2 ? 10 : -6)); cc.stroke();
      cc.beginPath(); cc.moveTo(bx + 60, by + 2); cc.lineTo(bx + 66, by + 4); cc.lineTo(bx + 62, by + 9); cc.stroke();
      for (let j = 0; j < 5; j++) { cc.fillStyle = j % 2 ? '#ff4060' : '#2ecc71'; cc.fillRect(bx + 80 + j * 7, by + 10 + (j * 5) % 14, 4, 10 + (j * 3) % 8); cc.fillRect(bx + 81 + j * 7, by + 6 + (j * 5) % 14, 2, 18); } }
    cc.globalAlpha = 1; tt.refresh(); }
  sky('bgNear', 640, 160, '#120a20', '#0a0614', '#2ecc71', 40, 120, 11, null, (cc, x, y, w, i) => {             // 4 near roofs: water tanks + LOCz billboards
    if (i % 3) return;
    cc.fillStyle = '#120a20'; cc.fillRect(x + 6, y - 26, 20, 20); cc.fillRect(x + 8, y - 6, 2, 6); cc.fillRect(x + 22, y - 6, 2, 6);
    cc.fillStyle = '#000'; cc.fillRect(x, y + 1, 38, 20); cc.fillStyle = (i % 2) ? '#2a0a3a' : '#0a2a1a'; cc.fillRect(x + 2, y + 3, 34, 16);
    cc.fillStyle = 'rgba(46,204,113,0.25)'; cc.fillRect(x - 2, y - 1, 42, 24);
    cc.fillStyle = (i % 2) ? '#ff3d8b' : '#2ecc71'; cc.font = 'bold 9px monospace'; cc.fillText(i % 2 ? 'HODL' : 'LOCz', x + 5, y + 15); });
  // 5 foreground silhouettes (scroll faster than the level): pipes, vents, antenna, fence
  t = scene.textures.createCanvas('fg', 640, 70); c = t.getContext(); c.fillStyle = '#05030a';
  for (let x = 0; x < 640; x += 160) {
    c.fillRect(x + 10, 40, 60, 30); c.fillRect(x + 20, 30, 12, 12); c.fillRect(x + 50, 22, 4, 20);           // vent box + chimney
    c.fillRect(x + 90, 50, 70, 20); for (let k = 0; k < 70; k += 7) c.fillRect(x + 90 + k, 34, 2, 18);       // fence posts
    c.fillRect(x + 90, 34, 70, 2); c.fillRect(x + 128, 8, 2, 44); c.fillRect(x + 120, 14, 18, 2);           // antenna
  }
  t.refresh();
  // rooftop tile 32x16: concrete with lit lip and soft shadow
  t = scene.textures.createCanvas('roof', 32, 16); c = t.getContext();
  g = c.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, '#9a94b8'); g.addColorStop(0.2, '#6a6488'); g.addColorStop(1, '#3a3450');
  c.fillStyle = g; c.fillRect(0, 0, 32, 16); c.fillStyle = '#d8d0ff'; c.fillRect(0, 0, 32, 1); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(15, 4, 1, 12); t.refresh();
  // wall below the roof: gradient brick tone with warm windows
  t = scene.textures.createCanvas('wall', 32, 32); c = t.getContext();
  g = c.createLinearGradient(0, 0, 32, 0); g.addColorStop(0, '#34294a'); g.addColorStop(1, '#221a32'); c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  c.fillStyle = 'rgba(255,211,77,0.25)'; c.fillRect(4, 6, 11, 13); c.fillStyle = '#ffd34d'; c.fillRect(6, 8, 7, 9); c.fillStyle = '#fff3c0'; c.fillRect(6, 8, 7, 2);
  c.fillStyle = '#1a1426'; c.fillRect(19, 8, 7, 9); c.fillStyle = '#18121f'; c.fillRect(0, 30, 32, 2); t.refresh();
  // girder
  t = scene.textures.createCanvas('girder', 32, 12); c = t.getContext();
  g = c.createLinearGradient(0, 0, 0, 12); g.addColorStop(0, '#e0603a'); g.addColorStop(0.3, '#a03a22'); g.addColorStop(1, '#5a1e10'); c.fillStyle = g; c.fillRect(0, 0, 32, 12);
  c.fillStyle = '#ffb090'; c.fillRect(0, 0, 32, 1); c.strokeStyle = '#3a1208'; c.lineWidth = 2;
  for (let x = 0; x < 32; x += 8) { c.beginPath(); c.moveTo(x, 3); c.lineTo(x + 4, 11); c.lineTo(x + 8, 3); c.stroke(); } t.refresh();
  // street lamp (light pool is a separate ADD glow)
  t = scene.textures.createCanvas('lamp', 16, 56); c = t.getContext();
  c.fillStyle = '#1a1626'; c.fillRect(7, 6, 3, 50); c.fillRect(2, 4, 12, 4); c.fillStyle = '#fff3c0'; c.fillRect(4, 8, 8, 2); t.refresh();
}

// Shots: glowing cores with a soft halo baked in (drawn with ADD blend in game)
function makeUpgrades(scene) {
  let t = scene.textures.createCanvas('p_heart', 18, 18), c = t.getContext();          // Heart Vault
  c.fillStyle = '#08060c'; c.fillRect(0, 2, 18, 16); c.fillStyle = '#ff3d8b'; c.fillRect(2, 4, 14, 12); c.fillStyle = '#ffb0d0'; c.fillRect(3, 5, 4, 3);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(9, 14); c.lineTo(4, 9); c.arc(6.5, 8, 2.5, Math.PI, 0); c.arc(11.5, 8, 2.5, Math.PI, 0); c.lineTo(9, 14); c.fill();
  c.fillStyle = '#ffd700'; c.fillRect(5, 0, 8, 3); t.refresh();
  t = scene.textures.createCanvas('p_subtank', 16, 20); c = t.getContext();              // Cold Wallet (stored health)
  c.fillStyle = '#08060c'; c.fillRect(1, 2, 14, 18); c.fillStyle = '#3aa0ff'; c.fillRect(3, 4, 10, 14); c.fillStyle = '#bfe6ff'; c.fillRect(4, 5, 3, 6);
  c.fillStyle = '#ffd700'; c.fillRect(5, 0, 6, 3); c.fillStyle = '#fff'; c.font = 'bold 8px monospace'; c.fillText('C', 6, 15); t.refresh();
  t = scene.textures.createCanvas('p_armor', 20, 20); c = t.getContext();                // Ledger Armor (helmet + boots capsule)
  c.fillStyle = '#08060c'; c.beginPath(); c.arc(10, 10, 10, 0, 7); c.fill();
  const g = c.createRadialGradient(7, 6, 1, 10, 10, 9); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#7fe0ff'); g.addColorStop(1, '#1a5a8a'); c.fillStyle = g; c.beginPath(); c.arc(10, 10, 8, 0, 7); c.fill();
  c.fillStyle = '#08060c'; c.fillRect(5, 8, 10, 3); c.fillStyle = '#ffd700'; c.fillRect(8, 13, 4, 3); t.refresh();
}

function makeShots(scene) {
  makeUpgrades(scene);
  radial(scene, 'b_charge', 40, [[0, '#ffffff'], [0.3, '#ffffff'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
  const orb = (key, s, col, core) => radial(scene, key, s, [[0, '#ffffff'], [0.25, core], [0.55, col], [1, 'rgba(0,0,0,0)']]);
  orb('b_spread', 14, '#ffb000', '#fff6c0');
  orb('b_heavy', 26, '#ff2020', '#ffd0a0');
  orb('b_cloud', 32, 'rgba(155,61,214,0.7)', 'rgba(230,190,255,0.9)');
  orb('b_enemy', 12, '#ff4060', '#ffd0d8');
  let t = scene.textures.createCanvas('b_bolt', 26, 12), c = t.getContext();
  c.lineCap = 'round'; [['rgba(80,180,255,0.35)', 6], ['#7fdcff', 3], ['#fff', 1]].forEach(([col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(2, 6); c.lineTo(8, 2); c.lineTo(13, 10); c.lineTo(18, 2); c.lineTo(24, 6); c.stroke(); }); t.refresh();
  t = scene.textures.createCanvas('b_beam', 48, 12); c = t.getContext();
  let g = c.createLinearGradient(0, 0, 0, 12); g.addColorStop(0, 'rgba(160,230,255,0)'); g.addColorStop(0.35, '#bfefff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.65, '#bfefff'); g.addColorStop(1, 'rgba(160,230,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 48, 12); t.refresh();
  t = scene.textures.createCanvas('chainlink', 10, 8); c = t.getContext();
  c.strokeStyle = 'rgba(154,255,154,0.4)'; c.lineWidth = 4; c.strokeRect(2, 2, 6, 4); c.strokeStyle = '#d8ffd8'; c.lineWidth = 1.5; c.strokeRect(2, 2, 6, 4); t.refresh();
}
