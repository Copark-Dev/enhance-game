import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhance } from '../hooks/useEnhance';
import { useAuth } from '../context/AuthContext';
import { MAX_LEVEL, formatGold, SELL_PRICE, getLevelColor, getLevelTier } from '../utils/constants';
import ItemDisplay from './ItemDisplay';
import RateDisplay from './RateDisplay';
import EnhanceButton from './EnhanceButton';
import ParticleEffect from './ParticleEffect';
import ResultOverlay from './ResultOverlay';
import StatsPanel from './StatsPanel';

const EnhanceGame = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserData } = useAuth();
  const {
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice, isNewRecord,
    successRate, downgradeRate, destroyRate, enhanceCost, inventory,
    buffs, activeEvent, eventMultiplier,
    canEnhance, enhance, sell, reset, addGold, setResult, setGold, setStats,
    setLevel, setInventory, setBuffs, storeItem, takeItem
  } = useEnhance(0, user?.gold || 50000);

  const [showMobileStats, setShowMobileStats] = useState(false);
  const sellRange = SELL_PRICE[level] || { min: 0, max: 0 };

  // 유저 데이터로 초기화
  useEffect(() => {
    if (user) {
      setGold(user.gold || 50000);
      if (user.stats) setStats(user.stats);
      if (typeof user.level === 'number') setLevel(user.level);
      if (user.inventory) setInventory(user.inventory);
      if (user.buffs) setBuffs(user.buffs);
    }
  }, [user]);

  // 데이터 변경시 Firebase 저장
  useEffect(() => {
    if (user && !isEnhancing) {
      const saveTimeout = setTimeout(() => {
        updateUserData({ gold, stats, level, inventory, buffs });
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [gold, stats, level, inventory, buffs, isEnhancing]);

  // 이벤트 메시지
  const eventMessages = {
    lucky: '⚡ 럭키 강화! +2 상승!',
    blessing: '🌟 축복 획득! 다음 하락 방지',
    blessingUsed: '🌟 축복 발동! 하락 방지됨',
    passion: '🔥 열정 모드! 성공률 2배',
    shieldGain: '🛡️ 보호막 획득!',
    shieldUsed: '🛡️ 보호막 발동! 파괴 방지됨',
    goldenChance: `💰 황금 찬스! ${eventMultiplier}배 판매!`,
    freeEnhance: '🎁 무료 강화권 획득!',
    jackpot: '💎 잭팟!! +10,000G',
  };

  useEffect(() => {
    if (result) {
      const duration = result === 'sold' ? 1500 : level >= 15 ? 2500 : level >= 10 ? 2000 : 1500;
      const timer = setTimeout(() => setResult(null), duration);
      return () => clearTimeout(timer);
    }
  }, [result, setResult, level]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleShare = () => {
    if (!window.Kakao) {
      alert('카카오 SDK 로드 실패');
      return;
    }
    const tierName = tierGuide.find(t => {
      const [start, end] = t.range.replace('+', '').split('~').map(Number);
      return level >= start && level <= end;
    })?.label || '일반';

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '⚔️ 강화 시뮬레이터',
        description: `${user?.nickname || '사용자'}님의 기록\n🏆 최고 +${stats.maxLevel} (${tierName})\n🎯 성공률 ${stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0}%`,
        imageUrl: 'https://copark-dev.github.io/enhance-game/og-image.png',
        link: {
          mobileWebUrl: 'https://copark-dev.github.io/enhance-game/',
          webUrl: 'https://copark-dev.github.io/enhance-game/',
        },
      },
      buttons: [
        {
          title: '나도 강화하기',
          link: {
            mobileWebUrl: 'https://copark-dev.github.io/enhance-game/',
            webUrl: 'https://copark-dev.github.io/enhance-game/',
          },
        },
      ],
    });
  };

  const tierGuide = [
    { range: '+0~2', color: '#AAAAAA', label: '일반' },
    { range: '+3~5', color: '#4CAF50', label: '고급' },
    { range: '+6~8', color: '#2196F3', label: '희귀' },
    { range: '+9~11', color: '#9C27B0', label: '영웅' },
    { range: '+12~14', color: '#FF9800', label: '전설' },
    { range: '+15~17', color: '#F44336', label: '신화' },
    { range: '+18~20', color: '#E91E63', label: '초월' },
  ];

  return (
    <div style={styles.container} className="game-container">
      <div style={styles.bgGlow} />

      {/* 상단 고정바 */}
      <div style={styles.topBar} className="top-bar">
        {(user?.email === 'psw4887@naver.com' || user?.nickname === '박세완') && (
          <motion.button onClick={() => navigate('/admin')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.adminBtn}>
            ⚙️ 어드민
          </motion.button>
        )}

        <div style={styles.userInfo} className="user-info">
          {user?.profileImage && <img src={user.profileImage} alt='profile' style={styles.profileImg} className="profile-img" />}
          <span style={styles.userName} className="user-name">{user?.nickname || '사용자'}</span>
          <motion.button onClick={() => setShowMobileStats(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.statsBtn} className="mobile-stats-btn">
            📊
          </motion.button>
          <motion.button onClick={handleShare} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.shareBtn}>
            📤 공유
          </motion.button>
          <motion.button onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.logoutBtn}>
            로그아웃
          </motion.button>
        </div>
      </div>

      {/* 파티클 이펙트 - 별도 레이어 */}
      <ParticleEffect trigger={result} type={result || 'success'} level={level} />

      {/* 아이템 영역 - 화면 정중앙 고정 */}
      <div style={styles.centerItem} className="item-display-wrapper">
        <ItemDisplay level={level} isEnhancing={isEnhancing} result={result} isDestroyed={isDestroyed} />
      </div>

      {/* 상단 UI */}
      <div style={styles.topUI}>
        <motion.h1 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={styles.title} className="game-title">⚔️ 강화 시뮬레이터</motion.h1>
        <div style={styles.goldArea} className="gold-area">
          <div style={styles.coinIcon}>
            <span style={styles.coinInner}>G</span>
          </div>
          <span style={styles.goldAmount} className="gold-amount">{formatGold(gold)}</span>
          <motion.button
            onClick={() => addGold(10)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={styles.grindBtn}
          >
            ⛏️ +10
          </motion.button>
        </div>

        {/* 활성 버프 표시 */}
        {(buffs.shield || buffs.freeEnhance || buffs.passion || buffs.blessing) && (
          <div style={styles.buffArea}>
            {buffs.shield && <span style={styles.buffBadge}>🛡️</span>}
            {buffs.freeEnhance && <span style={styles.buffBadge}>🎁</span>}
            {buffs.passion && <span style={{...styles.buffBadge, background: 'linear-gradient(145deg, #FF6B6B, #FF4444)'}}>🔥 2x</span>}
            {buffs.blessing && <span style={styles.buffBadge}>🌟</span>}
          </div>
        )}
      </div>

      {/* 이벤트 알림 */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            style={styles.eventNotification}
          >
            {eventMessages[activeEvent]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 UI */}
      <div style={styles.bottomUI}>
        <div style={styles.priceInfo} className="price-info">
          <div style={styles.priceRow}><span style={styles.priceLabel}>강화 비용</span><span style={styles.priceCost}>{formatGold(enhanceCost)} G</span></div>
          <div style={styles.priceRow}><span style={styles.priceLabel}>판매 예상가</span><span style={styles.priceSell}>{formatGold(sellRange.min)} ~ {formatGold(sellRange.max)} G</span></div>
        </div>

        <RateDisplay successRate={successRate} downgradeRate={downgradeRate} destroyRate={destroyRate} />

        <div style={styles.buttonArea}>
          {isDestroyed ? (
            <motion.button onClick={reset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.resetBtn}>🔄 다시 시작</motion.button>
          ) : (
            <div style={styles.buttonRow} className="button-row">
              <EnhanceButton onClick={enhance} disabled={!canEnhance} isEnhancing={isEnhancing} isMax={level >= MAX_LEVEL} />
              <motion.button onClick={sell} disabled={isEnhancing || level === 0}
                whileHover={!isEnhancing && level > 0 ? { scale: 1.05 } : {}}
                whileTap={!isEnhancing && level > 0 ? { scale: 0.95 } : {}}
                className="sell-btn"
                style={{ ...styles.sellBtn, opacity: isEnhancing || level === 0 ? 0.4 : 1, cursor: isEnhancing || level === 0 ? 'not-allowed' : 'pointer' }}>
                💰 판매
              </motion.button>
              <motion.button onClick={storeItem} disabled={isEnhancing || level === 0 || inventory.length >= 5}
                whileHover={!isEnhancing && level > 0 && inventory.length < 5 ? { scale: 1.05 } : {}}
                whileTap={!isEnhancing && level > 0 && inventory.length < 5 ? { scale: 0.95 } : {}}
                className="store-btn"
                style={{ ...styles.storeBtn, opacity: isEnhancing || level === 0 || inventory.length >= 5 ? 0.4 : 1, cursor: isEnhancing || level === 0 || inventory.length >= 5 ? 'not-allowed' : 'pointer' }}>
                📦 보관
              </motion.button>
            </div>
          )}
        </div>

        {gold < enhanceCost && !isDestroyed && level < MAX_LEVEL && <div style={styles.warning}>⚠️ 골드 부족! (필요: {formatGold(enhanceCost)}G)</div>}

        {/* 보관함 */}
        <div style={styles.inventoryArea} className="inventory-area">
          <div style={styles.inventoryLabel}>📦 보관함 ({inventory.length}/5)</div>
          <div style={styles.inventorySlots}>
            {[0, 1, 2, 3, 4].map((i) => {
              const itemLevel = inventory[i];
              const hasItem = itemLevel !== undefined;
              const color = hasItem ? getLevelColor(itemLevel) : '#333';
              return (
                <motion.div
                  key={i}
                  onClick={() => hasItem && takeItem(i)}
                  whileHover={hasItem ? { scale: 1.1 } : {}}
                  whileTap={hasItem ? { scale: 0.95 } : {}}
                  style={{
                    ...styles.inventorySlot,
                    borderColor: color,
                    boxShadow: hasItem ? `0 0 10px ${color}` : 'none',
                    cursor: hasItem ? 'pointer' : 'default',
                  }}
                >
                  {hasItem ? (
                    <>
                      <span style={{ color, fontWeight: 'bold', fontSize: 14 }}>+{itemLevel}</span>
                      <span style={{ color: '#888', fontSize: 9 }}>{getLevelTier(itemLevel)}</span>
                    </>
                  ) : (
                    <span style={{ color: '#444', fontSize: 18 }}>-</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <StatsPanel stats={stats} gold={gold} isMobileOpen={showMobileStats} onClose={() => setShowMobileStats(false)} />
      <ResultOverlay result={result} level={level} lastSellPrice={lastSellPrice} isNewRecord={isNewRecord} />
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 70, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, fontFamily: 'Noto Sans KR, sans-serif', position: 'relative', overflow: 'hidden' },
  centerItem: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' },
  topUI: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 2 },
  bottomUI: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 },
  bgGlow: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(80,80,150,0.2) 0%, transparent 70%)', pointerEvents: 'none' },
  topBar: { position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 100 },
  adminBtn: { padding: '8px 14px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  profileImg: { width: 32, height: 32, borderRadius: '50%', border: '2px solid #FFD700' },
  userName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#F44336', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  shareBtn: { padding: '6px 12px', backgroundColor: '#FEE500', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' },
  statsBtn: { padding: '6px 10px', backgroundColor: '#2196F3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: '1.5rem', marginBottom: 5, marginTop: 0, textShadow: '0 0 30px rgba(255,215,0,0.6)', zIndex: 1 },
  uploadArea: { display: 'flex', gap: 10, marginBottom: 8, zIndex: 1 },
  uploadBtn: { padding: '8px 16px', backgroundColor: '#2a2a4a', color: '#FFF', borderRadius: 20, cursor: 'pointer', fontSize: 14, border: '1px solid #444' },
  removeBtn: { padding: '8px 12px', backgroundColor: '#F44336', color: '#FFF', border: 'none', borderRadius: 20, cursor: 'pointer' },
  goldArea: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, zIndex: 1 },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #FFD700, #FFA500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(255,215,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
    border: '2px solid #DAA520',
  },
  coinInner: {
    color: '#8B4513',
    fontSize: 18,
    fontWeight: 'bold',
    textShadow: '0 1px 0 rgba(255,255,255,0.4)',
    fontFamily: 'serif',
  },
  goldAmount: { color: '#FFD700', fontSize: 26, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,215,0,0.5)', minWidth: 100 },
  grindBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(145deg, #4a4a6a, #2a2a4a)',
    color: '#FFD700',
    border: '1px solid #666',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  addBtn: { padding: '6px 12px', backgroundColor: '#FFD700', color: '#000', border: 'none', borderRadius: 15, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  itemArea: { position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, zIndex: 1 },
  priceInfo: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 15, padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, zIndex: 1 },
  priceRow: { display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 14 },
  priceLabel: { color: '#888' },
  priceCost: { color: '#FF6B6B', fontWeight: 'bold' },
  priceSell: { color: '#4CAF50', fontWeight: 'bold' },
  buttonArea: { marginTop: 15, zIndex: 1 },
  buttonRow: { display: 'flex', gap: 15 },
  resetBtn: { padding: '16px 50px', fontSize: 18, fontWeight: 'bold', color: '#FFF', background: 'linear-gradient(145deg, #4CAF50, #388E3C)', border: 'none', borderRadius: 30, cursor: 'pointer' },
  sellBtn: { padding: '16px 35px', fontSize: 18, fontWeight: 'bold', color: '#000', background: 'linear-gradient(145deg, #FFD700, #FFA000)', border: 'none', borderRadius: 30 },
  storeBtn: { padding: '16px 25px', fontSize: 18, fontWeight: 'bold', color: '#fff', background: 'linear-gradient(145deg, #6B5B95, #4A4070)', border: 'none', borderRadius: 30 },
  warning: { marginTop: 15, padding: '10px 20px', backgroundColor: 'rgba(255,152,0,0.2)', color: '#FF9800', borderRadius: 10, fontSize: 14, zIndex: 1 },
  inventoryArea: { marginTop: 12, padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, zIndex: 1 },
  inventoryLabel: { color: '#888', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  inventorySlots: { display: 'flex', gap: 8, justifyContent: 'center' },
  inventorySlot: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(20,20,40,0.8)',
    border: '2px solid #333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierGuide: { display: 'flex', gap: 12, marginTop: 25, padding: '10px 18px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, zIndex: 1 },
  buffArea: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 5 },
  buffBadge: {
    padding: '4px 10px',
    background: 'linear-gradient(145deg, #4a4a6a, #2a2a4a)',
    borderRadius: 15,
    fontSize: 14,
    border: '1px solid #666',
    color: '#fff',
  },
  eventNotification: {
    position: 'fixed',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: 'linear-gradient(145deg, #FFD700, #FFA500)',
    color: '#000',
    borderRadius: 20,
    fontSize: 16,
    fontWeight: 'bold',
    boxShadow: '0 4px 20px rgba(255,215,0,0.5)',
    zIndex: 1000,
  },
};

export default EnhanceGame;
