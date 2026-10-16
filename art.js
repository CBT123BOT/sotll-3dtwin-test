// =====================================================================
//  ART: every sprite here is ORIGINAL pixel art drawn with code.
//  Bigger and more shaded than the beta: 48x64 hero frames, parallax city,
//  particles. Leader heads come from their 3D TwiN art (assets/head_*.png).
// =====================================================================
const HW = 48, HH = 64;
const HERO_FRAMES = ['idle', 'run1', 'run2', 'run3', 'run4', 'jump', 'fall', 'punch', 'shoot', 'hurt'];
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
  run1:  { fa: [34, 40], ba: [14, 46], fl: [36, 61], bl: [12, 60] },
  run2:  { fa: [28, 45], ba: [20, 44], fl: [28, 63], bl: [20, 58] },
  run3:  { fa: [14, 46], ba: [34, 40], fl: [12, 60], bl: [36, 61] },
  run4:  { fa: [20, 44], ba: [28, 45], fl: [20, 58], bl: [28, 63] },
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
    const p = HERO_POSES[f], ox = i * HW, lean = p.lean || 0, sx = ox + 24 + lean, sy = 34, hipx = ox + 24, hipy = 48;
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
    tex.add(f, 0, ox, 0, W, H);
  });
  tex.refresh();
}

// Rooftop tiles, parallax backgrounds, bullets, pickups, particles
function makeWorld(scene) {
  let t, c;
  // rooftop tile 32x32: concrete with ledge
  t = scene.textures.createCanvas('roof', 32, 32); c = t.getContext();
  c.fillStyle = '#4a4458'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#6a6480'; c.fillRect(0, 0, 32, 5); c.fillStyle = '#8a84a0'; c.fillRect(0, 0, 32, 2);
  c.fillStyle = '#3a3448'; c.fillRect(0, 12, 32, 1); c.fillRect(15, 13, 1, 19); c.fillRect(0, 24, 32, 1); t.refresh();
  // building wall below roof
  t = scene.textures.createCanvas('wall', 32, 32); c = t.getContext();
  c.fillStyle = '#2c2638'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#ffd34d'; c.fillRect(6, 8, 7, 9); c.fillStyle = '#3a3448'; c.fillRect(19, 8, 7, 9);
  c.fillStyle = '#231e2e'; c.fillRect(0, 30, 32, 2); t.refresh();
  // girder platform
  t = scene.textures.createCanvas('girder', 32, 12); c = t.getContext();
  c.fillStyle = '#7a2a1a'; c.fillRect(0, 0, 32, 12); c.fillStyle = '#b5432a'; c.fillRect(0, 0, 32, 3); c.fillStyle = '#4a1a10';
  for (let x = 0; x < 32; x += 8) { c.beginPath(); c.moveTo(x, 3); c.lineTo(x + 4, 11); c.lineTo(x + 8, 3); c.lineWidth = 2; c.strokeStyle = '#4a1a10'; c.stroke(); } t.refresh();
  // parallax: far skyline, mid skyline, near (antennas, water tanks, billboards)
  const sky = (key, w, h, base, lit, minH, maxH, seed, extra) => {
    const tt = scene.textures.createCanvas(key, w, h), cc = tt.getContext();
    let x = 0, i = seed;
    while (x < w) {
      const bw = 30 + (i * 37) % 50, bh = minH + (i * 53) % (maxH - minH);
      cc.fillStyle = base; cc.fillRect(x, h - bh, bw, bh);
      cc.fillStyle = lit; for (let wy = h - bh + 6; wy < h - 4; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7) if ((wx * 7 + wy * 3 + i) % 5 === 0) cc.fillRect(wx, wy, 3, 4);
      if (extra && i % 3 === 0) extra(cc, x, h - bh, bw);
      x += bw + 2; i++;
    }
    tt.refresh();
  };
  sky('bgFar', 640, 200, '#2a1f4a', '#6a5aa0', 60, 170, 3);
  sky('bgMid', 640, 220, '#1d1533', '#ffcf5a', 80, 200, 7, (cc, x, y, w) => { cc.fillStyle = '#1d1533'; cc.fillRect(x + w / 2 - 1, y - 18, 2, 18); cc.fillStyle = '#ff4060'; cc.fillRect(x + w / 2 - 2, y - 20, 4, 3); });
  sky('bgNear', 640, 160, '#120c20', '#2ecc71', 40, 120, 11, (cc, x, y, w) => {   // water tanks + LOCz signs
    cc.fillStyle = '#120c20'; cc.fillRect(x + 6, y - 26, 20, 20); cc.fillRect(x + 8, y - 6, 2, 6); cc.fillRect(x + 22, y - 6, 2, 6);
    cc.fillStyle = '#2ecc71'; cc.font = 'bold 9px monospace'; cc.fillText('LOCz', x + 4, y + 14); });
  // moon + clouds texture
  t = scene.textures.createCanvas('moon', 64, 64); c = t.getContext();
  c.fillStyle = 'rgba(255,240,180,0.15)'; c.beginPath(); c.arc(32, 32, 32, 0, 7); c.fill();
  c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(32, 32, 20, 0, 7); c.fill(); c.fillStyle = '#e8d890'; c.fillRect(24, 26, 5, 5); c.fillRect(36, 36, 7, 4); t.refresh();
  // bullets for each blaster
  const dot = (key, w, h, col, core) => { const tt = scene.textures.createCanvas(key, w, h), cc = tt.getContext();
    cc.fillStyle = col; cc.beginPath(); cc.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); cc.fill();
    cc.fillStyle = core; cc.beginPath(); cc.ellipse(w / 2, h / 2, w / 4, h / 4, 0, 0, 7); cc.fill(); tt.refresh(); };
  dot('b_spread', 10, 10, '#ffc400', '#fff6c0');
  dot('b_heavy', 20, 20, '#e02020', '#ffd0a0');
  dot('b_cloud', 28, 28, 'rgba(155,61,214,0.6)', 'rgba(220,170,255,0.7)');
  dot('b_enemy', 10, 10, '#ff4060', '#ffffff');
  t = scene.textures.createCanvas('b_bolt', 22, 8); c = t.getContext();
  c.strokeStyle = '#7fdcff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 4); c.lineTo(6, 1); c.lineTo(11, 7); c.lineTo(16, 1); c.lineTo(22, 4); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); t.refresh();
  t = scene.textures.createCanvas('b_beam', 40, 6); c = t.getContext();
  c.fillStyle = '#bfefff'; c.fillRect(0, 0, 40, 6); c.fillStyle = '#fff'; c.fillRect(0, 2, 40, 2); t.refresh();
  t = scene.textures.createCanvas('b_spam', 12, 9); c = t.getContext();          // spam e-mail shot
  c.fillStyle = '#fff'; c.fillRect(0, 0, 12, 9); c.fillStyle = '#ff4060'; c.beginPath(); c.moveTo(0, 0); c.lineTo(6, 5); c.lineTo(12, 0); c.fill(); t.refresh();
  t = scene.textures.createCanvas('lock', 14, 16); c = t.getContext();          // boss padlock throw
  c.strokeStyle = '#c0c0c0'; c.lineWidth = 3; c.beginPath(); c.arc(7, 6, 4, Math.PI, 0); c.stroke();
  c.fillStyle = '#ffd700'; c.fillRect(1, 6, 12, 10); c.fillStyle = '#0b0b14'; c.fillRect(6, 9, 2, 4); t.refresh();
  t = scene.textures.createCanvas('chainlink', 8, 6); c = t.getContext();
  c.strokeStyle = '#9aff9a'; c.lineWidth = 2; c.strokeRect(1, 1, 6, 4); t.refresh();
  // pickups
  const coin = (key, col) => { const tt = scene.textures.createCanvas(key, 16, 16), cc = tt.getContext();
    cc.fillStyle = '#0b0b14'; cc.beginPath(); cc.arc(8, 8, 8, 0, 7); cc.fill(); cc.fillStyle = hx(col); cc.beginPath(); cc.arc(8, 8, 6.5, 0, 7); cc.fill();
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
