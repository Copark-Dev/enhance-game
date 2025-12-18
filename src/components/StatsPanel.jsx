import { motion, AnimatePresence } from 'framer-motion';
import { getLevelColor, getLevelTier, formatGold } from '../utils/constants';

const StatsPanel = ({ stats, gold, isMobileOpen, onClose }) => {
  const successRateCalc = stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0;
  const maxColor = getLevelColor(stats.maxLevel);
  const maxTier = getLevelTier(stats.maxLevel);
  const profit = stats.totalEarned - stats.totalSpent;

  // 데스크탑 버전
  const desktopPanel = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="stats-panel"
      style={{
        position: 'fixed',
        top: 70,
        right: 20,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 15,
        backdropFilter: 'blur(10px)',
        minWidth: 200,
        border: '1px solid #333',
      }}
    >
      <StatsContent
        stats={stats}
        gold={gold}
        successRateCalc={successRateCalc}
        maxColor={maxColor}
        maxTier={maxTier}
        profit={profit}
      />
    </motion.div>
  );

  // 모바일 모달 버전
  const mobileModal = (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(20,20,40,0.98)',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 320,
              border: '2px solid #FFD700',
              boxShadow: '0 0 40px rgba(255,215,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#FFD700', fontSize: 20 }}>📊 통계</h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
            <StatsContent
              stats={stats}
              gold={gold}
              successRateCalc={successRateCalc}
              maxColor={maxColor}
              maxTier={maxTier}
              profit={profit}
              isMobile
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopPanel}
      {mobileModal}
    </>
  );
};

const StatsContent = ({ stats, gold, successRateCalc, maxColor, maxTier, profit, isMobile }) => (
  <>
    {!isMobile && (
      <h3 style={{ margin: '0 0 12px 0', color: '#FFD700', fontSize: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        📊 통계
      </h3>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 8 }}>
      <StatItem label="🪙 보유 골드" value={formatGold(gold)} color="#FFD700" isMobile={isMobile} />
      <StatItem label="🎯 총 시도" value={stats.attempts} isMobile={isMobile} />
      <StatItem label="✅ 성공" value={stats.successes} color="#4CAF50" isMobile={isMobile} />
      <StatItem label="❌ 실패" value={stats.failures} color="#F44336" isMobile={isMobile} />
      <StatItem label="📈 성공률" value={successRateCalc + '%'} isMobile={isMobile} />
      <div style={{ borderTop: '1px solid #444', marginTop: 8, paddingTop: 12 }}>
        <StatItem label="💸 총 지출" value={formatGold(stats.totalSpent) + ' G'} color="#FF6B6B" isMobile={isMobile} />
        <StatItem label="💰 총 수익" value={formatGold(stats.totalEarned) + ' G'} color="#4CAF50" isMobile={isMobile} />
        <StatItem label="📊 손익" value={(profit >= 0 ? '+' : '') + formatGold(profit) + ' G'} color={profit >= 0 ? '#4CAF50' : '#FF6B6B'} isMobile={isMobile} />
      </div>
      <div style={{ borderTop: '1px solid #444', marginTop: 8, paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? 16 : 14 }}>
          <span style={{ color: '#AAA' }}>🏆 최고 기록</span>
          <span style={{ color: maxColor, fontWeight: 'bold', fontSize: isMobile ? 20 : 14 }}>+{stats.maxLevel}</span>
        </div>
        {stats.maxLevel >= 3 && (
          <div style={{ textAlign: 'right', fontSize: isMobile ? 14 : 12, color: maxColor, marginTop: 4 }}>{maxTier}</div>
        )}
      </div>
    </div>
  </>
);

const StatItem = ({ label, value, color = '#FFF', isMobile }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? 15 : 13, marginBottom: isMobile ? 4 : 2 }}>
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color, fontWeight: 'bold' }}>{value}</span>
  </div>
);

export default StatsPanel;
