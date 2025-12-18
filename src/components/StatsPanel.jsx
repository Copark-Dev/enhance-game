import { motion } from 'framer-motion';
import { getLevelColor, getLevelTier, formatGold } from '../utils/constants';

const StatsPanel = ({ stats, gold }) => {
  const successRateCalc = stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0;
  const maxColor = getLevelColor(stats.maxLevel);
  const maxTier = getLevelTier(stats.maxLevel);
  const profit = stats.totalEarned - stats.totalSpent;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 15,
        backdropFilter: 'blur(10px)',
        minWidth: 200,
        border: '1px solid #333',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', color: '#FFD700', fontSize: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        📊 통계
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <StatItem label="🪙 보유 골드" value={formatGold(gold)} color="#FFD700" />
        <StatItem label="🎯 총 시도" value={stats.attempts} />
        <StatItem label="✅ 성공" value={stats.successes} color="#4CAF50" />
        <StatItem label="❌ 실패" value={stats.failures} color="#F44336" />
        <StatItem label="📈 성공률" value={successRateCalc + '%'} />
        <div style={{ borderTop: '1px solid #333', marginTop: 6, paddingTop: 10 }}>
          <StatItem label="💸 총 지출" value={formatGold(stats.totalSpent) + ' G'} color="#FF6B6B" />
          <StatItem label="💰 총 수익" value={formatGold(stats.totalEarned) + ' G'} color="#4CAF50" />
          <StatItem label="📊 손익" value={(profit >= 0 ? '+' : '') + formatGold(profit) + ' G'} color={profit >= 0 ? '#4CAF50' : '#FF6B6B'} />
        </div>
        <div style={{ borderTop: '1px solid #333', marginTop: 6, paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: '#AAA' }}>🏆 최고 기록</span>
            <span style={{ color: maxColor, fontWeight: 'bold' }}>+{stats.maxLevel}</span>
          </div>
          {stats.maxLevel >= 3 && <div style={{ textAlign: 'right', fontSize: 12, color: maxColor, marginTop: 2 }}>{maxTier}</div>}
        </div>
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, color = '#FFF' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color, fontWeight: 'bold' }}>{value}</span>
  </div>
);

export default StatsPanel;
