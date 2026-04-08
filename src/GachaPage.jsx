import { useState } from 'react';
import {
  ProfileAvatar, PicDisplay,
  NORMAL_PICS, PREMIUM_PICS,
  RARITY_COLORS, NORMAL_PULL_COST, PREMIUM_PULL_COST,
  rollGacha,
} from './Profile';

const DRAW_COUNT = 5;
const RARITY_PAUSE = { common: 1, rare: 1.6, epic: 2.8, legendary: 5 };

function PoolBox({ title, pics, cost, xp, setXp, owned, setOwned, profilePic, setProfilePic, pullCount, setPullCount }) {
  const [rolling, setRolling]         = useState(false);
  const [results, setResults]         = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [xpMsg, setXpMsg]             = useState(false);

  function draw(count) {
    if (rolling || pics.length === 0) return;
    const drawCost = cost * count;
    if (xp < drawCost) {
      setXpMsg(true);
      setTimeout(() => setXpMsg(false), 1800);
      return;
    }
    setRolling(true);
    setResults([]);

    let pc = pullCount;
    const drawn = [];
    for (let i = 0; i < count; i++) drawn.push(rollGacha(pics, pc++));

    let frame = 0;
    const FAST = 18;
    const SLOW = 20;

    function step() {
      const pic = pics[Math.floor(Math.random() * pics.length)];
      setHighlighted(pic.id);
      frame++;

      const pause = RARITY_PAUSE[pic.rarity] ?? 1;

      if (frame < FAST) {
        setTimeout(step, 95);
      } else if (frame < FAST + SLOW) {
        const t = (frame - FAST) / SLOW;
        setTimeout(step, 95 + t * 340 * pause);
      } else {
        drawn.forEach((drawnPic, i) => {
          setTimeout(() => {
            setHighlighted(drawnPic.id);
            if (i === drawn.length - 1) {
              setTimeout(() => {
                setXp(prev => prev - drawCost);
                setOwned(prev => [...prev, ...drawn.map(r => r.id)]);
                setPullCount(pc);
                setResults(drawn);
                setHighlighted(null);
                setRolling(false);
                setTimeout(() => setResults([]), 5000);
              }, 500);
            }
          }, i * 380 + 80);
        });
      }
    }

    step();
  }

  // unique owned count for display
  const uniqueOwned = new Set(owned.filter(id => pics.some(p => p.id === id))).size;

  return (
    <div className="gacha-pool-box">
      <div className="gacha-pool-box-header">
        <span className="gacha-pool-box-title">{title}</span>
        <span className="gacha-pool-box-owned">{uniqueOwned} / {pics.length}</span>
      </div>

      <div className="gacha-grid-wrap">
        {pics.length === 0 ? (
          <div className="gacha-pool-empty">
            <span>nothing yet</span>
          </div>
        ) : (
          <div className="gacha-grid">
            {['legendary', 'epic', 'rare', 'common'].flatMap(rarity =>
              pics.filter(p => p.rarity === rarity).map(pic => {
                const isOwned    = owned.includes(pic.id);
                const isEquipped = profilePic === pic.id;
                const isHighlit  = highlighted === pic.id;
                const borderColor = (rolling && !isHighlit)
                  ? 'var(--g-rolling-border)'
                  : RARITY_COLORS[rarity];
                const showColor = isOwned || rolling;
                return (
                  <div
                    key={pic.id}
                    className="gacha-card-wrap"
                    onClick={() => isOwned && !rolling && setProfilePic(pic.id)}
                    title={isEquipped ? pic.label : isOwned ? `Equip ${pic.label}` : pic.label}
                  >
                    <div
                      className={`gacha-card${isEquipped ? ' equipped' : ''}${isHighlit ? ' highlighted' : ''}`}
                      style={{ borderColor }}
                    >
                      <span style={{ filter: showColor ? 'none' : 'grayscale(1) opacity(0.15)' }}>
                        <PicDisplay pic={pic} size={pic.type === 'image' ? 65 : 44} />
                      </span>
                      {isEquipped && <span className="gacha-card-on">ON</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="gacha-strip">
            {results.map((pic, i) => (
              <div key={i} className="gacha-strip-card" style={{ borderColor: RARITY_COLORS[pic.rarity] }}>
                {pic.type === 'emoji' ? (
                  results.length === 1 ? (
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden', fontSize: 16, lineHeight: 1.2, wordBreak: 'break-all', textAlign: 'center', padding: '4px' }}>
                      {Array(1000).fill(pic.asset).join(' ')}
                    </div>
                  ) : (
                    <div className="gacha-strip-emoji">
                      {[...Array(9)].map((_, j) => (
                        <span key={j} style={{ fontSize: 16, lineHeight: 1 }}>{pic.asset}</span>
                      ))}
                    </div>
                  )
                ) : (
                  <img src={pic.asset} alt={pic.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {xpMsg && <div className="gacha-xp-msg">not enough xp</div>}
      {!rolling && (
        <div className="gacha-draw-bar">
          <button className="gacha-draw-btn" onClick={() => draw(1)}>{`1x  ·  ${cost} XP`}</button>
          <button className="gacha-draw-btn" onClick={() => draw(DRAW_COUNT)}>{`5x  ·  ${cost * DRAW_COUNT} XP`}</button>
        </div>
      )}
    </div>
  );
}

export default function GachaPage({ xp, setXp, profilePic, setProfilePic, owned, setOwned, pullCount, setPullCount, onBack }) {
  const fillPct = Math.min(xp, NORMAL_PULL_COST * DRAW_COUNT) / (NORMAL_PULL_COST * DRAW_COUNT) * 100;

  return (
    <div className="gacha-page">

      <div className="gacha-topbar">
        <button className="gacha-back-btn" onClick={onBack}>←</button>
        <span className="gacha-title">Gacha</span>
        <div className="gacha-xp-area">
          <ProfileAvatar profilePic={profilePic} size={28} />
          <div className="gacha-xp-bar">
            <div className="gacha-xp-fill" style={{ width: `${fillPct}%` }} />
            <div className="gacha-xp-label">{xp} XP</div>
          </div>
        </div>
      </div>

      <div className="gacha-pools">
        <PoolBox
          title="Normal" pics={NORMAL_PICS} cost={NORMAL_PULL_COST}
          xp={xp} setXp={setXp} owned={owned} setOwned={setOwned}
          profilePic={profilePic} setProfilePic={setProfilePic}
          pullCount={pullCount} setPullCount={setPullCount}
        />
        <PoolBox
          title="Premium" pics={PREMIUM_PICS} cost={PREMIUM_PULL_COST}
          xp={xp} setXp={setXp} owned={owned} setOwned={setOwned}
          profilePic={profilePic} setProfilePic={setProfilePic}
          pullCount={pullCount} setPullCount={setPullCount}
        />
      </div>

    </div>
  );
}
