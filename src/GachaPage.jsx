import { useState, useEffect } from 'react';
import {
  ProfileAvatar, PicDisplay,
  NORMAL_PICS, PREMIUM_PICS,
  RARITY_COLORS, NORMAL_PULL_COST, PREMIUM_PULL_COST,
  rollGacha,
} from './Profile';

const DRAW_COUNT = 5;
// Rarities hidden as mystery until unlocked
const MYSTERY_RARITIES = new Set(['epic', 'legendary']);
// Reverse-biased weights for the 1x cycling animation (epic/legendary hover more = hype)
const CYCLE_WEIGHTS = { common: 2, rare: 10, epic: 30, legendary: 55 };

function PoolBox({ title, pics, cost, xp, setXp, owned, setOwned, profilePic, setProfilePic, pullCount, setPullCount, emojiFlood, setEmojiFlood, emojiFloodRevealed, setEmojiFloodRevealed }) {
  const [rolling, setRolling]         = useState(false);
  const [results, setResults]         = useState([]);
  const [highlighted, setHighlighted] = useState(null); // 1x cycling highlight
  const [revealId, setRevealId]       = useState(null); // 1x final reveal
  const [slotAnim, setSlotAnim]       = useState(null); // 5x: [{pic, settled}] | null
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
    setSlotAnim(null);
    setHighlighted(null);
    setRevealId(null);

    let pc = pullCount;
    const drawn = [];
    for (let i = 0; i < count; i++) drawn.push(rollGacha(pics, pc++));

    const randPic = () => pics[Math.floor(Math.random() * pics.length)];

    // Reverse-biased pick for 1x cycling — legendary flashes as ? for tension
    const cycleTotal = pics.reduce((s, p) => s + (CYCLE_WEIGHTS[p.rarity] ?? 2), 0);
    function randCyclePic() {
      let r = Math.random() * cycleTotal;
      for (const p of pics) { r -= CYCLE_WEIGHTS[p.rarity] ?? 2; if (r <= 0) return p; }
      return pics[pics.length - 1];
    }

    if (count === 1) {
      // ── Single draw: grid highlighting spin ──────────────────────────────
      // All pics eligible — mystery cards flash briefly as a teaser preview
      let frame = 0;
      const TOTAL_FRAMES = 48;

      function step() {
        const pic = randCyclePic();
        setHighlighted(pic.id);
        frame++;
        if (frame < TOTAL_FRAMES) {
          // Exponential easing: starts ~30ms, ends ~3000ms
          const t = frame / TOTAL_FRAMES;
          setTimeout(step, 30 * Math.pow(100, t));
        } else {
          // Land — reveal the result (bypasses mystery veil)
          setHighlighted(null);
          setRevealId(drawn[0].id);
          setTimeout(() => {
            setXp(prev => prev - drawCost);
            setOwned(prev => [...prev, drawn[0].id]);
            setPullCount(pc);
            setResults(drawn);
            setRevealId(null);
            setRolling(false);
            if (emojiFlood && setEmojiFloodRevealed) setTimeout(() => setEmojiFloodRevealed(true), 700);
            setTimeout(() => setResults([]), 2500);
          }, 2000);
        }
      }
      step();

    } else {
      // ── 5x draw: independent slot animation, gradually slowing ───────────
      const CYCLING_MS = 3000; // full-speed phase duration
      const SETTLE_GAP = 700;  // ms between each slot settling
      const SLOW_LEAD  = 1100; // each slot starts slowing this many ms before it settles

      setSlotAnim(drawn.map(() => ({ pic: randPic(), settled: false })));

      const startMs = Date.now();

      // Recursive setTimeout per slot — delay increases as settle approaches
      function cycleSlot(idx) {
        const settleAt  = startMs + CYCLING_MS + idx * SETTLE_GAP;
        const remaining = settleAt - Date.now();

        if (remaining <= 40) return; // settling timeout will handle the final frame

        setSlotAnim(prev => {
          if (!prev || prev[idx]?.settled) return prev;
          const next = [...prev];
          next[idx] = { pic: randPic(), settled: false };
          return next;
        });

        let delay;
        if (remaining > SLOW_LEAD) {
          delay = 82 + idx * 4; // fast phase
        } else {
          const t = 1 - remaining / SLOW_LEAD; // 0 → 1 as time runs out
          delay = 82 + idx * 4 + t * t * 320; // ease-in slowdown
        }

        setTimeout(() => cycleSlot(idx), delay);
      }

      drawn.forEach((_, idx) => cycleSlot(idx));

      // Settle slots one by one after the fast cycling phase
      setTimeout(() => {
        drawn.forEach((drawnPic, idx) => {
          setTimeout(() => {
            setSlotAnim(prev => {
              if (!prev) return prev;
              const next = [...prev];
              next[idx] = { pic: drawnPic, settled: true };
              return next;
            });

            if (idx === drawn.length - 1) {
              setTimeout(() => {
                setXp(prev => prev - drawCost);
                setOwned(prev => [...prev, ...drawn.map(r => r.id)]);
                setPullCount(pc);
                setResults(drawn);
                setSlotAnim(null);
                setRolling(false);
                if (emojiFlood && setEmojiFloodRevealed) setTimeout(() => setEmojiFloodRevealed(true), 700);
                setTimeout(() => setResults([]), 3000);
              }, 2000);
            }
          }, idx * SETTLE_GAP);
        });
      }, CYCLING_MS);
    }
  }

  const uniqueOwned = new Set(owned.filter(id => pics.some(p => p.id === id))).size;
  const ownedSet    = new Set(owned);
  const is1xResult  = !slotAnim && results.length === 1;

  return (
    <div className="gacha-pool-box">
      <div className="gacha-pool-box-header">
        <span className="gacha-pool-box-title">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {setEmojiFlood && (
            <button
              className={`gacha-emoji-toggle${emojiFlood ? ' active' : ''}`}
              onClick={() => {
                setEmojiFlood(v => !v);
                if (!emojiFlood && results.length > 0 && setEmojiFloodRevealed) setEmojiFloodRevealed(true);
              }}
              disabled={rolling}
            >{emojiFloodRevealed ? 'Emoji Flood' : '???'}</button>
          )}
          <span className="gacha-pool-box-owned">{uniqueOwned} / {pics.length}</span>
        </div>
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
                const isOwned         = ownedSet.has(pic.id);
                const isEquipped      = profilePic === pic.id;
                const isHighlit       = highlighted === pic.id;
                const isRevealing     = revealId === pic.id;
                const isLockedMystery = !isOwned && MYSTERY_RARITIES.has(pic.rarity);

                // Legendary locked: stays ? even when highlighted (tension, no reveal)
                // Epic locked: lifts veil when highlighted (brief teaser)
                const showMystery = isLockedMystery && !isRevealing &&
                  (rarity === 'legendary' || !isHighlit);
                // Owned always shows full color; highlights/reveals override everything
                const showColor = isOwned || (isHighlit && !showMystery) || isRevealing;
                // Locked non-mystery (common + rare) → faded B&W until owned
                const spanFilter = showColor ? 'none' : 'grayscale(1) opacity(0.15)';

                // Highlighted mystery still shows rarity border for tension
                const borderColor = (showMystery && !isHighlit)
                  ? 'var(--g-card-border)'
                  : (rolling && !isHighlit && !isOwned && !isRevealing)
                    ? 'var(--g-rolling-border)'
                    : RARITY_COLORS[rarity];

                return (
                  <div
                    key={pic.id}
                    className={`gacha-card-wrap rarity-${rarity}${isOwned ? ' owned' : ''}${showMystery ? ' mystery' : ''}`}
                    onClick={() => isOwned && !rolling && setProfilePic(pic.id)}
                    title={
                      showMystery ? '???' :
                      !isOwned && rarity !== 'common' ? '???' :
                      isEquipped ? pic.label :
                      isOwned ? `Equip ${pic.label}` :
                      pic.label  // locked common shows its name
                    }
                  >
                    <div
                      className={`gacha-card${isEquipped ? ' equipped' : ''}${(isHighlit || isRevealing) ? ' highlighted' : ''}${showMystery ? ' mystery' : ''}`}
                      style={{ borderColor }}
                    >
                      {showMystery ? (
                        <span className="gacha-mystery-mark">?</span>
                      ) : (
                        <span style={{ filter: spanFilter }}>
                          <PicDisplay pic={pic} size={pic.type === 'image' ? 65 : 44} />
                        </span>
                      )}
                      {isEquipped && <span className="gacha-card-on">ON</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Strip: slot animation during 5x, results after — click to dismiss */}
        {(slotAnim || results.length > 0) && (
          <div
            className="gacha-strip"
            style={{ cursor: results.length > 0 ? 'pointer' : 'default' }}
            onClick={() => results.length > 0 && setResults([])}
          >
            {(slotAnim || results).map((item, i) => {
              const pic     = slotAnim ? item.pic : item;
              const settled = slotAnim ? item.settled : true;
              // Always show rarity color — even during cycling (hype)
              const bdr = RARITY_COLORS[pic.rarity];
              return (
                <div
                  key={i}
                  className={`gacha-strip-card${settled ? ' settled' : ' cycling'}`}
                  style={{
                    borderColor: bdr,
                    ...(settled ? { boxShadow: `0 0 14px ${bdr}` } : {}),
                  }}
                >
                  {pic.type === 'emoji' ? (
                    is1xResult ? (
                      emojiFlood ? (
                        // 1x ON: dense text-based flood — fills every side of the circle
                        <div style={{ width: '100%', height: '100%', overflow: 'hidden', fontSize: 36, lineHeight: 1.15, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                          {Array(200).fill(pic.asset).join(' ')}
                        </div>
                      ) : (
                        // 1x OFF: large centered emoji
                        <span style={{ fontSize: 200, lineHeight: 1 }}>{pic.asset}</span>
                      )
                    ) : emojiFlood ? (
                      // 5x ON: compact 9-emoji grid per slot
                      <div className="gacha-strip-emoji">
                        {[...Array(9)].map((_, j) => (
                          <span key={j} style={{ fontSize: 16, lineHeight: 1 }}>{pic.asset}</span>
                        ))}
                      </div>
                    ) : (
                      // 5x OFF: single emoji per slot
                      <span style={{ fontSize: 36, lineHeight: 1 }}>{pic.asset}</span>
                    )
                  ) : (
                    <img src={pic.asset} alt={pic.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {xpMsg && <div className="gacha-xp-msg">not enough xp</div>}
      {!rolling && results.length === 0 && (
        <div className="gacha-draw-bar">
          <button className="gacha-draw-btn" onClick={() => draw(1)}>{`1x  ·  ${cost} XP`}</button>
          <button className="gacha-draw-btn" onClick={() => draw(DRAW_COUNT)}>{`5x  ·  ${cost * DRAW_COUNT} XP`}</button>
        </div>
      )}
    </div>
  );
}

export default function GachaPage({ xp, setXp, profilePic, setProfilePic, owned, setOwned, pullCount, setPullCount, onBack }) {
  const [emojiFlood, setEmojiFlood]               = useState(false);
  const [emojiFloodRevealed, setEmojiFloodRevealed] = useState(
    () => localStorage.getItem('emojiFloodRevealed') === 'true'
  );

  useEffect(() => {
    if (emojiFloodRevealed) localStorage.setItem('emojiFloodRevealed', 'true');
  }, [emojiFloodRevealed]);
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
          emojiFlood={emojiFlood} setEmojiFlood={setEmojiFlood}
          emojiFloodRevealed={emojiFloodRevealed} setEmojiFloodRevealed={setEmojiFloodRevealed}
        />
        <PoolBox
          title="Premium" pics={PREMIUM_PICS} cost={PREMIUM_PULL_COST}
          xp={xp} setXp={setXp} owned={owned} setOwned={setOwned}
          profilePic={profilePic} setProfilePic={setProfilePic}
          pullCount={pullCount} setPullCount={setPullCount}
          emojiFlood={emojiFlood}
        />
      </div>

    </div>
  );
}
