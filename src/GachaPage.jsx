import { useState, useEffect } from 'react';
import {
  ProfileAvatar, PicDisplay,
  NORMAL_PICS, PREMIUM_PICS,
  RARITY_COLORS, NORMAL_PULL_COST, PREMIUM_PULL_COST,
  rollGacha,
} from './Profile';

const DRAW_COUNT = 5;
const MYSTERY_RARITIES = new Set(['epic', 'legendary']);
const CYCLE_WEIGHTS = { common: 2, rare: 10, epic: 30, legendary: 55 };

function PoolBox({ title, pics, cost, xp, setXp, owned, setOwned, profilePic, setProfilePic, pullCount, setPullCount, first5Draw, setFirst5Draw, first5GuaranteeMode, emojiFlood, setEmojiFlood, emojiFloodRevealed, setEmojiFloodRevealed }) {
  const [rolling, setRolling]         = useState(false);
  const [results, setResults]         = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [slotAnim, setSlotAnim]       = useState(null);
  const [xpMsg, setXpMsg]             = useState(false);
  const [stripPhase, setStripPhase]   = useState(0); // 1x reveal: 0=?? 1=color 2=pic

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
    setStripPhase(0);

    const useFirst5Guarantee = count === DRAW_COUNT && first5Draw;

    let pc = pullCount;
    const drawn = [];
    for (let i = 0; i < count; i++) drawn.push(rollGacha(pics, pc++));

    // First pool 5x bonus guarantees at least one qualifying card in the batch, not all five.
    if (useFirst5Guarantee) {
      const meetsGuarantee = pic => (
        first5GuaranteeMode === 'legendary'
          ? pic.rarity === 'legendary'
          : (pic.rarity === 'epic' || pic.rarity === 'legendary')
      );

      if (!drawn.some(meetsGuarantee)) {
        const guaranteedIndex = Math.floor(Math.random() * drawn.length);
        drawn[guaranteedIndex] = rollGacha(
          pics,
          pullCount + guaranteedIndex,
          first5GuaranteeMode,
        );
      }
    }

    const revealEmoji = ms => { if (emojiFlood && setEmojiFloodRevealed) setTimeout(() => setEmojiFloodRevealed(true), ms); };

    // Weighted cycling: mystery cards (unowned epic/legendary) show most, then legendary, epic, rare, common
    const localOwnedSet = new Set(owned);
    const picWeights = pics.map(p =>
      (!localOwnedSet.has(p.id) && MYSTERY_RARITIES.has(p.rarity))
        ? (p.rarity === 'legendary' ? 90 : 50)
        : CYCLE_WEIGHTS[p.rarity] ?? 2
    );
    const cycleTotal = picWeights.reduce((s, w) => s + w, 0);
    function randCyclePic() {
      let r = Math.random() * cycleTotal;
      for (let j = 0; j < pics.length; j++) { r -= picWeights[j]; if (r <= 0) return pics[j]; }
      return pics[pics.length - 1];
    }

    if (count === 1) {
      // ── Single draw: grid highlighting spin ──────────────────────────────
      let frame = 0;
      const TOTAL_FRAMES = 22;
      function step() {
        setHighlighted(randCyclePic().id);
        frame++;
        if (frame < TOTAL_FRAMES) {
          const t = frame / TOTAL_FRAMES;
          setTimeout(step, 80 * Math.pow(12, t));
        } else {
          setHighlighted(null);
          // Go straight to strip reveal: ?? (500ms) → color (500ms) → pic
          setTimeout(() => {
            setXp(prev => prev - drawCost);
            setOwned(prev => [...prev, drawn[0].id]);
            setPullCount(pc);
            if (useFirst5Guarantee) setFirst5Draw(false);
            setResults(drawn);
            setRolling(false);
            setTimeout(() => setStripPhase(1), 500);
            setTimeout(() => setStripPhase(2), 1000);
            revealEmoji(1700);
            setTimeout(() => setResults([]), 3500);
          }, 1100);
        }
      }
      step();

    } else {
      // ── 5x draw: independent slot animation, gradually slowing ───────────
      const CYCLING_MS = 3000;
      const SETTLE_GAP = 700;
      const SLOW_LEAD  = 1100;

      setSlotAnim(drawn.map(() => ({ pic: randCyclePic(), settled: false })));
      const startMs = Date.now();

      function cycleSlot(idx) {
        const settleAt  = startMs + CYCLING_MS + idx * SETTLE_GAP;
        const remaining = settleAt - Date.now();
        if (remaining <= 40) return;
        setSlotAnim(prev => {
          if (!prev || prev[idx]?.settled) return prev;
          const next = [...prev];
          next[idx] = { pic: randCyclePic(), settled: false };
          return next;
        });
        const t = 1 - remaining / SLOW_LEAD;
        const delay = remaining > SLOW_LEAD ? 140 + idx * 6 : 140 + idx * 6 + t * t * 320;
        setTimeout(() => cycleSlot(idx), delay);
      }

      drawn.forEach((_, idx) => cycleSlot(idx));

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
                if (useFirst5Guarantee) setFirst5Draw(false);
                setResults(drawn);
                setSlotAnim(null);
                setRolling(false);
                revealEmoji(700);
                setTimeout(() => setResults([]), 3000);
              }, 2000);
            }
          }, idx * SETTLE_GAP);
        });
      }, CYCLING_MS);
    }
  }

  const ownedSet    = new Set(owned);
  const uniqueOwned = pics.filter(p => ownedSet.has(p.id)).length;
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
          <div className="gacha-pool-empty"><span>nothing yet</span></div>
        ) : (
          <div className="gacha-grid">
            {['legendary', 'epic', 'rare', 'common'].flatMap(rarity =>
              pics.filter(p => p.rarity === rarity).map(pic => {
                const isOwned     = ownedSet.has(pic.id);
                const isEquipped  = profilePic === pic.id;
                const isHighlit   = highlighted === pic.id;
                const showMystery = !isOwned && MYSTERY_RARITIES.has(pic.rarity);
                const spanFilter  = (isOwned || (isHighlit && !showMystery)) ? 'none' : 'grayscale(1) opacity(0.15)';
                const rarityColor = (isOwned || isHighlit) ? RARITY_COLORS[rarity] : 'var(--g-card-border)';
                const borderColor = isHighlit ? rarityColor
                  : showMystery   ? 'var(--g-card-border)'
                  : (rolling && !isOwned) ? 'var(--g-rolling-border)'
                  : rarityColor;

                return (
                  <div
                    key={pic.id}
                    className={`gacha-card-wrap rarity-${rarity}${isOwned ? ' owned' : ''}${showMystery ? ' mystery' : ''}`}
                    onClick={() => isOwned && !rolling && setProfilePic(pic.id)}
                    title={
                      (showMystery || (!isOwned && rarity !== 'common')) ? '???' :
                      isEquipped ? pic.label :
                      isOwned ? `Equip ${pic.label}` :
                      pic.label
                    }
                  >
                    <div
                      className={`gacha-card${isEquipped ? ' equipped' : ''}${isHighlit ? ' highlighted' : ''}${showMystery ? ' mystery' : ''}`}
                      style={{ borderColor, backgroundColor: isHighlit ? rarityColor + '55' : undefined }}
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

        {(slotAnim || results.length > 0) && (
          <div
            className="gacha-strip"
            style={{ cursor: results.length > 0 ? 'pointer' : 'default' }}
            onClick={() => results.length > 0 && setResults([])}
          >
            {(slotAnim || results).map((item, i) => {
              const pic        = slotAnim ? item.pic : item;
              const settled    = slotAnim ? item.settled : true;
              const isCycling   = !!slotAnim && !settled;
              const isMystery5x = isCycling && !ownedSet.has(pic.id) && MYSTERY_RARITIES.has(pic.rarity);
              const bdr         = (is1xResult && stripPhase < 1) ? '#555' : RARITY_COLORS[pic.rarity];
              return (
                <div
                  key={i}
                  className={`gacha-strip-card${settled ? ' settled' : ' cycling'}`}
                  style={{
                    borderColor: bdr,
                    boxShadow: settled && (!is1xResult || stripPhase >= 1) ? `0 0 14px ${bdr}` : undefined,
                    backgroundColor: (settled || !slotAnim || isMystery5x) && (!is1xResult || stripPhase >= 1) ? RARITY_COLORS[pic.rarity] + '30' : undefined,
                  }}
                >
                  {isMystery5x ? (
                    <span style={{ fontSize: 36, lineHeight: 1, color: RARITY_COLORS[pic.rarity] }}>??</span>
                  ) : is1xResult && stripPhase < 2 ? (
                    <span style={{ fontSize: 120, lineHeight: 1, color: stripPhase === 0 ? '#555' : RARITY_COLORS[pic.rarity] }}>??</span>
                  ) : pic.type !== 'emoji' ? (
                    <img src={pic.asset} alt={pic.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : is1xResult ? (
                    emojiFlood
                      ? <div style={{ width: '100%', height: '100%', overflow: 'hidden', fontSize: 36, lineHeight: 1.15, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{(pic.asset + ' ').repeat(200).trimEnd()}</div>
                      : <span style={{ fontSize: 200, lineHeight: 1 }}>{pic.asset}</span>
                  ) : emojiFlood ? (
                    <div className="gacha-strip-emoji">
                      {Array.from({ length: 9 }, (_, j) => <span key={j} style={{ fontSize: 16, lineHeight: 1 }}>{pic.asset}</span>)}
                    </div>
                  ) : (
                    <span style={{ fontSize: 36, lineHeight: 1 }}>{pic.asset}</span>
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

export default function GachaPage({ xp, setXp, profilePic, setProfilePic, owned, setOwned, normalPullCount, setNormalPullCount, premiumPullCount, setPremiumPullCount, normal5Draw, setNormal5Draw, premium5Draw, setPremium5Draw, onBack }) {
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
          <ProfileAvatar profilePic={profilePic} size={40} />
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
          pullCount={normalPullCount} setPullCount={setNormalPullCount}
          first5Draw={normal5Draw} setFirst5Draw={setNormal5Draw}
          first5GuaranteeMode="legendary"
          emojiFlood={emojiFlood} setEmojiFlood={setEmojiFlood}
          emojiFloodRevealed={emojiFloodRevealed} setEmojiFloodRevealed={setEmojiFloodRevealed}
        />
        <PoolBox
          title="Premium" pics={PREMIUM_PICS} cost={PREMIUM_PULL_COST}
          xp={xp} setXp={setXp} owned={owned} setOwned={setOwned}
          profilePic={profilePic} setProfilePic={setProfilePic}
          pullCount={premiumPullCount} setPullCount={setPremiumPullCount}
          first5Draw={premium5Draw} setFirst5Draw={setPremium5Draw}
          first5GuaranteeMode="epicOrLegendary"
          emojiFlood={emojiFlood}
        />
      </div>
    </div>
  );
}
