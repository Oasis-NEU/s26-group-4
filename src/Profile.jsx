import { supabase } from './supabase';

// ─── Helpers — add a new pic in one line ────────────────────────────────────
// emoji pool:   e('id', 'Label', 'rarity', '🔥')
// premium pool: img('id', 'Label', 'rarity', importedSrc)
const e   = (id, label, rarity, asset) => ({ id, label, rarity, type: 'emoji', asset });
const img = (id, label, rarity, asset) => ({ id, label, rarity, type: 'image', asset });

// ─── Normal pool (emoji) ─────────────────────────────────────────────────────
export const NORMAL_PICS = [
  // common
  e('cat',        'Butterfly',  'common',    '🦋'),
  e('dog',        'Mushroom',   'common',    '🍄'),
  e('plant',      'Plant',      'common',    '🌿'),
  e('blossom',    'Blossom',    'common',    '🌸'),
  // rare
  e('person_y',   'Person',     'rare',      '🧑'),
  e('person_l',   'Person',     'rare',      '🧑🏻'),
  e('person_ml',  'Person',     'rare',      '🧑🏼'),
  e('person_m',   'Person',     'rare',      '🧑🏽'),
  e('woman_y',    'Woman',      'rare',      '👩'),
  e('woman_l',    'Woman',      'rare',      '👩🏻'),
  e('woman_ml',   'Woman',      'rare',      '👩🏼'),
  e('woman_m',    'Woman',      'rare',      '👩🏽'),
  e('person_md',  'Person',     'rare',      '🧑🏾'),
  e('person_d',   'Person',     'rare',      '🧑🏿'),
  e('woman_md',   'Woman',      'rare',      '👩🏾'),
  e('woman_d',    'Woman',      'rare',      '👩🏿'),
  // epic
  e('wave', 'Wave',   'epic',      '🌊'),
  e('star',       'Ghost',      'epic',      '👻'),
  e('fire',       'Fire',       'epic',      '🔥'),
  e('moon',       'Moon',       'epic',      '🌕'),
  e('crystal',    'Crystal',    'epic',      '💎'),
  e('crown',      'Crown',      'epic',      '👑'),
  e('ghost',      'Comet',      'epic',      '☄️'),
  e('orb',        'Orb',        'epic',      '🔮'),
  // legendary
  e('dragon',     'Dragon',     'legendary', '🐉'),
  e('unicorn',    'Unicorn',    'legendary', '🦄'),
  e('steelball',  'Steel Ball', 'legendary', '🎱'),
  e('skull',      'Skull',      'legendary', '☠️'),
];

// ─── Premium pool (image assets) ─────────────────────────────────────────────
// Files in /public are referenced as URL strings — no import needed.
// To add more: img('id', 'Label', 'rarity', '/filename.jpg')
export const PREMIUM_PICS = [
  // legendary
  img('l1', 'Rabbit Girl', 'legendary', '/l1.jpg'),
  img('l2', 'Demon Girl', 'legendary', '/l2.jpg'),
  img('l3', 'Dude', 'legendary', '/l3.jpg'),
  img('l4', 'Girl Boss', 'legendary', '/l4.jpg'),
  // epic
  img('e2', 'Diego', 'epic', '/e2.jpg'),
  img('e3', 'Plagiarist', 'epic', '/e3.png'),
  img('e4', 'Reincarnator', 'epic', '/e4.png'),
  img('e5', 'Demon King of Salvation', 'epic', '/e5.png'),
  // rare
  img('r1', 'Petrichor', 'rare', '/r1.png'),
  img('r2', 'Pixie', 'rare', '/r2.png'),
  img('r3', 'Restless', 'rare', '/r3.png'),
  img('r7', 'Guy', 'rare', '/r7.jpg'),
  img('e1', 'Jotoro', 'rare', '/e1.jpg'),
  img('r5', 'Giorno', 'rare', '/r5.jpg'),
  img('r6', 'Flying Doves', 'rare', '/r6.jpg'),
  img('r4', 'Yoimiya', 'rare', '/r4.jpg'),
  // common
  img('n1', 'Died Again Oops', 'common', '/n1.jpg'),
  img('n2', 'The Trio', 'common', '/n2.jpg'),
  img('n3', 'Failed Salvation', 'common', '/n3.jpg'),
  img('n8', 'Chiaki Nanami', 'common', '/n8.png'),
  img('n7', 'Steel Ball', 'common', '/n7.webp'),
  img('n5', 'Johnny Joestar', 'common', '/n5.jpg'),
  img('n6', 'Visitor\'s Pass', 'common', '/n6.jpg'),
  img('n9', 'Izuru Kamukura', 'common', '/n9.png'),
];

// Combined — used for id lookups
export const PROFILE_PICS = [...NORMAL_PICS, ...PREMIUM_PICS];

// ─── Config ──────────────────────────────────────────────────────────────────
export const RARITY_COLORS = {
  common:    '#aaaaaa',
  rare:      '#4a90d9',
  epic:      '#a855f7',
  legendary: '#f59e0b',
};

export const NORMAL_PULL_COST  = 100;
export const PREMIUM_PULL_COST = 300;
export const XP_PER_TASK       = 50;

// ─── Gacha odds ───────────────────────────────────────────────────────────────
export const BASE_WEIGHTS  = { common: 76, rare: 20, epic: 3.5, legendary: 0.5 };
export const START_WEIGHTS = { common: 60, rare: 25,   epic: 12, legendary: 3 };
export const RAMP_PULLS    = 100;

// Honeymoon: START_WEIGHTS → BASE_WEIGHTS over first RAMP_PULLS, stays flat after.
// Every RAMP_PULLS-th pull gets START_WEIGHTS for that one pull as pity, then drops back.
export function getWeights(pullCount) {
  if (pullCount > 0 && pullCount % RAMP_PULLS === 0) return { ...START_WEIGHTS };
  const t = Math.min(pullCount, RAMP_PULLS) / RAMP_PULLS;
  return Object.fromEntries(
    Object.keys(BASE_WEIGHTS).map(r => [r, START_WEIGHTS[r] + (BASE_WEIGHTS[r] - START_WEIGHTS[r]) * t])
  );
}

// ─── Supabase persistence ─────────────────────────────────────────────────────
export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('xp, profile_pic, owned_pics, pull_count')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return { xp: data.xp, profilePic: data.profile_pic, owned: data.owned_pics, pullCount: data.pull_count };
}

export async function saveProfile(userId, { xp, profilePic, owned, pullCount }) {
  await supabase.from('profiles').upsert({
    user_id:     userId,
    xp,
    profile_pic: profilePic,
    owned_pics:  owned,
    pull_count:  pullCount,
  }, { onConflict: 'user_id' });
}

// Roll from a given pool (NORMAL_PICS or PREMIUM_PICS)
export function rollGacha(pool, pullCount) {
  const weights = getWeights(pullCount);
  const total   = pool.reduce((sum, p) => sum + weights[p.rarity], 0);
  let rand = Math.random() * total;
  for (const pic of pool) {
    rand -= weights[pic.rarity];
    if (rand <= 0) return pic;
  }
  return pool[0];
}

// ─── PicDisplay — renders emoji or image asset ───────────────────────────────
export function PicDisplay({ pic, size = 32 }) {
  if (!pic) return null;
  if (pic.type === 'image') {
    return <img src={pic.asset} alt={pic.label} className="pic-display-img" style={{ width: size, height: size }} />;
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(4%)' }}>{pic.asset}</span>;
}

// ─── ProfileAvatar — circular badge shown next to username ───────────────────
export function ProfileAvatar({ profilePic, size = 28 }) {
  const pic = PROFILE_PICS.find(p => p.id === profilePic) ?? NORMAL_PICS[0];
  return (
    <span
      className="profile-avatar"
      style={{ width: size, height: size }}
      title={pic.label}
    >
      <PicDisplay pic={pic} size={size * 0.65} />
    </span>
  );
}
