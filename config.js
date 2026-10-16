// =====================================================================
//  CRYPTO BROS: Streets of the Lost Ledger — 3D TwiN PREVIEW
//  EASY-TO-EDIT SETTINGS. Shape colors = 0xRRGGBB, text colors = '#RRGGBB'.
// =====================================================================
const SETTINGS = {
  TITLE_TEXT: 'CRYPTO BROS',
  SUBTITLE_TEXT: 'Streets of the Lost Ledger 2',
  EDITION_TEXT: '3D TwiN  •  PREVIEW v2',
  TITLE_COLOR: '#ffd34d',
  START_LIVES: 3,
  MAX_HP: 28,            // Mega Man style: health is 28 little bars
  MAX_ENERGY: 28,        // blaster energy (ammo), also 28 bars
  RUN_SPEED: 210,
  JUMP_SPEED: 560,
  GRAVITY: 1400,
  KICK_DAMAGE: 3,        // optional melee kick
  ROLL_SPEED: 400,       // DASH speed (Mega Man X style). Jump during a dash = dash-jump (keeps the speed in the air)
  ROLL_MS: 300,          // how long a dash lasts
  DASH_IFRAMES_MS: 180,  // the first part of a dash can't be hurt (a dodge)
  WALL_SLIDE_SPEED: 70,  // hold toward a wall in the air to slide down slowly
  WALL_JUMP_X: 260,      // jump off a wall: sideways push
  CHARGE_MS: 650,        // hold SHOOT this long, let go = charged shot
  CHARGE_DMG: 4,         // charged shot damage = this x the blaster's normal damage
  ARMOR_DAMAGE: 0.75,    // Ledger Armor: you take this much damage
  HEART_TANK_HP: 4,      // Heart Vault: + this much max health
  SUBTANK_MAX: 14,       // Cold Wallet (stored health) stores spare health; auto-used when health gets low
  SUBTANK_AUTO_AT: 5,    // ...at or below this health
  HURT_INVULN_MS: 1700,  // blink time after getting hit (can't be hit again)
  FALL_DAMAGE: 4,        // falling in a gap costs this much health, then you respawn at the last ledge
  MUSIC_ON: true
};

// Team stats (speed / power / armor) carried over from the Two-Bit Beta.
// perk = passive power-up style (magnet / rage / speed / chill / armor), special = Gold Nickel glow move.
// See 'Team signature kits for 3D TwiN' in GAME_PLAN.md.
// The 5 leaders, using their 3D TwiN art (Piece # matched by metadata name).
// blaster: how their signature gun works. cost = energy per shot, rate = ms between shots.
const LEADERS = [
  { key: 'gold', perk: 'magnet', perkName: 'COIN MAGNET', special: 'GOLD FIST', speed: 1.0, power: 1.0,    team: 'Leroy Gold',    name: 'Frankie Pumpkins', piece: '#0878', color: 0xffc400, dark: 0x8a5a00, glow: 0xffe066,
    blaster: { name: 'GOLD SPREAD', kind: 'spread', dmg: 2, speed: 420, rate: 260, cost: 1 } },
  { key: 'red', perk: 'rage', perkName: 'RAGE', special: 'BIG BOOT', speed: 0.85, power: 1.35,     team: "Sho'nuff Red",  name: 'Gordo Holdsworth', piece: '#1051', color: 0xe02020, dark: 0x6a0a0a, glow: 0xff5050,
    blaster: { name: 'RED CANNON', kind: 'heavy', dmg: 6, speed: 300, rate: 520, cost: 2 } },
  { key: 'blue', perk: 'speed', perkName: 'SPEED BOOST', special: 'LIGHTNING RAIN', speed: 1.3, power: 0.8,    team: 'Ripple Drops',  name: 'Bruno Wagmi',      piece: '#0364', color: 0x2aa8ff, dark: 0x0b4c8c, glow: 0x7fdcff,
    blaster: { name: 'DROP BOLT', kind: 'bolt', dmg: 1.5, speed: 720, rate: 110, cost: 0.5 } },
  { key: 'purple', perk: 'chill', perkName: 'CHILL AURA', special: 'KUSH STORM', speed: 0.95, power: 0.95,  team: 'Purple Kush',   name: 'Benjamin Blunt',   piece: '#0958', color: 0x9b3dd6, dark: 0x45146a, glow: 0xd08cff,
    blaster: { name: 'KUSH CLOUD', kind: 'cloud', dmg: 1, speed: 160, rate: 420, cost: 1.5 } },
  { key: 'diamond', perk: 'armor', perkName: 'DIAMOND SKIN', special: 'DIAMOND BURST', speed: 0.9, power: 1.1, armor: 0.7, team: 'Diamond Hands', name: 'Butch Fancypants', piece: '#0615', color: 0xbfefff, dark: 0x4a7f98, glow: 0xffffff,
    blaster: { name: 'DIAMOND BEAM', kind: 'beam', dmg: 2.5, speed: 900, rate: 340, cost: 1.5 } }
];

// Boss power you EARN by beating the LOCz Don (Mega Man style)
// Perk tuning (easy to edit)
const PERKS = { magnetRange: 150, rageMaxBonus: 1.0, speedRollBonus: 1.4, chillRange: 130, chillSlow: 0.5 };

const LOCK_CHAIN = { name: 'LOCK CHAIN', dmg: 3, reach: 150, freezeMs: 2000, cost: 2, rate: 450, color: 0x9aff9a };

// Pickups (in-game only — never real prizes)
const PICKUPS = {
  copper:    { hp: 6,  energy: 0,  score: 100,  color: 0xc26a2a, label: 'COPPER NICKEL' },
  silver:    { hp: 14, energy: 14, score: 500,  color: 0xd8dde3, label: 'SILVER NICKEL' },
  gold:      { hp: 6,  energy: 6,  score: 1000, color: 0xffd700, label: 'GOLD NICKEL — SPECIAL!', glowMs: 9000 },
  xrp:       { hp: 0,  energy: 10, score: 50,   color: 0x23292f, label: 'XRP DROP +ENERGY' },
  trustline: { life: 1, score: 500, color: 0x2aa8ff, label: 'TRUSTLINE 1-UP' },
  // hidden upgrades (Mega Man X style) — one of each in the intro stage
  heart:     { upgrade: 'heart',   score: 1000, color: 0xff3d8b, label: 'HEART VAULT! +MAX HEALTH' },
  subtank:   { upgrade: 'subtank', score: 1000, color: 0x3aa0ff, label: 'COLD WALLET! STORES HEALTH' },
  armor:     { upgrade: 'armor',   score: 1500, color: 0x7fe0ff, label: 'LEDGER ARMOR! -25% DAMAGE' }
};
// Drop chances when an enemy is beaten (out of 1.0)
const DROP_TABLE = [['gold', 0.05], ['silver', 0.12], ['copper', 0.25], ['xrp', 0.25]];

// Enemies for this stage (from the 3D TwiN Mega Man layer proposal)
const ENEMIES = {
  scambot: { name: 'Scam Bot',   hp: 6, dmg: 3, speed: 50, score: 200 },   // walks, fires spam shots
  phish:   { name: 'Phish Drone', hp: 3, dmg: 3, speed: 90, score: 250 }   // flying fish, swoops at you
};
const BOSS = { name: 'LOCz DON', hp: 60, dmg: 5 };

// Hooks for later (NOT used in the preview). Read-only holder check, never wallets/keys/seeds.
function checkHolderReadOnly(publicAddress) { return Promise.resolve([]); }

// =====================================================================
//  STAGES (data-driven: add a new stage by copying this block)
//  roofs: [x, width, topY]   girders: [x, width, topY]   (world is 360 tall)
// =====================================================================
const STAGES = [
  {
    id: 'locz', name: 'LOCz ROOFTOPS', gang: 'The LOCz (D1)', width: 3600,
    sky: 0x1a1030, music: 140,
    roofs:   [[0, 700, 300], [820, 420, 280], [1340, 300, 250], [1760, 500, 300], [2380, 380, 270], [2860, 740, 300]],
    girders: [[730, 64, 245], [1255, 64, 215], [1665, 64, 235], [2290, 64, 230], [2560, 96, 200]],
    enemies: [['scambot', 450], ['phish', 620], ['scambot', 1000], ['phish', 1150], ['scambot', 1450],
              ['phish', 1700], ['scambot', 1900], ['scambot', 2120], ['phish', 2250], ['scambot', 2500], ['phish', 2650]],
    items:   [['xrp', 1290, 180], ['trustline', 1697, 200], ['copper', 2590, 170]],
    // hanging pillars you climb with wall-jumps: [x, width, topY, bottomY] (you can walk under them)
    pillars: [[1150, 50, 110, 216], [2690, 44, 130, 206]],
    // little ledges hidden down inside gaps: [x, width, topY]
    ledges:  [[738, 44, 352]],
    // hidden upgrades: [kind, x, y]
    secrets: [['armor', 760, 334],          // down in the first gap: drop in, then wall-jump back out
              ['heart', 1175, 100],         // on top of the tall pillar (wall-jump up its side)
              ['subtank', 2712, 120]],      // on top of the last pillar before the boss (dash-jump off the girder)
    checkpoints: [1800],
    arenaX: 2860,
    boss: 'locz_don'
  }
];

// BOSSES (data-driven). weapon = the power you take after beating them.
const BOSSES = {
  locz_don: { name: 'LOCz DON', hp: 32, contactDmg: 3, lockDmg: 3, hopEveryMs: 2400, throwEveryMs: 2000, telegraphMs: 500, weapon: 'lockchain' }
};

// The stage-select screen (Mega Man style). Only one is playable in the preview.
const SELECT_GRID = [
  { leader: 'gold',    stage: 'locz', open: true },
  { leader: 'red',     open: false },
  { leader: 'blue',    open: false },
  { leader: 'purple',  open: false },
  { leader: 'diamond', open: false }
];

// MEGA MAN X structure: intro stage (LOCz Rooftops + LOCz Don) -> this 8-slot boss select.
// 5 team leaders (rival versions) + 3 gang bosses. Each gives its weapon. Names marked PLACEHOLDER are for Rusty to name.
const BOSS_SELECT = [
  { name: 'GORDO HOLDSWORTH', team: "Sho'nuff Red",  head: 'red',     weapon: 'BIG BOOT STOMP',  open: false },
  { name: 'D2 BOSS',          team: 'PLACEHOLDER',   head: null,      weapon: 'PLACEHOLDER',     open: false, color: 0xff8a00 },
  { name: 'BRUNO WAGMI',      team: 'Ripple Drops',  head: 'blue',    weapon: 'LIGHTNING RAIN',  open: false },
  { name: 'BENJAMIN BLUNT',   team: 'Purple Kush',   head: 'purple',  weapon: 'KUSH STORM',      open: false },
  { name: 'D3 BOSS',          team: 'PLACEHOLDER',   head: null,      weapon: 'PLACEHOLDER',     open: false, color: 0x00d0a0 },
  { name: 'BUTCH FANCYPANTS', team: 'Diamond Hands', head: 'diamond', weapon: 'DIAMOND BURST',   open: false },
  { name: 'FRANKIE PUMPKINS', team: 'Leroy Gold',    head: 'gold',    weapon: 'GOLD FIST',       open: false },
  { name: 'FINAL 10% BOSS',   team: 'PLACEHOLDER',   head: null,      weapon: 'PLACEHOLDER',     open: false, color: 0xff3040 }
];

// Story intro: the same "Lost Ledger" story as the Two-Bit Beta (STORY.md / LORE.md canon)
const STORY_LINES = [
  'Ledgers #1 to #32,569 vanished in 2012.',
  'The Bros&Ho\'s were born in those lost pages.',
  'Now a gang called THE LOCz has stolen',
  'the LOST LEDGER, the last copy of the gap...',
  'and every crew in the city wants it.',
  '',
  'Five crews. One ledger. Take it back.'
];

// =====================================================================
//  TRAIT PERKS — PROPOSAL (stub, pending Rusty's OK)
//  Later: a holder signs in READ-ONLY with Xaman, picks their CBH piece, its
//  head goes on their team body, and its TRAITS add small perks from this table.
//  NO wallet code here: no keys, no seeds, no transactions — only reading public metadata.
//  Effects (all small): maxHp, maxEnergy (+bars) • dmg, armor, regen, rollMs, cloudLife, shotSpeed (multipliers)
//  • pickupEnergy (+energy per pickup) • glowMs (+ms of Gold glow) • score (multiplier) • lives (+start lives) • magnet (+px pull range)
// =====================================================================
const TRAIT_PERKS = [
  // trait type,        value(s),                                   effect,          amount, label
  ['Accessory',        ['Blazed'],                                  'cloudLife',     1.25,  'Blazed: smoke lasts 25% longer, +1s glow'],
  ['Accessory',        ['Blazed'],                                  'glowMs',        1000,  null],
  ['Accessory',        ['Blazed: Blunt', 'Blazed: Benjamin Blunt'], 'cloudLife',     1.4,   'Blazed (rare): smoke lasts 40% longer, +2s glow'],
  ['Accessory',        ['Blazed: Blunt', 'Blazed: Benjamin Blunt'], 'glowMs',        2000,  null],
  ['Accessory',        ['Energy Drink'],                            'regen',         1.15,  'Energy Drink: energy recharges 15% faster'],
  ['Accessory',        ['Coffee Cup'],                              'regen',         1.1,   'Coffee Cup: energy recharges 10% faster'],
  ['Accessory',        ['Gold X-Coin Chain'],                       'score',         1.05,  'Gold X-Coin Chain: +5% score'],
  ['Accessory',        ['Money Bag', 'Cha-Ching Bell'],             'score',         1.1,   'Money: +10% score'],
  ['Accessory',        ['Hardware Wallet'],                         'armor',         0.95,  'Hardware Wallet: take 5% less damage'],
  ['Accessory',        ['Diamond Hands'],                           'armor',         0.9,   'Diamond Hands: take 10% less damage'],
  ['Accessory',        ['Paper Hands'],                             'rollMs',        1.2,   'Paper Hands: rolls 20% longer (run away!)'],
  ['Accessory',        ['Nickel Stack', 'Copper Stack', 'Silver Stack', 'Gold Stack'], 'magnet', 120, 'Nickel Stack: nickels drift to you'],
  ['Liquidity Splash', ['DROPS can'],                               'pickupEnergy',  4,     'DROPS can: +4 energy from every pickup'],
  ['Liquidity Splash', ['1 drop'],                                  'pickupEnergy',  2,     '1 drop: +2 energy from every pickup'],
  ['Liquidity Splash', ['Wave splash'],                             'pickupEnergy',  3,     'Wave splash: +3 energy from every pickup'],
  ['Grill',            ['Single Gold Tooth', 'Full Gold Grill'],    'dmg',           1.05,  'Gold grill: +5% damage'],
  ['Grill',            ['Diamond-Studded Grill', 'Iced-Out Grill', '589 Grill'], 'dmg', 1.1, 'Iced grill: +10% damage'],
  ['Aura',             ['Gold Aura', 'Hot Pink Aura', 'The Glow', 'Neon Green Aura', 'Ice Blue Aura'], 'glowMs', 1500, 'Aura: Gold glow lasts 1.5s longer'],
  ['Aura',             ['Rainbow Aura', 'NaN Glitch Aura'],         'glowMs',        3000,  'Rare aura: Gold glow lasts 3s longer'],
  ['Special',          ['Laser Eyes'],                              'shotSpeed',     1.15,  'Laser Eyes: shots fly 15% faster'],
  ['Special',          ['Robot Half', 'Half-Skull'],                'maxHp',         2,     'Tough: +2 health bars'],
  ['Special',          ['Liquid-Metal Skin'],                       'armor',         0.9,   'Liquid-Metal Skin: take 10% less damage'],
  ['Special',          ['Lost Page Glitch'],                        'regen',         1.2,   'Lost Page Glitch: energy recharges 20% faster'],
  ['Special',          ['Legendary 1/1'],                           'maxHp',         4,     'Legendary: +4 health bars'],
  ['Shoulder Gear',    ["Sho'Nuff Pads"],                           'maxHp',         4,     "Sho'Nuff Pads: +4 health bars"],
  ['Hands FX',         ["Who's the Master?"],                       'dmg',           1.1,   "Who's the Master?: +10% damage"],
  ['Pet Sidekick',     ['Mini CBT-123', 'Goldfish in a Bag', 'Tiny Whale'], 'lives', 1, 'Rare sidekick: +1 starting life'],
  ['Chain Charm',      ['Diamond Drop', 'Iced-Out Drop'],           'maxEnergy',     2,     'Diamond charm: +2 energy bars'],
  ['Rarity',           ['Epic'],                                    'maxHp',         1,     'Epic: +1 health bar'],
  ['Rarity',           ['Legendary'],                               'maxHp',         2,     'Legendary rarity: +2 health bars']
];
// Safety caps so stacked traits stay balanced
const TRAIT_CAPS = { dmg: 1.25, armor: 0.75, regen: 1.4, maxHp: 6, maxEnergy: 4, glowMs: 4000, score: 1.2, lives: 1 };

// Turn a piece's traits into one perk bundle (multipliers multiply, bonuses add, then caps apply)
function perksFromTraits(traits) {
  const P = { maxHp: 0, maxEnergy: 0, dmg: 1, armor: 1, regen: 1, rollMs: 1, cloudLife: 1, shotSpeed: 1, pickupEnergy: 0, glowMs: 0, score: 1, lives: 0, magnet: 0, labels: [] };
  const MULT = ['dmg', 'armor', 'regen', 'rollMs', 'cloudLife', 'shotSpeed', 'score'];
  TRAIT_PERKS.forEach(([type, values, eff, amt, label]) => {
    if (!values.includes(traits[type])) return;
    if (MULT.includes(eff)) P[eff] *= amt; else P[eff] += amt;
    if (label) P.labels.push(label);
  });
  for (const k in TRAIT_CAPS) P[k] = k === 'armor' ? Math.max(P[k], TRAIT_CAPS[k]) : Math.min(P[k], TRAIT_CAPS[k]);
  return P;
}

// STUB: where a holder's piece comes from. Preview reads a tiny sample of REAL metadata (traits_sample.json).
// Later this becomes: Xaman read-only sign-in -> list the address's CBH NFTs from the public ledger -> read their metadata.
function loadPieceTraits(pieceNo) {
  return fetch('traits_sample.json').then(r => r.json()).then(all => all[pieceNo] || null).catch(() => null);
}
