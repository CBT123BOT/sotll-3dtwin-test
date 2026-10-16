// =====================================================================
//  GAME: scenes for the 3D TwiN preview (Mega Man style run-and-gun)
//  Boot -> Title -> Select (stage/leader grid) -> Stage -> Weapon Get -> Preview End
// =====================================================================
const PARAMS = new URLSearchParams(location.search);
const DEBUG = PARAMS.get('debug') === '1';
let RUN = null;
let PIECE = null;   // holder piece (preview: ?piece=0878 loads real traits from traits_sample.json)   // { leader, lives, score, weapons: ['blaster', ...] }
const txt = (s, x, y, msg, size, color) => s.add.text(x, y, msg, { fontFamily: 'monospace', fontSize: (size || 12) + 'px',
  color: color || '#fff', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
const hexs = c => '#' + c.toString(16).padStart(6, '0');
const leaderBy = key => LEADERS.find(l => l.key === key);

// Menus read Player 1's keys + touch. start = Enter / punch / jump / START / tap.
function menuInput(scene) {
  const pad = makePad(scene, 1), enter = scene.input.keyboard.addKey('ENTER'); let pe = false, ps = false;
  return () => { const r = pad.read(); const e = enter.isDown && !pe; pe = enter.isDown; const s = TOUCH.start && !ps; ps = TOUCH.start;
    return { r, start: e || s || r.pressed.jump || r.pressed.shoot }; };
}

// ---------- Boot: load the 5 small head/card images, draw all sprites ----------
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { LEADERS.forEach(L => { this.load.image('head_' + L.key, 'assets/head_' + L.key + '.png'); this.load.image('card_' + L.key, 'assets/card_' + L.key + '.jpg'); }); }
  create() {
    { const t0 = performance.now(); makeAllArt(this); window.ART_MS = Math.round(performance.now() - t0); } setupTouch();
    if (PARAMS.get('piece')) { loadPieceTraits(PARAMS.get('piece')).then(d => { PIECE = d; this.go(); }); return; }
    this.go();
  }
  go() {
    if (DEBUG && PARAMS.get('stage')) { RUN = newRun(PARAMS.get('pick') || 'gold'); return this.scene.start('Stage', { id: PARAMS.get('stage') }); }
    this.scene.start('Title');
  }
}
function newRun(leaderKey) {
  const perks = perksFromTraits(PIECE ? PIECE.traits : {});
  return { leader: leaderKey, lives: SETTINGS.START_LIVES + perks.lives, score: 0, weapons: ['blaster'], perks, piece: PIECE, up: { heart: false, subtank: false, armor: false }, tank: 0 };
}
const addScore = n => { RUN.score += Math.round(n * RUN.perks.score); };

// ---------- Title ----------
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x1a1030).setOrigin(0);
    this.add.tileSprite(0, 160, 640, 200, 'bgFar').setOrigin(0);
    this.add.tileSprite(0, 200, 640, 160, 'bgNear').setOrigin(0);
    txt(this, 320, 70, SETTINGS.TITLE_TEXT, 48, SETTINGS.TITLE_COLOR).setStroke('#7a2a00', 8);
    txt(this, 320, 115, SETTINGS.SUBTITLE_TEXT, 18);
    txt(this, 320, 140, SETTINGS.EDITION_TEXT, 12, '#7fdcff');
    LEADERS.forEach((L, i) => this.add.image(160 + i * 80, 210, 'head_' + L.key).setScale(1.6));
    this.blink = txt(this, 320, 268, IS_TOUCH ? 'TAP TO START' : 'PRESS ENTER', 16, '#ffd34d');
    txt(this, 320, 345, 'Original fan-made pixel art • Mickel Nickels are in-game only', 8, '#999');
    this.inp = menuInput(this); this.input.on('pointerdown', () => this.go());
  }
  go() { if (this.done) return; this.done = true; Sound.init(); Sound.select(); this.scene.start('Story'); }
  update(t) { this.blink.setVisible(Math.floor(t / 400) % 2 === 0); if (this.inp().start) this.go(); }
}

// ---------- Story intro (same Lost Ledger story as the beta) ----------
class Story extends Phaser.Scene {
  constructor() { super('Story'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x000000).setOrigin(0);
    txt(this, 320, 40, 'THE LOST LEDGER', 22, '#ffd34d');
    STORY_LINES.forEach((l, i) => { const t = txt(this, 320, 90 + i * 24, l, 13, '#e0e0ff').setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, delay: 300 + i * 600, duration: 300 }); });
    txt(this, 320, 340, IS_TOUCH ? 'tap to continue' : 'ENTER to continue', 10, '#888');
    this.inp = menuInput(this); this.input.on('pointerdown', () => this.go()); this.time.delayedCall(8000, () => this.go());
  }
  go() { if (this.done) return; this.done = true; this.scene.start('Select'); }
  update() { if (this.time.now > 300 && this.inp().start) this.go(); }
}

// ---------- Leaderboard (same localStorage idea as the beta, separate list) ----------
const Scores = {
  KEY: 'cryptoBros3DTwinScores',
  load() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } },
  add(e) { const a = this.load(); a.push(e); a.sort((x, y) => y.score - x.score); try { localStorage.setItem(this.KEY, JSON.stringify(a.slice(0, 10))); } catch (er) {} }
};
function saveScore() { const L = leaderBy(RUN.leader); Scores.add({ name: L.name, team: L.team, score: RUN.score, date: new Date().toISOString().slice(0, 10) }); }
class Leaderboard extends Phaser.Scene {
  constructor() { super('Leaderboard'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x0a0a2a).setOrigin(0);
    txt(this, 320, 30, 'LEADERBOARD (this device)', 18, '#ffd34d');
    const all = Scores.load(); if (!all.length) txt(this, 320, 160, 'No scores yet!', 12);
    all.forEach((s, i) => { const L = LEADERS.find(l => l.team === s.team); txt(this, 320, 70 + i * 22, `${i + 1}. ${String(s.score).padStart(7)}  ${s.name}  [${s.team}]`, 11, L ? hexs(L.color) : '#fff'); });
    txt(this, 320, 340, IS_TOUCH ? 'tap for title' : 'ENTER for title', 10, '#888');
    this.inp = menuInput(this); this.time.delayedCall(700, () => this.ok = true); this.input.on('pointerdown', () => this.ok && this.scene.start('Title'));
  }
  update() { if (this.ok && this.inp().start) this.scene.start('Title'); }
}

// ---------- Stage select (Mega Man style grid of the 5 leaders) ----------
class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x0a0a2a).setOrigin(0);
    for (let y = 0; y < 360; y += 8) this.add.rectangle(0, y, 640, 1, 0x14144a).setOrigin(0);
    txt(this, 320, 18, 'STAGE SELECT', 20, '#ffd34d');
    // layout: 3 on top, 2 below (like a Mega Man grid)
    const pos = [[160, 88], [320, 88], [480, 88], [240, 248], [400, 248]];
    this.cells = SELECT_GRID.map((g, i) => {
      const L = leaderBy(g.leader), [x, y] = pos[i];
      const frame = this.add.rectangle(x, y, 104, 104, 0x000000).setStrokeStyle(4, g.open ? L.color : 0x444466);
      const img = this.add.image(x, y, 'card_' + L.key).setDisplaySize(96, 96);
      if (!g.open) { img.setTint(0x444444); txt(this, x, y, 'COMING\nSOON', 12, '#aaa'); }
      txt(this, x, y + 64, L.name, 10, hexs(L.color));
      txt(this, x, y + 77, L.blaster.name + ' • ' + L.perkName, 7, '#ccc');
      frame.setInteractive().on('pointerdown', () => { this.sel = i; this.pick(); });
      return { frame, x, y };
    });
    this.sel = 0;
    this.cursor = this.add.rectangle(0, 0, 116, 116).setStrokeStyle(3, 0xffffff);
    this.info = txt(this, 320, 350, '', 10, '#fff');
    this.inp = menuInput(this);
  }
  pick() {
    const g = SELECT_GRID[this.sel];
    if (!g.open) { Sound.hurt(); this.info.setText('Coming soon! Only Frankie Pumpkins / LOCz Rooftops is open in this preview.'); return; }
    if (this.done) return; this.done = true; Sound.select();
    RUN = newRun(g.leader);
    this.cameras.main.flash(200);
    this.time.delayedCall(300, () => this.scene.start('Stage', { id: g.stage }));
  }
  update(t) {
    const { r, start } = this.inp();
    if (r.pressed.right) this.sel = (this.sel + 1) % 5;
    if (r.pressed.left) this.sel = (this.sel + 4) % 5;
    if (r.pressed.down && this.sel < 3) this.sel = Math.min(4, this.sel + 3);
    if (r.pressed.up && this.sel >= 3) this.sel -= 3;
    const c = this.cells[this.sel]; this.cursor.setPosition(c.x, c.y).setVisible(Math.floor(t / 250) % 2 === 0);
    const g = SELECT_GRID[this.sel], L = leaderBy(g.leader);
    if (!this.info.text.startsWith('Coming')) this.info.setText(g.open ? `${L.name} vs ${STAGES[0].gang} — press ${IS_TOUCH ? 'P / tap' : 'Enter'}` : 'COMING SOON');
    if (r.pressed.left || r.pressed.right || r.pressed.up || r.pressed.down) { Sound.whiff(); this.info.setText(''); }
    if (start) this.pick();
  }
}

// =====================================================================
//  STAGE: the run-and-gun level
// =====================================================================
class Stage extends Phaser.Scene {
  constructor() { super('Stage'); }
  init(d) { this.S = STAGES.find(s => s.id === d.id) || STAGES[0]; }

  // ----- build the level from the STAGES data -----
  create() {
    const S = this.S, W = S.width;
    this.L = leaderBy(RUN.leader);
    this.physics.world.gravity.y = SETTINGS.GRAVITY;
    this.physics.world.setBounds(0, -200, W, 800);
    // parallax background (3 layers that scroll at different speeds)
    // v2: 6 parallax layers (sky gradient, stars, haze, far, mid, near) + a foreground silhouette layer
    this.add.image(0, 0, 'skyGrad').setOrigin(0).setScrollFactor(0).setDisplaySize(640, 360);
    this.stars = this.add.tileSprite(0, 0, 640, 160, 'stars').setOrigin(0).setScrollFactor(0);
    this.add.image(520, 60, 'moon').setScrollFactor(0);
    this.add.image(520, 60, 'glow').setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD).setScale(3).setAlpha(0.35).setTint(0xfff0b0);
    this.haze = this.add.tileSprite(0, 110, 640, 200, 'bgHaze').setOrigin(0).setScrollFactor(0);
    this.far = this.add.tileSprite(0, 130, 640, 200, 'bgFar').setOrigin(0).setScrollFactor(0);
    this.mid = this.add.tileSprite(0, 150, 640, 220, 'bgMid').setOrigin(0).setScrollFactor(0);
    this.near = this.add.tileSprite(0, 225, 640, 160, 'bgNear').setOrigin(0).setScrollFactor(0);
    this.fg = this.add.tileSprite(0, 300, 640, 70, 'fg').setOrigin(0).setScrollFactor(0).setDepth(40).setAlpha(0.92);
    // solid ground: rooftops (+ building walls below) and girders
    this.solids = this.physics.add.staticGroup(); this.lightPools = [];
    S.roofs.forEach(([x, w, y]) => {
      this.add.tileSprite(x, y + 16, w, 400, 'wall').setOrigin(0);
      this.add.tileSprite(x, y, w, 16, 'roof').setOrigin(0);
      const z = this.add.zone(x, y, w, 420).setOrigin(0); this.physics.add.existing(z, true); this.solids.add(z);   // solid block down to the bottom: walls for wall-jumps
      // street lamps with warm light pools (ADD glow, cheap)
      for (let lx = x + 120; lx < x + w - 40; lx += 280) {
        this.add.image(lx, y - 28, 'lamp').setDepth(1);
        this.lightPools.push(this.add.image(lx, y - 6, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc870).setAlpha(0.5).setScale(2.4, 1.1).setDepth(2));
        this.lightPools.push(this.add.image(lx + 2, y - 50, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0c0).setAlpha(0.7).setScale(0.5).setDepth(2));
      }
    });
    (S.pillars || []).forEach(([x, w, y, y2]) => {
      this.add.tileSprite(x, y + 12, w, y2 - y - 12, 'wall').setOrigin(0).setDepth(3); this.add.tileSprite(x, y, w, 16, 'roof').setOrigin(0).setDepth(3);
      this.add.tileSprite(x, y2 - 6, w, 6, 'girder').setOrigin(0).setDepth(3);
      const z = this.add.zone(x, y, w, y2 - y).setOrigin(0); this.physics.add.existing(z, true); this.solids.add(z); });
    (S.ledges || []).forEach(([x, w, y]) => { const g = this.add.tileSprite(x, y, w, 12, 'girder').setOrigin(0); this.physics.add.existing(g, true); this.solids.add(g); });
    S.girders.forEach(([x, w, y]) => { const g = this.add.tileSprite(x, y, w, 12, 'girder').setOrigin(0); this.physics.add.existing(g, true); this.solids.add(g); });
    // groups
    this.shots = this.physics.add.group({ allowGravity: false });
    this.enemyShots = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.items = this.physics.add.group();
    S.enemies.forEach(([type, x]) => this.spawnEnemy(type, x));
    S.items.forEach(([k, x, y]) => this.spawnItem(k, x, y, true));
    (S.secrets || []).forEach(([k, x, y]) => { if (!RUN.up[k]) { const it = this.spawnItem(k, x, y, true); this.tweens.add({ targets: it, y: y - 4, yoyo: true, repeat: -1, duration: 600 }); this.lightPools.push(this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(PICKUPS[k].color).setAlpha(0.45).setDepth(7)); } });
    // player
    this.checkpoint = 80;
    this.makePlayer();
    this.initFx();
    // collisions
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.items, this.solids);
    this.physics.add.overlap(this.shots, this.enemies, (s, e) => this.shotHits(s, e));
    this.physics.add.overlap(this.player, this.enemies, (p, e) => this.hurtPlayer(e.dmg || 3, e.x));
    this.physics.add.overlap(this.player, this.enemyShots, (p, s) => { this.hurtPlayer(s.dmg, s.x); s.destroy(); });
    this.physics.add.overlap(this.player, this.items, (p, it) => this.pickup(it));
    // camera
    this.cameras.main.setBounds(0, 0, W, 360);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.1, 0, 40);
    this.makeHud();
    this.pad = makePad(this, 1);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    if (DEBUG) this.input.keyboard.on('keydown-B', () => { this.player.setPosition(S.arenaX + 60, 200); });
    Sound.startMusic(S.music);
    this.banner(S.name + '\n' + S.gang + '\nREADY', 1600);
    window.STAGE = this;
  }

  banner(msg, ms) {
    const t = txt(this, 320, 150, msg, 20, '#fff').setScrollFactor(0).setDepth(100);
    this.time.delayedCall(ms, () => t.destroy()); return t;
  }

  makePlayer() {
    const p = this.physics.add.sprite(this.checkpoint, 200, 'hero_' + this.L.key, 'idle');
    p.body.setSize(20, 46).setOffset(14, 18);
    p.setDepth(10); p.facing = 1;
    this.maxHp = SETTINGS.MAX_HP + RUN.perks.maxHp + (RUN.up.heart ? SETTINGS.HEART_TANK_HP : 0); this.maxEn = SETTINGS.MAX_ENERGY + RUN.perks.maxEnergy;
    p.hp = this.maxHp; p.energy = this.maxEn; p.invulnUntil = 0; p.nextShot = 0; p.punchUntil = 0; p.glowUntil = 0; p.hurtUntil = 0;
    p.weapon = 0;   // index into RUN.weapons
    this.player = p;
    this.head = this.add.image(0, 0, 'head_' + this.L.key).setDepth(11);
  }

  // ----- enemies -----
  spawnEnemy(type, x) {
    const D = ENEMIES[type], roof = this.S.roofs.concat(this.S.girders).find(([rx, w]) => x >= rx && x <= rx + w);
    let e;
    if (type === 'scambot') {
      e = this.physics.add.sprite(x, (roof ? roof[2] : 300) - 30, 'scambot', 'walk1');
      e.body.setSize(28, 44).setOffset(6, 4);
      e.minX = roof ? roof[0] + 16 : x - 100; e.maxX = roof ? roof[0] + roof[1] - 16 : x + 100;
      e.nextShot = 0;
    } else {
      e = this.physics.add.sprite(x, 150, 'phish', 'f1');
      e.body.setAllowGravity(false); e.body.setSize(30, 18).setOffset(4, 8);
      e.baseY = 140 + Math.random() * 40; e.homeX = x; e.mode = 'hover';
    }
    this.enemies.add(e);
    if (type === 'phish') e.body.setAllowGravity(false);
    Object.assign(e, { type, hp: D.hp, dmg: D.dmg, speed: D.speed, score: D.score, dir: -1, frozenUntil: 0 });
    return e;
  }

  updateEnemies(time, dt) {
    const p = this.player, cam = this.cameras.main;
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return;
      const near = Math.abs(e.x - p.x) < 380;
      const frozen = time < e.frozenUntil;
      e.setTint(frozen ? 0x9aff9a : 0xffffff); if (!frozen && !e.flash) e.clearTint();
      if (frozen) { e.body.setVelocityX(0); if (e.type === 'phish') e.body.setVelocityY(0); return; }
      if (e.boss) return this.updateBoss(e, time);
      if (!near) { e.body.setVelocityX(0); if (e.type === 'phish') e.body.setVelocityY(0); return; }
      if (e.type === 'scambot') {
        // patrol its rooftop; stop and fire spam mail when you're in front
        const facingP = Math.sign(p.x - e.x);
        if (Math.abs(p.y - e.y) < 60 && Math.abs(p.x - e.x) < 300 && time > e.nextShot) {
          e.dir = facingP; e.setFrame('shoot'); e.body.setVelocityX(0);
          if (!e.shooting) { e.shooting = true; this.time.delayedCall(250, () => { if (e.active) { this.enemyShoot(e.x + e.dir * 18, e.y - 2, e.dir * 200, 0, 'b_spam', e.dmg); e.shooting = false; } }); }
          e.nextShot = time + 1800 + Math.random() * 600;
        } else if (!e.shooting) {
          if (e.x <= e.minX) e.dir = 1; if (e.x >= e.maxX) e.dir = -1;
          e.body.setVelocityX(e.dir * e.speed); e.setFrame(Math.floor(time / 200) % 2 ? 'walk1' : 'walk2');
        }
        e.setFlipX(e.dir < 0);   // art faces right; flip when walking/shooting left
      } else {
        // Phish Drone: hover in a wave, then swoop at you
        e.setFrame(Math.floor(time / 80) % 2 ? 'f1' : 'f2');
        e.setFlipX(p.x > e.x);
        if (e.mode === 'hover') {
          e.body.setVelocity(Math.sign(p.x - e.x) * 30, (e.baseY + Math.sin(time / 300) * 20 - e.y) * 3);
          if (Math.abs(p.x - e.x) < 170 && time > (e.nextSwoop || 0)) { e.mode = 'swoop'; e.swoopEnd = time + 900;
            const a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y - 10); e.body.setVelocity(Math.cos(a) * 240, Math.sin(a) * 240); }
        } else if (time > e.swoopEnd) { e.mode = 'hover'; e.nextSwoop = time + 1600; }
      }
    });
  }

  enemyShoot(x, y, vx, vy, tex, dmg) {
    const s = this.enemyShots.create(x, y, tex); if (tex === 'b_enemy') s.setBlendMode(Phaser.BlendModes.ADD); s.body.setAllowGravity(false); s.setVelocity(vx, vy); s.dmg = dmg; s.born = this.time.now; s.setDepth(9);
    return s;
  }

  // Rage perk (Sho'nuff Red): the lower your health, the harder you hit
  dmgMult() { const p = this.player; let m = this.L.power * (this.time.now < p.glowUntil ? 2 : 1);
    if (this.L.perk === 'rage') m *= 1 + PERKS.rageMaxBonus * (1 - p.hp / this.maxHp); return m * RUN.perks.dmg; }

  // ----- player shooting / kicking -----
  fire(time) {
    const p = this.player, w = RUN.weapons[p.weapon];
    if (time < p.nextShot) return;
    if (w === 'lockchain') return this.fireChain(time);
    const B = this.L.blaster, glow = time < p.glowUntil;
    // Out of energy? You still get a small free pea shot (so you're never stuck), like Mega Man's buster
    const empty = p.energy < B.cost;
    if (empty) { p.nextShot = time + 300; p.shootPose = time + 150; this.shotCount = (this.shotCount || 0) + 1;
      const s = this.shots.create(p.x + p.facing * 22, p.y - 2, 'b_spread'); s.body.setAllowGravity(false); s.setVelocity(380 * p.facing, 0); s.dmg = 1 * this.dmgMult(); s.born = time; s.setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setScale(0.7); this.flash(p.x + p.facing * 24, p.y - 2, 0xffe080, 0.3); Sound.shoot(); return; }
    p.energy -= B.cost; this.shotCount = (this.shotCount || 0) + 1; p.nextShot = time + B.rate * (glow ? 0.6 : 1); p.shootPose = time + 180;
    const x = p.x + p.facing * 22, y = p.y - 2, dmg = B.dmg * this.dmgMult();
    const mk = (tex, vx, vy, extra) => { const s = this.shots.create(x, y, tex); s.body.setAllowGravity(false); s.setVelocity(vx * RUN.perks.shotSpeed, vy * RUN.perks.shotSpeed); s.dmg = dmg; s.born = time; s.setFlipX(p.facing < 0); s.setDepth(9).setBlendMode(Phaser.BlendModes.ADD); s.trailColor = B.color || this.L.glow; return Object.assign(s, extra || {}); };
    this.flash(x + p.facing * 4, y, this.L.key === 'diamond' ? 0xffffff : this.L.glow, B.kind === 'heavy' ? 0.9 : 0.5, 110);   // muzzle flash
    if (B.kind === 'spread') [-0.22, 0, 0.22].forEach(a => mk('b_spread', Math.cos(a) * B.speed * p.facing, Math.sin(a) * B.speed));
    else if (B.kind === 'heavy') { const h = mk('b_heavy', B.speed * p.facing, 0, { pierce: false }); this.tweens.add({ targets: h, scale: { from: 0.6, to: 1.15 }, duration: 120 }); this.cameras.main.shake(70, 0.005); p.x -= p.facing * 3; this.burst(x, y, 0xff6030, 5); }
    else if (B.kind === 'bolt') { const b = mk('b_bolt', B.speed * p.facing, Phaser.Math.Between(-20, 20)); b.flicker = true; }
    else if (B.kind === 'cloud') { const c = mk('b_cloud', B.speed * p.facing, 0, { cloud: true, life: 1300 * RUN.perks.cloudLife }); this.tweens.add({ targets: c, scale: 2, angle: 360 * p.facing, alpha: { from: 1, to: 0.6 }, duration: 1200 }); }
    else if (B.kind === 'beam') { const bm = mk('b_beam', B.speed * p.facing, 0, { pierce: true }); this.tweens.add({ targets: bm, scaleX: { from: 0.3, to: 1.6 }, scaleY: { from: 1.6, to: 1 }, duration: 140 }); }
    Sound.shoot();
  }

  // CHARGED SHOT: a big glowing version of the team blaster (pierces, hits hard)
  fireCharged(time) {
    const p = this.player, w = RUN.weapons[p.weapon];
    if (w === 'lockchain') return;
    const B = this.L.blaster, x = p.x + p.facing * 24, y = p.y - 2, col = this.L.key === 'diamond' ? 0xffffff : this.L.glow;
    const s = this.shots.create(x, y, 'b_charge'); s.body.setAllowGravity(false); s.body.setSize(28, 28);
    s.setVelocity(Math.max(360, B.speed) * p.facing, 0); s.dmg = B.dmg * SETTINGS.CHARGE_DMG * this.dmgMult(); s.born = time; s.pierce = true; s.charged = true; s.trailColor = col;
    s.setTint(col).setBlendMode(Phaser.BlendModes.ADD).setDepth(9).setScale(1.2);
    this.tweens.add({ targets: s, scaleY: { from: 1.5, to: 0.9 }, duration: 120, yoyo: true, repeat: -1 });
    this.chargedShots = (this.chargedShots || 0) + 1; p.shootPose = time + 220; p.nextShot = time + 250;
    this.flash(x, y, col, 1.6, 200); this.cameras.main.shake(90, 0.006); this.burst(x, y, col, 10); p.x -= p.facing * 4; Sound.special();
  }

  // Lock Chain (boss power): a chain lashes out, damages and FREEZES what it hits
  fireChain(time) {
    const p = this.player, C = LOCK_CHAIN;
    if (p.energy < C.cost) { p.nextShot = time + 200; Sound.whiff(); return; }
    p.energy -= C.cost; p.nextShot = time + C.rate; p.shootPose = time + 250;
    const x0 = p.x + p.facing * 20, y = p.y - 2;
    for (let i = 0; i < C.reach; i += 9) {
      const l = this.add.image(x0 + i * p.facing, y + Math.sin(i / 12) * 4, 'chainlink').setDepth(9).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setScale(1.3);
      this.tweens.add({ targets: l, alpha: 1, y: y, delay: i * 0.8, duration: 50, yoyo: true, hold: 140, onComplete: () => l.destroy() });
    }
    this.time.delayedCall(C.reach * 0.8, () => { this.flash(x0 + C.reach * p.facing, y, LOCK_CHAIN.color, 0.8, 160); this.burst(x0 + C.reach * p.facing, y, LOCK_CHAIN.color, 8); });
    this.flash(x0, y, LOCK_CHAIN.color, 0.6);
    this.enemies.getChildren().forEach(e => {
      const dx = (e.x - p.x) * p.facing;
      if (e.active && dx > 0 && dx < C.reach + 20 && Math.abs(e.y - p.y) < 40) { e.frozenUntil = time + (e.boss ? 600 : C.freezeMs); this.damageEnemy(e, C.dmg); }
    });
    Sound.punch();
  }

  punch(time) {
    const p = this.player;
    if (time < p.punchUntil + 120) return;
    p.punchUntil = time + 180; Sound.punch();
    this.enemies.getChildren().forEach(e => {
      const dx = (e.x - p.x) * p.facing;
      if (e.active && dx > -6 && dx < 46 + (e.boss ? 20 : 0) && Math.abs(e.y - p.y) < 44) {
        this.damageEnemy(e, SETTINGS.KICK_DAMAGE * this.dmgMult());
        if (!e.boss) e.body.setVelocityX(p.facing * 160);
      }
    });
  }

  shotHits(s, e) {
    if (!s.active || !e.active) return;
    if (s.cloud) { if (this.time.now < (e.cloudTick || 0)) return; e.cloudTick = this.time.now + 250; this.damageEnemy(e, s.dmg); return; }
    if (s.pierce) { s.hitList = s.hitList || []; if (s.hitList.includes(e)) return; s.hitList.push(e); }
    this.damageEnemy(e, s.dmg);
    if (!s.pierce) s.destroy();
  }

  damageEnemy(e, dmg) {
    if (!e.active) return;
    e.hp -= dmg; Sound.hit();
    e.flash = true; e.setTintFill(0xffffff); this.time.delayedCall(60, () => { if (e.active) { e.flash = false; e.clearTint(); } });
    this.burst(e.x, e.y - 10, 0xffee88, 6); this.dmgNumber(e.x, e.y - (e.boss ? 54 : 26), dmg, e.boss ? '#ffe066' : '#fff');
    if (e.boss) { this.hitStop(40); this.cameras.main.shake(60, 0.004); }
    if (e.hp <= 0) {
      addScore(e.score || 0);
      this.burst(e.x, e.y, 0xff9944, 18); this.flash(e.x, e.y, 0xffaa44, 1.4, 180);
      this.hitStop(FX_SETTINGS.HIT_STOP_MS); this.cameras.main.shake(90, FX_SETTINGS.SHAKE_ON_KILL);
      if (e.boss) return this.bossDefeated(e);
      this.rollDrop(e.x, e.y - 10);
      e.destroy();
    }
  }

  // Simple, cheap particles: a few tweened squares (no particle system needed)
  puff(x, y, color, n) {
    if (this.sparks) return this.burst(x, y, color, n * 2);
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'px').setTint(color).setDepth(20);
      this.tweens.add({ targets: s, x: x + Phaser.Math.Between(-22, 22), y: y + Phaser.Math.Between(-22, 22), alpha: 0, duration: 300, onComplete: () => s.destroy() });
    }
  }

  // ----- pickups -----
  rollDrop(x, y) {
    let r = Math.random();
    for (const [k, ch] of DROP_TABLE) { if (r < ch) return this.spawnItem(k, x, y); r -= ch; }
  }
  spawnItem(kind, x, y, fixed) {
    const it = this.items.create(x, y, 'p_' + kind); it.kind = kind; it.born = this.time.now; it.fixed = fixed; it.setDepth(8);
    it.body.setSize(14, 14); it.setVelocityY(-150);
    if (fixed) it.body.setAllowGravity(false), it.setVelocityY(0);
    return it;
  }
  pickup(it) {
    const P = PICKUPS[it.kind], p = this.player;
    if (P.hp) p.hp = Math.min(this.maxHp, p.hp + P.hp);
    if (P.energy || RUN.perks.pickupEnergy) p.energy = Math.min(this.maxEn, p.energy + (P.energy || 0) + RUN.perks.pickupEnergy);
    if (P.life) RUN.lives++;
    if (P.upgrade) this.getUpgrade(P.upgrade);
    if (P.hp && p.hp >= this.maxHp && RUN.up.subtank) RUN.tank = Math.min(SETTINGS.SUBTANK_MAX, RUN.tank + P.hp);   // spare health fills the Cold Wallet
    addScore(P.score); Sound.coin();
    const t = txt(this, it.x, it.y - 24, P.label, 13, hexs(P.color === 0x23292f ? 0xe8eef5 : P.color)).setDepth(50);
    this.tweens.add({ targets: t, y: t.y - 28, alpha: 0, duration: 1400, onComplete: () => t.destroy() });
    if (it.kind === 'gold') this.goldSpecial();
    it.destroy();
  }

  getUpgrade(k) {
    const p = this.player; RUN.up[k] = true;
    if (k === 'heart') { this.maxHp += SETTINGS.HEART_TANK_HP; p.hp = this.maxHp; this.buildHpBar(); }
    if (k === 'subtank') RUN.tank = 8;
    this.cameras.main.flash(300, 160, 230, 255); this.burst(p.x, p.y, PICKUPS[k].color, 24); Sound.special();
    this.banner(PICKUPS[k].label.replace('! ', '!\n'), 1400);
  }

  // GOLD NICKEL: glow in team color (Diamond = white), smash everything on screen, 2x power for a while
  goldSpecial() {
    const p = this.player, c = this.L.key === 'diamond' ? 0xffffff : this.L.glow;
    p.glowUntil = this.time.now + PICKUPS.gold.glowMs + RUN.perks.glowMs; p.glowColor = c;
    this.cameras.main.flash(250, (c >> 16) & 255, (c >> 8) & 255, c & 255); this.cameras.main.shake(300, 0.01);
    Sound.special();
    this.banner(this.L.special + '!!', 1000);
    const ring = this.add.image(p.x, p.y, 'ring').setTint(c).setDepth(30);
    this.tweens.add({ targets: ring, scale: 14, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
    const cam = this.cameras.main;
    this.enemies.getChildren().forEach(e => { if (e.active && e.x > cam.scrollX && e.x < cam.scrollX + 640) this.damageEnemy(e, e.boss ? 10 : 99); });
  }

  // ----- getting hurt / falling -----
  hurtPlayer(dmg, fromX) {
    const p = this.player, now = this.time.now;
    if (now < p.invulnUntil || now < p.glowUntil || this.ended) return;
    p.hp -= dmg * (this.L.armor || 1) * RUN.perks.armor * (RUN.up.armor ? SETTINGS.ARMOR_DAMAGE : 1); p.invulnUntil = now + SETTINGS.HURT_INVULN_MS; p.hurtUntil = now + 300;
    p.setVelocity(Math.sign(p.x - fromX || 1) * 160, -220);
    Sound.hurt(); this.cameras.main.shake(120, 0.008); this.flash(p.x, p.y, 0xff4060, 1, 150);
    this.useTank();
    if (p.hp <= 0) this.loseLife();
  }
  // Cold Wallet (stored health): when health gets low, the stored health pours back in automatically
  useTank() { const p = this.player;
    if (RUN.tank > 0 && p.hp > 0 && p.hp <= SETTINGS.SUBTANK_AUTO_AT) { const n = Math.min(RUN.tank, this.maxHp - p.hp); p.hp += n; RUN.tank -= n; this.banner('COLD WALLET!', 700); Sound.coin(); this.flash(p.x, p.y, 0x3aa0ff, 1.5, 300); } }
  loseLife() {
    if (this.dying) return; this.dying = true;
    RUN.lives--; Sound.hurt();
    this.puff(this.player.x, this.player.y, this.L.color, 12);
    this.player.setVisible(false); this.head.setVisible(false); this.player.body.enable = false;
    this.time.delayedCall(1200, () => {
      if (RUN.lives < 0) { Sound.stopMusic(); return this.scene.start('GameOver'); }
      const p = this.player; p.body.enable = true; this.head.setVisible(true);
      p.setPosition(this.checkpoint, 150); p.setVelocity(0, 0); p.hp = this.maxHp; p.invulnUntil = this.time.now + 1500;
      this.dying = false;
    });
  }

  // ----- the boss -----
  startBoss() {
    if (this.bossStarted) return; this.bossStarted = true;
    const S = this.S, B = BOSSES[S.boss];
    this.cameras.main.stopFollow(); this.cameras.main.pan(S.arenaX + 320 - 40, 180, 600);
    this.arenaMin = S.arenaX + 4; this.arenaMax = S.arenaX + 640 - 60;
    this.checkpoint = S.arenaX + 80;
    this.time.delayedCall(700, () => {
      const b = this.physics.add.sprite(S.arenaX + 520, 150, 'don', 'idle'); b.body.setSize(52, 88).setOffset(14, 8);
      Object.assign(b, { boss: true, hp: B.hp, maxHp: B.hp, dmg: B.contactDmg, score: 5000, B, nextHop: this.time.now + 1200, nextThrow: this.time.now + 900, frozenUntil: 0 });
      this.enemies.add(b); this.boss = b; this.bossActive = true;
      this.banner('BOSS: ' + B.name, 1400);
    });
  }
  updateBoss(b, time) {
    const p = this.player, B = b.B;
    b.setFlipX(p.x > b.x);
    // TELEGRAPH: he flashes yellow and shows "!" just before he hops or throws
    const T = B.telegraphMs, soon = (time > b.nextHop - T && time < b.nextHop) || (time > b.nextThrow - T && time < b.nextThrow);
    if (!b.warn) b.warn = txt(this, b.x, b.y - 60, '!', 22, '#ffe066').setDepth(60);
    b.warn.setPosition(b.x, b.y - 62).setVisible(soon && b.body.blocked.down);
    if (soon && !b.flash) { Math.floor(time / 80) % 2 ? b.setTint(0xffe066) : b.clearTint(); }
    if (!b.tg) b.tg = this.add.image(b.x, b.y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe066).setScale(3).setDepth(8);
    b.tg.setPosition(b.x, b.y).setVisible(soon && b.body.blocked.down).setAlpha(0.35 + Math.sin(time / 40) * 0.2);
    if (b.body.blocked.down) {
      b.body.setVelocityX(0);
      if (time > b.nextHop) { b.body.setVelocity(Math.sign(p.x - b.x) * Phaser.Math.Between(120, 220), -520); b.nextHop = time + B.hopEveryMs; b.setFrame('jump'); }
      else if (time > b.nextThrow) {
        // throw 2 padlocks in an arc
        b.setFrame('throw'); b.nextThrow = time + B.throwEveryMs;
        [0, 1].forEach(i => { const s = this.enemyShoot(b.x, b.y - 30, Math.sign(p.x - b.x) * (140 + i * 90), -300, 'lock', B.lockDmg); s.body.setAllowGravity(true); });
        this.time.delayedCall(300, () => b.active && b.setFrame('idle'));
      }
    }
    b.x = Phaser.Math.Clamp(b.x, this.arenaMin + 30, this.arenaMax + 20);
  }
  bossDefeated(b) {
    this.bossActive = false; this.ended = true;
    Sound.stopMusic(); Sound.special(); this.cameras.main.shake(600, 0.015); this.cameras.main.flash(400);
    this.physics.world.pause(); setTimeout(() => this.sys.isActive() && this.physics.world.resume(), 120);
    const bx = b.x, by = b.y;
    for (let i = 0; i < 8; i++) this.time.delayedCall(i * 140, () => { const x = bx + Phaser.Math.Between(-34, 34), y = by + Phaser.Math.Between(-44, 30); this.burst(x, y, i % 2 ? 0xffcc33 : 0x9aff9a, 16); this.flash(x, y, 0xffdd88, 1.6, 220); });
    if (b.warn) b.warn.destroy(); if (b.tg) b.tg.destroy();
    b.destroy();
    this.enemyShots.clear(true, true);
    this.time.delayedCall(1500, () => this.scene.start('WeaponGet', { weapon: BOSSES[this.S.boss].weapon }));
  }

  // ----- HUD (Mega Man style bars) -----
  makeHud() {
    const fix = o => o.setScrollFactor(0).setDepth(200);
    const bar = (x, color, n) => { const fr = fix(this.add.rectangle(x, 142 - n * 4 + 2, 10, n * 4 + 4, 0x000000).setOrigin(0.5, 0).setStrokeStyle(1, 0xffffff));
      const segs = [fr]; segs.frame = fr; for (let i = 0; i < n; i++) segs.push(fix(this.add.rectangle(x, 144 - i * 4, 6, 2, color)));
      return segs; };
    this.barFn = bar; this.buildHpBar(); this.enBar = bar(36, this.L.color, this.maxEn).slice(1); this.bossBar = null;
    fix(this.add.image(28, 162, 'head_' + this.L.key).setScale(0.8));
    if (RUN.piece) fix(this.add.text(8, 180, 'HOLDER: ' + RUN.piece.name + '\n' + RUN.perks.labels.join('\n'), { fontFamily: 'monospace', fontSize: '7px', color: '#9aff9a', stroke: '#000', strokeThickness: 2 }));
    this.hudText = fix(this.add.text(60, 8, '', { fontFamily: 'monospace', fontSize: '10px', color: '#fff', stroke: '#000', strokeThickness: 3 }));
  }
  buildHpBar() { (this.hpAll || []).forEach(o => o.destroy()); this.hpAll = this.barFn(20, 0xffe066, this.maxHp); this.hpBar = this.hpAll.slice(1); }
  updateHud(time) {
    const p = this.player;
    this.hpBar.forEach((s, i) => s.setVisible(i < Math.ceil(p.hp)));
    this.enBar.forEach((s, i) => s.setVisible(i < Math.floor(p.energy)));
    const w = RUN.weapons[p.weapon], wname = w === 'lockchain' ? LOCK_CHAIN.name : this.L.blaster.name;
    this.enBar.forEach(s => s.setFillStyle(w === 'lockchain' ? LOCK_CHAIN.color : this.L.color));
    this.hudText.setText(`${this.L.name}  LIVES ${RUN.lives}  SCORE ${RUN.score}\nWEAPON: ${wname}${RUN.weapons.length > 1 ? (IS_TOUCH ? '  (W SWAP)' : '  (S to swap)') : ''}${time < p.glowUntil ? '  ★ GOLD GLOW' : ''}\n${RUN.up.armor ? 'LEDGER ARMOR  ' : ''}${RUN.up.heart ? 'HEART VAULT  ' : ''}${RUN.up.subtank ? 'COLD WALLET ' + RUN.tank + '/' + SETTINGS.SUBTANK_MAX : ''}`);
    if (this.bossActive && !this.bossBar) {
      const fix = o => o.setScrollFactor(0).setDepth(200);
      fix(this.add.rectangle(620, 30, 10, 116, 0x000000).setOrigin(0.5, 0).setStrokeStyle(1, 0xffffff));
      this.bossBar = []; for (let i = 0; i < 28; i++) this.bossBar.push(fix(this.add.rectangle(620, 142 - i * 4, 6, 2, 0xff4060)));
    }
    if (this.bossBar && this.boss) { const n = Math.ceil(28 * Math.max(0, this.boss.hp) / this.boss.maxHp); this.bossBar.forEach((s, i) => s.setVisible(i < n)); }
  }

  togglePause() {
    if (this.ended) return;
    this.paused = !this.paused;
    if (this.paused) { this.physics.pause(); this.pauseText = txt(this, 320, 170, 'PAUSED\n' + (IS_TOUCH ? 'tap II to resume' : 'P to resume'), 24, '#ffd34d').setScrollFactor(0).setDepth(300); Sound.muted = true; }
    else { this.physics.resume(); this.pauseText.destroy(); Sound.muted = false; }
  }

  // ----- every frame -----
  update(time, delta) {
    const tp = TOUCH.pause && !this.prevPause; this.prevPause = TOUCH.pause;
    if (tp) this.togglePause();
    if (this.paused) return;
    const dt = delta / 1000, p = this.player, inp = this.pad.read(), H = inp.held, P = inp.pressed;
    // parallax
    const sx = this.cameras.main.scrollX;
    this.stars.tilePositionX = sx * 0.02; this.haze.tilePositionX = sx * 0.06; this.far.tilePositionX = sx * 0.12; this.mid.tilePositionX = sx * 0.25; this.near.tilePositionX = sx * 0.5; this.fg.tilePositionX = sx * 1.35;
    this.watchFps(delta); this.trails(time);
    this.shots.getChildren().forEach(s => { if (s.flicker) s.setAngle(Phaser.Math.Between(-15, 15)).setAlpha(0.7 + Math.random() * 0.3); });
    if (!this.dying && !this.ended) {
      const onGround = p.body.blocked.down;
      if (onGround) p.coyote = time + 90;
      const hurt = time < p.hurtUntil, rolling = time < (p.rollUntil || 0);
      if (onGround) p.dashJump = false;
      if (rolling) { p.setVelocityX(p.facing * SETTINGS.ROLL_SPEED); if (P.jump && time < (p.coyote || 0)) { p.rollUntil = 0; p.dashJump = true; p.setVelocityY(-SETTINGS.JUMP_SPEED); p.coyote = 0; Sound.whiff(); } }
      else if (!hurt) {
        let vx = 0; const run = (p.dashJump ? SETTINGS.ROLL_SPEED : SETTINGS.RUN_SPEED) * this.L.speed;
        if (H.left) { vx = -run; p.facing = -1; }
        if (H.right) { vx = run; p.facing = 1; }
        if (time > (p.wallKickUntil || 0)) p.setVelocityX(vx);
        // WALL SLIDE + WALL JUMP (Mega Man X): in the air, push into a wall to slide; jump to kick off it
        const wallL = p.body.blocked.left && H.left, wallR = p.body.blocked.right && H.right;
        p.wallSlide = !onGround && (wallL || wallR) && p.body.velocity.y > 0;
        if (p.wallSlide) { p.setVelocityY(Math.min(p.body.velocity.y, SETTINGS.WALL_SLIDE_SPEED)); if (Math.random() < 0.3) this.burst(p.x + (wallR ? 10 : -10), p.y + 20, 0xccccdd, 1); }
        if (P.jump && !onGround && (p.body.blocked.left || p.body.blocked.right) && time >= (p.coyote || 0)) {
          const away = p.body.blocked.left ? 1 : -1; p.setVelocity(away * SETTINGS.WALL_JUMP_X, -SETTINGS.JUMP_SPEED * 0.95); p.facing = away;
          p.wallKickUntil = time + 160; p.dashJump = H.roll; this.wallJumps = (this.wallJumps || 0) + 1; this.burst(p.x - away * 10, p.y + 10, 0xffffff, 6); Sound.whiff(); }
        // jump: a short tap = small hop, hold = full jump; small grace time after leaving a ledge
        if (P.jump && time < (p.coyote || 0)) { p.setVelocityY(-SETTINGS.JUMP_SPEED); p.coyote = 0; Sound.whiff(); }
        if (!H.jump && p.body.velocity.y < -200) p.setVelocityY(-200);
        if (P.shoot) { this.fire(time); p.chargeFrom = time; }
        // HOLD SHOOT = CHARGE, let go = charged team shot
        const charge = H.shoot && p.chargeFrom ? time - p.chargeFrom : 0;
        if (charge > 250 && Math.floor(time / 60) % 3 === 0) this.burst(p.x + Phaser.Math.Between(-16, 16), p.y + Phaser.Math.Between(-20, 20), charge > SETTINGS.CHARGE_MS ? this.L.glow : 0xffffff, 1);
        p.charged = charge > SETTINGS.CHARGE_MS;
        if (!H.shoot && p.chargeFrom) { if (time - p.chargeFrom > SETTINGS.CHARGE_MS) this.fireCharged(time); p.chargeFrom = 0; }
        if (P.kick) this.punch(time);
        // ROLL (dodge): quick dash along the ground, can't be hurt while rolling
        if (P.roll && onGround && time > (p.rollUntil || 0) + 250) {
          const rms = SETTINGS.ROLL_MS * (this.L.perk === 'speed' ? PERKS.speedRollBonus : 1) * RUN.perks.rollMs; p.rollMs = rms;
          p.rollUntil = time + rms; p.invulnUntil = Math.max(p.invulnUntil, time + SETTINGS.DASH_IFRAMES_MS); this.dashes = (this.dashes || 0) + 1;
          p.body.setSize(20, 34).setOffset(14, 30); Sound.whiff(); this.burst(p.x - p.facing * 14, p.y + 28, 0xddddff, 5);
          this.time.delayedCall(rms, () => { p.body.setSize(20, 46).setOffset(14, 18); p.setAngle(0); });
        }
        if (P.swap && RUN.weapons.length > 1) { p.weapon = (p.weapon + 1) % RUN.weapons.length; Sound.select(); }
      }
      // pick the animation frame
      let f;
      if (rolling) f = 'run1';
      else if (p.wallSlide) f = 'fall';
      else if (hurt) f = 'hurt';
      else if (time < p.punchUntil) f = 'punch';
      else if (time < (p.shootPose || 0)) f = 'shoot';
      else if (!onGround) f = p.body.velocity.y < 0 ? 'jump' : 'fall';
      else if (Math.abs(p.body.velocity.x) > 1) f = 'run' + (1 + Math.floor(time / 70) % 6);
      else f = Math.floor(time / 500) % 2 ? 'idle2' : 'idle';
      p.setFrame(f); p.setFlipX(p.facing < 0);
      p.setAngle(0);
      this.head.setVisible(!this.dying);
      if (rolling) this.afterImage(time);
      if (p.charged) p.setTint(Math.floor(time / 50) % 2 ? this.L.glow : 0xffffff); else if (time >= p.glowUntil) p.clearTint();
      // head follows the body
      const bob = ({ run2: 1, run3: -1, run5: 1, run6: -1, idle2: 1 })[f] || 0;
      p.setAlpha(!rolling && time < p.invulnUntil && Math.floor(time / 70) % 2 ? 0.35 : 1);
      const hv = this.drawHero(time, f, onGround, rolling);
      this.head.setPosition(p.x + ((f === 'punch' ? 3 : f === 'hurt' ? -3 : 0) + (f.startsWith('run') ? 2 : 0)) * p.facing, hv.y + bob).setFlipX(p.facing < 0).setAlpha(p.alpha);
      if (p.charged) {} else if (time < p.glowUntil) { const on = Math.floor(time / 90) % 2; p.setTint(on ? p.glowColor : 0xffffff); this.head.setTint(on ? p.glowColor : 0xffffff); } else { p.clearTint(); this.head.clearTint(); }
      // slowly recharge energy so you're never stuck with zero
      p.energy = Math.min(this.maxEn, p.energy + dt * 0.7 * RUN.perks.regen);
      // checkpoints, falling into a gap, boss arena
      this.S.checkpoints.forEach(cx => { if (p.x > cx && this.checkpoint < cx) { this.checkpoint = cx; this.banner('CHECKPOINT', 800); } });
      // remember the last safe spot on solid ground (not right at an edge)
      if (onGround && !rolling) { const all = this.S.roofs.concat(this.S.girders);
        const r = all.find(([x, w, y]) => p.x > x + 48 && p.x < x + w - 48 && Math.abs(p.y + 32 - y) < 12); if (r) this.safe = { x: p.x, y: p.y - 4 }; }
      // fell in a gap: lose a little health and pop back to the last ledge (only lose a life if health runs out)
      if (p.y > 400) {
        p.hp -= SETTINGS.FALL_DAMAGE; Sound.hurt(); this.cameras.main.shake(120, 0.006);
        if (p.hp <= 0) this.loseLife();
        else { const sp = this.safe || { x: this.checkpoint, y: 150 }; p.body.reset(sp.x, sp.y); p.invulnUntil = time + 1200; this.fallCount = (this.fallCount || 0) + 1; }
      }
      if (p.x > this.S.arenaX + 40) this.startBoss();
      if (this.bossStarted) p.x = Phaser.Math.Clamp(p.x, this.arenaMin + 10, this.arenaMax + 50);
      // linear stage (left -> right only): the camera never scrolls back
      this.minScroll = Math.max(this.minScroll || 0, this.cameras.main.scrollX);
      if (!this.bossStarted) { this.cameras.main.setBounds(this.minScroll, 0, this.S.width - this.minScroll, 360); if (p.x < this.minScroll + 12) p.x = this.minScroll + 12; }
    }
    this.updateEnemies(time, dt);
    // tidy up old shots
    [this.shots, this.enemyShots].forEach(g => g.getChildren().forEach(s => {
      if (time - s.born > (s.life || 1500) || s.y > 420) s.destroy();
    }));
    this.items.getChildren().forEach(it => {
      if (!it.fixed && time - it.born > 10000) return it.destroy();
      // Coin Magnet perk (Leroy Gold): nearby pickups fly to you
      const mr = this.L.perk === 'magnet' ? PERKS.magnetRange : (RUN.perks.magnet && ['copper', 'silver', 'gold'].includes(it.kind) ? RUN.perks.magnet : 0);
      if (mr && Phaser.Math.Distance.Between(it.x, it.y, p.x, p.y) < mr) {
        it.body.setAllowGravity(false); this.physics.moveToObject(it, p, 260); }
    });
    // Chill Aura perk (Purple Kush): enemies close to you move at half speed
    if (this.L.perk === 'chill') this.enemies.getChildren().forEach(e => {
      if (e.active && Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < PERKS.chillRange) { e.body.velocity.x *= PERKS.chillSlow; if (!e.body.allowGravity) e.body.velocity.y *= PERKS.chillSlow; }
    });
    this.updateHud(time);
  }
}

// ---------- WEAPON GET (Mega Man style) ----------
class WeaponGet extends Phaser.Scene {
  constructor() { super('WeaponGet'); }
  init(d) { this.weapon = d.weapon; }
  create() {
    if (!RUN.weapons.includes(this.weapon)) RUN.weapons.push(this.weapon);
    const L = leaderBy(RUN.leader);
    this.add.rectangle(0, 0, 640, 360, 0x000018).setOrigin(0);
    for (let i = 0; i < 30; i++) this.add.rectangle(Math.random() * 640, Math.random() * 360, 2, 2, 0xffffff);
    const hero = this.add.sprite(320, 210, 'hero_' + L.key, 'shoot').setScale(2);
    this.add.image(320, 210 - 36, 'head_' + L.key).setScale(2);
    let on = false; this.time.addEvent({ delay: 200, repeat: 9, callback: () => { on = !on; on ? hero.setTint(LOCK_CHAIN.color) : hero.clearTint(); } });
    txt(this, 320, 60, 'YOU GOT', 20, '#fff');
    txt(this, 320, 92, LOCK_CHAIN.name + '!', 30, '#9aff9a');
    txt(this, 320, 290, 'Whips a chain that damages and FREEZES enemies.\nSwap weapons with ' + (IS_TOUCH ? 'the W SWAP button' : 'S'), 11, '#ddd');
    Sound.special();
    this.inp = menuInput(this); this.time.delayedCall(1500, () => { this.ok = true; this.add.existing(txt(this, 320, 335, IS_TOUCH ? 'tap to continue' : 'ENTER to continue', 10, '#888')); });
    this.input.on('pointerdown', () => this.ok && this.next());
  }
  next() { if (this.done) return; this.done = true; this.scene.start('BossSelect'); }
  update() { if (this.ok && this.inp().start) this.next(); }
}

// ---------- BOSS SELECT (Mega Man X): 8 bosses around your hero, each gives a weapon ----------
class BossSelect extends Phaser.Scene {
  constructor() { super('BossSelect'); }
  create() {
    const L = leaderBy(RUN.leader);
    this.add.image(0, 0, 'skyGrad').setOrigin(0).setDisplaySize(640, 360);
    this.add.tileSprite(0, 0, 640, 160, 'stars').setOrigin(0);
    txt(this, 320, 18, 'BOSS SELECT', 20, '#ffd34d').setStroke('#000', 4);
    // 3x3 grid, your hero in the middle (Mega Man X layout)
    const cx = [200, 320, 440], cy = [88, 186, 284], slots = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
    this.cells = slots.map(([gx, gy], i) => {
      const b = BOSS_SELECT[i], x = cx[gx], y = cy[gy];
      this.add.rectangle(x, y, 92, 84, 0x08060c).setStrokeStyle(3, b.open ? 0xffd34d : 0x5a4a7a);
      if (b.head) this.add.image(x, y - 8, 'head_' + b.head).setScale(1.7).setTint(b.open ? 0xffffff : 0x666666);
      else { this.add.image(x, y - 8, 'glow').setTint(b.color).setScale(1).setBlendMode(Phaser.BlendModes.ADD); txt(this, x, y - 8, '?', 26, '#fff'); }
      txt(this, x, y + 28, b.name, 7, '#fff'); if (!b.open) txt(this, x, y - 8, 'COMING\nSOON', 9, '#aaa').setAlpha(0.9);
      return { x, y, b };
    });
    this.add.rectangle(320, 186, 92, 84, 0x08060c).setStrokeStyle(3, L.color);
    this.add.image(320, 186, 'hero_' + L.key, 'idle'); this.add.image(320, 168, 'head_' + L.key);
    txt(this, 320, 222, 'END PREVIEW', 7, '#9aff9a');
    this.cursor = this.add.rectangle(0, 0, 100, 92).setStrokeStyle(3, 0xffffff);
    this.info = txt(this, 320, 342, '', 9, '#fff');
    this.sel = -1;   // -1 = middle (your hero): end the preview
    this.inp = menuInput(this); this.time.delayedCall(400, () => this.ok = true);
    this.input.on('pointerdown', ptr => { if (!this.ok) return; const h = this.cells.findIndex(c => Math.abs(c.x - ptr.worldX) < 46 && Math.abs(c.y - ptr.worldY) < 42); this.sel = h; this.pick(); });
  }
  pick() {
    if (this.sel >= 0) { const b = BOSS_SELECT[this.sel]; Sound.hurt(); this.info.setText(`${b.name} (${b.team}) — weapon: ${b.weapon} — COMING SOON`); return; }
    if (this.done) return; this.done = true; Sound.select(); this.scene.start('PreviewEnd');
  }
  update(t) {
    const { r, start } = this.inp(), order = [0, 1, 2, 3, -1, 4, 5, 6, 7];
    let k = order.indexOf(this.sel);
    if (r.pressed.right && k % 3 < 2) k++; if (r.pressed.left && k % 3 > 0) k--; if (r.pressed.down && k < 6) k += 3; if (r.pressed.up && k > 2) k -= 3;
    if (order[k] !== this.sel) { this.sel = order[k]; Sound.whiff(); this.info.setText(this.sel >= 0 ? BOSS_SELECT[this.sel].name + ' — weapon: ' + BOSS_SELECT[this.sel].weapon : 'END PREVIEW (more bosses coming)'); }
    const c = this.sel >= 0 ? this.cells[this.sel] : { x: 320, y: 186 }; this.cursor.setPosition(c.x, c.y).setVisible(Math.floor(t / 250) % 2 === 0);
    if (this.ok && start) this.pick();
  }
}

// ---------- End of preview ----------
class PreviewEnd extends Phaser.Scene {
  constructor() { super('PreviewEnd'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x0a0a2a).setOrigin(0);
    txt(this, 320, 70, 'INTRO STAGE CLEAR!', 30, '#ffd34d');
    txt(this, 320, 120, 'SCORE ' + RUN.score, 16);
    txt(this, 320, 180, 'Thanks for playing Streets of the Lost Ledger 2 (3D TwiN) preview v2.\nThe 8 boss stages are coming.', 12, '#ccc');
    txt(this, 320, 240, 'Weapons: ' + RUN.weapons.map(w => w === 'lockchain' ? LOCK_CHAIN.name : leaderBy(RUN.leader).blaster.name).join(' + '), 11, '#9aff9a');
    txt(this, 320, 320, IS_TOUCH ? 'tap for the leaderboard' : 'ENTER for the leaderboard', 10, '#888');
    saveScore();
    this.inp = menuInput(this); this.time.delayedCall(800, () => this.ok = true);
    this.input.on('pointerdown', () => this.ok && this.scene.start('Leaderboard'));
  }
  update() { if (this.ok && this.inp().start) this.scene.start('Leaderboard'); }
}

// ---------- Game over ----------
class GameOver extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create() {
    this.add.rectangle(0, 0, 640, 360, 0x000000).setOrigin(0);
    txt(this, 320, 140, 'GAME OVER', 36, '#e53935');
    txt(this, 320, 200, (IS_TOUCH ? 'tap' : 'ENTER') + ' to try again', 12);
    this.inp = menuInput(this); this.time.delayedCall(800, () => this.ok = true);
    this.input.on('pointerdown', () => this.ok && this.retry());
  }
  retry() { if (this.done) return; this.done = true; if (RUN.score > 0) saveScore(); RUN.lives = SETTINGS.START_LIVES; RUN.score = 0; this.scene.start('Stage', { id: STAGES[0].id }); }
  update() { if (this.ok && this.inp().start) this.retry(); }
}

// ---------- Start Phaser ----------
Object.assign(Stage.prototype, FxMixin);
const game = new Phaser.Game({
  type: Phaser.AUTO, width: 640, height: 360, pixelArt: true, backgroundColor: '#000', parent: 'game',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, Story, Select, Stage, WeaponGet, BossSelect, PreviewEnd, GameOver, Leaderboard]
});
window.GAME = game;
