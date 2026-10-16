// =====================================================================
//  FX: v2 "juice" for the Stage (glow, sparks, hit-stop, damage numbers,
//  squash/stretch, team aura). Everything is pooled and cheap, and the
//  quality drops by itself if the phone can't keep up.
//    FX quality: 2 = full, 1 = lighter (fewer particles, no trails),
//                0 = minimal (no aura / light pools / foreground layer)
//    Force it with ?fx=0, ?fx=1 or ?fx=2 in the URL.
// =====================================================================
const FX_SETTINGS = {
  HIT_STOP_MS: 50,         // freeze frame when you land a kill / hit the boss (40-60 feels good)
  DAMAGE_NUMBERS: true,    // little numbers pop out of enemies
  SHAKE_ON_KILL: 0.006,    // screen shake strength when an enemy pops
  AURA_ALPHA: 0.28,        // team glow behind the hero
  LOW_FPS: 48,             // under this for ~2 seconds -> lower the effects one step
};
const FX_FORCED = (() => { const m = location.search.match(/[?&]fx=(\d)/); return m ? +m[1] : null; })();

const FxMixin = {
  initFx() {
    this.fxQ = FX_FORCED !== null ? FX_FORCED : 2; this.lowFpsMs = 0; this.fpsLog = [];
    const ADD = Phaser.BlendModes.ADD;
    this.sparks = this.add.particles(0, 0, 'spark', { speed: { min: 60, max: 240 }, lifespan: { min: 180, max: 380 }, scale: { start: 1.4, end: 0 },
      blendMode: ADD, emitting: false, gravityY: 300, maxParticles: 120 }).setDepth(22);
    this.trail = this.add.particles(0, 0, 'spark', { speed: 10, lifespan: 220, scale: { start: 1.1, end: 0 }, alpha: { start: 0.8, end: 0 }, blendMode: ADD, emitting: false, maxParticles: 90 }).setDepth(8);
    this.flashes = []; for (let i = 0; i < 6; i++) this.flashes.push(this.add.image(0, 0, 'glow').setBlendMode(ADD).setVisible(false).setDepth(21));
    this.nums = []; for (let i = 0; i < 8; i++) this.nums.push(this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(60).setVisible(false));
    this.numI = 0; this.flashI = 0;
    // the hero you SEE is a separate sprite, so it can squash/stretch without changing the physics body
    this.aura = this.add.image(0, 0, 'glow').setBlendMode(ADD).setDepth(9).setTint(this.L.key === 'diamond' ? 0xffffff : this.L.glow).setAlpha(FX_SETTINGS.AURA_ALPHA).setScale(1.6, 2);
    this.heroGfx = this.add.sprite(0, 0, 'hero_' + this.L.key, 'idle').setOrigin(0.5, 1).setDepth(10);
    this.player.setVisible(false);
    this.sq = { x: 1, y: 1 }; this.wasGround = true;
  },
  setFxQuality(q) {
    this.fxQ = q;
    this.fg && this.fg.setVisible(q >= 1);
    (this.lightPools || []).forEach(o => o.setVisible(q >= 1));
    this.aura.setVisible(q >= 1);
  },
  // watch the real frame rate; step effects down if it stays low
  watchFps(delta) {
    if (FX_FORCED !== null || this.fxQ === 0) return;
    const fps = 1000 / Math.max(1, delta);
    this.lowFpsMs = fps < FX_SETTINGS.LOW_FPS ? this.lowFpsMs + delta : Math.max(0, this.lowFpsMs - delta * 0.5);
    if (this.lowFpsMs > 2000) { this.setFxQuality(this.fxQ - 1); this.lowFpsMs = 0; this.fxDrops = (this.fxDrops || 0) + 1; }
  },
  burst(x, y, color, n) { if (this.fxQ === 0) n = Math.ceil(n / 3); else if (this.fxQ === 1) n = Math.ceil(n / 2); this.sparks.particleTint = color; this.sparks.explode(n, x, y); },
  flash(x, y, color, scale, ms) {
    const f = this.flashes[this.flashI++ % this.flashes.length];
    this.tweens.killTweensOf(f);
    f.setPosition(x, y).setTint(color).setScale(scale).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: f, alpha: 0, scale: scale * 1.6, duration: ms || 120, onComplete: () => f.setVisible(false) });
  },
  dmgNumber(x, y, n, color) {
    if (!FX_SETTINGS.DAMAGE_NUMBERS || this.fxQ === 0) return;
    const t = this.nums[this.numI++ % this.nums.length];
    this.tweens.killTweensOf(t);
    t.setText(String(Math.max(1, Math.round(n)))).setColor(color || '#fff').setPosition(x + Phaser.Math.Between(-6, 6), y).setAlpha(1).setScale(1.4).setVisible(true);
    this.tweens.add({ targets: t, y: y - 22, scale: 1, alpha: 0, duration: 550, ease: 'Cubic.easeOut', onComplete: () => t.setVisible(false) });
  },
  // freeze-frame for impact (physics pauses; tweens keep running so it looks like a punchy beat)
  hitStop(ms) {
    if (this.paused || this.ended) return;
    const now = performance.now(); if (now < (this.stopUntil || 0) + 90) return;
    this.stopUntil = now + (ms || FX_SETTINGS.HIT_STOP_MS);
    this.physics.world.pause();
    setTimeout(() => { if (!this.paused && this.sys.isActive()) this.physics.world.resume(); }, ms || FX_SETTINGS.HIT_STOP_MS);
  },
  // shot trails (cheap: one particle every other frame per shot)
  trails(time) {
    if (this.fxQ < 2 || (this.frameN = (this.frameN || 0) + 1) % 2) return;
    this.shots.getChildren().forEach(s => { if (s.trailColor) { this.trail.particleTint = s.trailColor; this.trail.emitParticleAt(s.x, s.y, 1); } });
  },
  // dash after-images (pooled ghost copies of the hero in the team colour)
  afterImage(time) {
    if (this.fxQ === 0 || time < (this.nextGhost || 0)) return; this.nextGhost = time + 40;
    if (!this.ghosts) { this.ghosts = []; for (let i = 0; i < 5; i++) this.ghosts.push(this.add.sprite(0, 0, 'hero_' + this.L.key, 'run1').setOrigin(0.5, 1).setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)); this.ghostI = 0; }
    const g = this.ghosts[this.ghostI++ % 5], h = this.heroGfx;
    this.tweens.killTweensOf(g);
    g.setFrame(h.frame.name).setPosition(h.x, h.y).setFlipX(h.flipX).setScale(h.scaleX, h.scaleY).setTint(this.L.key === 'diamond' ? 0xffffff : this.L.glow).setAlpha(0.6).setVisible(true);
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.setVisible(false) });
  },
  // draw the visible hero: squash on landing, stretch on jump, breathing idle, lean when running
  drawHero(time, f, onGround, rolling) {
    const p = this.player, g = this.heroGfx;
    if (onGround && !this.wasGround) { this.sq.x = 1.22; this.sq.y = 0.8; this.burst(p.x, p.y + 30, 0xbbbbdd, 4); }
    if (!onGround && this.wasGround && p.body.velocity.y < -100) { this.sq.x = 0.82; this.sq.y = 1.2; }
    this.wasGround = onGround;
    this.sq.x += (1 - this.sq.x) * 0.25; this.sq.y += (1 - this.sq.y) * 0.25;
    const breath = f.startsWith('idle') ? Math.sin(time / 260) * 0.02 : 0;
    g.setFrame(f).setFlipX(p.facing < 0).setPosition(p.x, p.y + 32).setScale(this.sq.x - breath, this.sq.y + breath);
    g.setAngle(rolling ? p.angle : (f.startsWith('run') ? p.facing * 4 : 0));
    if (rolling) { g.setOrigin(0.5, 0.5); g.y = p.y + 8; } else g.setOrigin(0.5, 1);
    g.setAlpha(p.alpha).setVisible(p.visible === false ? !this.dying : true);
    if (this.dying) g.setVisible(false);
    if (p.tintTopLeft !== 0xffffff && p.isTinted) g.setTint(p.tintTopLeft); else g.clearTint();
    // aura: soft team glow, much brighter during the Gold Nickel special
    const glowing = time < p.glowUntil;
    this.aura.setPosition(p.x, p.y + 4).setVisible(this.fxQ >= 1 && !this.dying)
      .setAlpha((glowing ? 0.75 : FX_SETTINGS.AURA_ALPHA) * (0.85 + Math.sin(time / 180) * 0.15)).setScale(glowing ? 2.6 : 1.6, glowing ? 3 : 2);
    if (glowing) this.aura.setTint(p.glowColor);
    // head rides the visible body (follows squash)
    return { y: p.y + 32 - (64 - 14) * this.sq.y + breath * 40 };
  },
};
