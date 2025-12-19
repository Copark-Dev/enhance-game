import { motion, AnimatePresence } from 'framer-motion';
import { getLevelColor, getLevelTier, formatGold } from '../utils/constants';

const StatsPanel = ({ stats, gold, isMobileOpen, onClose, onResetStats, user }) => {
  const successRateCalc = stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0;
  const maxColor = getLevelColor(stats.maxLevel);
  const maxTier = getLevelTier(stats.maxLevel);
  const profit = stats.totalEarned - stats.totalSpent;

  // 추가 통계 계산
  const avgCostPerAttempt = stats.attempts > 0 ? Math.floor(stats.totalSpent / stats.attempts) : 0;
  const avgEarnPerSuccess = stats.successes > 0 ? Math.floor(stats.totalEarned / stats.successes) : 0;
  const destroyRate = stats.attempts > 0 ? ((stats.destroys || 0) / stats.attempts * 100).toFixed(1) : 0;
  const failRate = stats.attempts > 0 ? ((stats.failures / stats.attempts) * 100).toFixed(1) : 0;

  // 배틀 통계
  const battles = user?.battleStats?.battles || 0;
  const wins = user?.battleStats?.wins || 0;
  const winRate = battles > 0 ? ((wins / battles) * 100).toFixed(1) : 0;

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
        avgCostPerAttempt={avgCostPerAttempt}
        avgEarnPerSuccess={avgEarnPerSuccess}
        destroyRate={destroyRate}
        failRate={failRate}
        battles={battles}
        wins={wins}
        winRate={winRate}
        onResetStats={onResetStats}
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
              padding: 20,
              width: '100%',
              maxWidth: 340,
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '2px solid #FFD700',
              boxShadow: '0 0 40px rgba(255,215,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#FFD700', fontSize: 18 }}>📊 통계</h3>
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
              avgCostPerAttempt={avgCostPerAttempt}
              avgEarnPerSuccess={avgEarnPerSuccess}
              destroyRate={destroyRate}
              failRate={failRate}
              battles={battles}
              wins={wins}
              winRate={winRate}
              onResetStats={onResetStats}
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

const StatsContent = ({
  stats, gold, successRateCalc, maxColor, maxTier, profit,
  avgCostPerAttempt, avgEarnPerSuccess, destroyRate, failRate,
  battles, wins, winRate, onResetStats, isMobile
}) => {
  const handleReset = () => {
    if (confirm('정말 통계를 초기화하시겠습니까?\n(골드와 장비는 유지됩니다)')) {
      onResetStats && onResetStats();
    }
  };

  return (
    <>
      {!isMobile && (
        <h3 style={{ margin: '0 0 12px 0', color: '#FFD700', fontSize: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
          📊 통계
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 4 }}>
        {/* 기본 정보 */}
        <SectionTitle title="💰 자산" isMobile={isMobile} />
        <StatItem label="보유 골드" value={formatGold(gold)} color="#FFD700" isMobile={isMobile} />
        <StatItem label="총 지출" value={formatGold(stats.totalSpent)} color="#FF6B6B" isMobile={isMobile} />
        <StatItem label="총 수익" value={formatGold(stats.totalEarned)} color="#4CAF50" isMobile={isMobile} />
        <StatItem label="손익" value={(profit >= 0 ? '+' : '') + formatGold(profit)} color={profit >= 0 ? '#4CAF50' : '#FF6B6B'} isMobile={isMobile} highlight />

        {/* 강화 통계 */}
        <SectionTitle title="⚔️ 강화" isMobile={isMobile} />
        <StatItem label="총 시도" value={stats.attempts.toLocaleString()} isMobile={isMobile} />
        <StatItem label="성공" value={stats.successes.toLocaleString()} color="#4CAF50" isMobile={isMobile} />
        <StatItem label="실패" value={stats.failures.toLocaleString()} color="#F44336" isMobile={isMobile} />
        <StatItem label="파괴" value={(stats.destroys || 0).toLocaleString()} color="#9C27B0" isMobile={isMobile} />

        {/* 확률 */}
        <SectionTitle title="📈 확률" isMobile={isMobile} />
        <StatItem label="성공률" value={successRateCalc + '%'} color="#4CAF50" isMobile={isMobile} />
        <StatItem label="실패률" value={failRate + '%'} color="#F44336" isMobile={isMobile} />
        <StatItem label="파괴률" value={destroyRate + '%'} color="#9C27B0" isMobile={isMobile} />

        {/* 효율 */}
        <SectionTitle title="💡 효율" isMobile={isMobile} />
        <StatItem label="평균 강화비용" value={formatGold(avgCostPerAttempt)} isMobile={isMobile} />
        <StatItem label="성공당 수익" value={formatGold(avgEarnPerSuccess)} color="#4CAF50" isMobile={isMobile} />

        {/* 배틀 */}
        {battles > 0 && (
          <>
            <SectionTitle title="⚔️ 배틀" isMobile={isMobile} />
            <StatItem label="총 배틀" value={battles.toLocaleString()} isMobile={isMobile} />
            <StatItem label="승리" value={wins.toLocaleString()} color="#4CAF50" isMobile={isMobile} />
            <StatItem label="패배" value={(battles - wins).toLocaleString()} color="#F44336" isMobile={isMobile} />
            <StatItem label="승률" value={winRate + '%'} color={parseFloat(winRate) >= 50 ? '#4CAF50' : '#F44336'} isMobile={isMobile} />
          </>
        )}

        {/* 최고 기록 */}
        <SectionTitle title="🏆 최고 기록" isMobile={isMobile} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: isMobile ? 15 : 13 }}>
          <span style={{ color: '#888' }}>최고 강화</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: maxColor, fontWeight: 'bold', fontSize: isMobile ? 18 : 16 }}>+{stats.maxLevel}</span>
            {stats.maxLevel >= 3 && (
              <span style={{ color: maxColor, fontSize: isMobile ? 12 : 10, marginLeft: 6 }}>{maxTier}</span>
            )}
          </div>
        </div>

        {onResetStats && (
          <button
            onClick={handleReset}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #666',
              borderRadius: 8,
              color: '#888',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            🔄 통계 초기화
          </button>
        )}
      </div>
    </>
  );
};

const SectionTitle = ({ title, isMobile }) => (
  <div style={{
    color: '#666',
    fontSize: isMobile ? 11 : 10,
    marginTop: isMobile ? 10 : 8,
    marginBottom: 2,
    borderTop: '1px solid #333',
    paddingTop: 8,
  }}>
    {title}
  </div>
);

const StatItem = ({ label, value, color = '#FFF', isMobile, highlight }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: isMobile ? 13 : 12,
    marginBottom: 1,
    padding: highlight ? '4px 6px' : 0,
    backgroundColor: highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
    borderRadius: 4,
  }}>
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color, fontWeight: highlight ? 'bold' : 'normal' }}>{value}</span>
  </div>
);

export default StatsPanel;
