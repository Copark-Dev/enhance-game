import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEnhance } from '../hooks/useEnhance';
import { useAuth } from '../context/AuthContext';
import { MAX_LEVEL, formatGold, SELL_PRICE } from '../utils/constants';
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
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice,
    successRate, downgradeRate, destroyRate, enhanceCost,
    canEnhance, enhance, sell, reset, addGold, setResult, setGold, setStats
  } = useEnhance(0, user?.gold || 50000);

  const [itemImage, setItemImage] = useState(null);
  const sellRange = SELL_PRICE[level] || { min: 0, max: 0 };

  // 유저 데이터로 초기화
  useEffect(() => {
    if (user) {
      setGold(user.gold || 50000);
      if (user.stats) {
        setStats(user.stats);
      }
    }
  }, [user]);

  // 골드나 통계 변경시 Firebase 저장
  useEffect(() => {
    if (user && !isEnhancing) {
      const saveTimeout = setTimeout(() => {
        updateUserData({ gold, stats });
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [gold, stats, isEnhancing]);

  useEffect(() => {
    if (result) {
      const duration = result === 'sold' ? 1500 : level >= 15 ? 2500 : level >= 10 ? 2000 : 1500;
      const timer = setTimeout(() => setResult(null), duration);
      return () => clearTimeout(timer);
    }
  }, [result, setResult, level]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setItemImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div style={styles.container}>
      <div style={styles.bgGlow} />
      
      <div style={styles.topBar}>
        <motion.button onClick={() => navigate('/admin')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.adminBtn}>
          ⚙️ 어드민
        </motion.button>
        
        <div style={styles.userInfo}>
          {user?.profileImage && <img src={user.profileImage} alt='profile' style={styles.profileImg} />}
          <span style={styles.userName}>{user?.nickname || '사용자'}</span>
          <motion.button onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.logoutBtn}>
            로그아웃
          </motion.button>
        </div>
      </div>

      <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={styles.title}>⚔️ 강화 시뮬레이터</motion.h1>
      
      <div style={styles.uploadArea}>
        <label style={styles.uploadBtn}>📷 커스텀 이미지<input type='file' accept='image/*' onChange={handleImageUpload} style={{ display: 'none' }} /></label>
        {itemImage && <button onClick={() => setItemImage(null)} style={styles.removeBtn}>✕</button>}
      </div>

      <div style={styles.goldArea}>
        <span style={styles.goldIcon}>🪙</span>
        <span style={styles.goldAmount}>{formatGold(gold)}</span>
        <button onClick={() => addGold(10000)} style={styles.addBtn}>+1만</button>
        <button onClick={() => addGold(100000)} style={styles.addBtn}>+10만</button>
      </div>

      <div style={styles.itemArea}>
        <ParticleEffect trigger={result} type={result || 'success'} level={level} />
        <ItemDisplay level={level} isEnhancing={isEnhancing} result={result} isDestroyed={isDestroyed} itemImage={itemImage} />
      </div>

      <div style={styles.priceInfo}>
        <div style={styles.priceRow}><span style={styles.priceLabel}>강화 비용</span><span style={styles.priceCost}>{formatGold(enhanceCost)} G</span></div>
        <div style={styles.priceRow}><span style={styles.priceLabel}>판매 예상가</span><span style={styles.priceSell}>{formatGold(sellRange.min)} ~ {formatGold(sellRange.max)} G</span></div>
      </div>

      <RateDisplay successRate={successRate} downgradeRate={downgradeRate} destroyRate={destroyRate} />

      <div style={styles.buttonArea}>
        {isDestroyed ? (
          <motion.button onClick={reset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.resetBtn}>🔄 다시 시작</motion.button>
        ) : (
          <div style={styles.buttonRow}>
            <EnhanceButton onClick={enhance} disabled={!canEnhance} isEnhancing={isEnhancing} isMax={level >= MAX_LEVEL} />
            <motion.button onClick={sell} disabled={isEnhancing || level === 0}
              whileHover={!isEnhancing && level > 0 ? { scale: 1.05 } : {}}
              whileTap={!isEnhancing && level > 0 ? { scale: 0.95 } : {}}
              style={{ ...styles.sellBtn, opacity: isEnhancing || level === 0 ? 0.4 : 1, cursor: isEnhancing || level === 0 ? 'not-allowed' : 'pointer' }}>
              💰 판매
            </motion.button>
          </div>
        )}
      </div>

      {gold < enhanceCost && !isDestroyed && level < MAX_LEVEL && <div style={styles.warning}>⚠️ 골드 부족! (필요: {formatGold(enhanceCost)}G)</div>}

      <div style={styles.tierGuide}>
        {tierGuide.map((t) => (<div key={t.range} style={{ color: t.color, textAlign: 'center' }}><div style={{ fontSize: 11 }}>{t.label}</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{t.range}</div></div>))}
      </div>

      <StatsPanel stats={stats} gold={gold} />
      <ResultOverlay result={result} level={level} lastSellPrice={lastSellPrice} />
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 80, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, fontFamily: 'Noto Sans KR, sans-serif', position: 'relative', overflow: 'hidden' },
  bgGlow: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(80,80,150,0.2) 0%, transparent 70%)', pointerEvents: 'none' },
  topBar: { position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 100 },
  adminBtn: { padding: '8px 14px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  profileImg: { width: 32, height: 32, borderRadius: '50%', border: '2px solid #FFD700' },
  userName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#F44336', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  title: { color: '#FFD700', fontSize: '2rem', marginBottom: 15, marginTop: 0, textShadow: '0 0 30px rgba(255,215,0,0.6)', zIndex: 1 },
  uploadArea: { display: 'flex', gap: 10, marginBottom: 12, zIndex: 1 },
  uploadBtn: { padding: '8px 16px', backgroundColor: '#2a2a4a', color: '#FFF', borderRadius: 20, cursor: 'pointer', fontSize: 14, border: '1px solid #444' },
  removeBtn: { padding: '8px 12px', backgroundColor: '#F44336', color: '#FFF', border: 'none', borderRadius: 20, cursor: 'pointer' },
  goldArea: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, zIndex: 1 },
  goldIcon: { fontSize: 28 },
  goldAmount: { color: '#FFD700', fontSize: 26, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,215,0,0.5)', minWidth: 100 },
  addBtn: { padding: '6px 12px', backgroundColor: '#FFD700', color: '#000', border: 'none', borderRadius: 15, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  itemArea: { position: 'relative', width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, zIndex: 1 },
  priceInfo: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 15, padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, zIndex: 1 },
  priceRow: { display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 14 },
  priceLabel: { color: '#888' },
  priceCost: { color: '#FF6B6B', fontWeight: 'bold' },
  priceSell: { color: '#4CAF50', fontWeight: 'bold' },
  buttonArea: { marginTop: 15, zIndex: 1 },
  buttonRow: { display: 'flex', gap: 15 },
  resetBtn: { padding: '16px 50px', fontSize: 18, fontWeight: 'bold', color: '#FFF', background: 'linear-gradient(145deg, #4CAF50, #388E3C)', border: 'none', borderRadius: 30, cursor: 'pointer' },
  sellBtn: { padding: '16px 35px', fontSize: 18, fontWeight: 'bold', color: '#000', background: 'linear-gradient(145deg, #FFD700, #FFA000)', border: 'none', borderRadius: 30 },
  warning: { marginTop: 15, padding: '10px 20px', backgroundColor: 'rgba(255,152,0,0.2)', color: '#FF9800', borderRadius: 10, fontSize: 14, zIndex: 1 },
  tierGuide: { display: 'flex', gap: 12, marginTop: 25, padding: '10px 18px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, zIndex: 1 },
};

export default EnhanceGame;
