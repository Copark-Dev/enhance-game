import { motion } from 'framer-motion';

const RateDisplay = ({ successRate, downgradeRate, destroyRate, lastRoll }) => {
  const getRateColor = (rate) => rate >= 70 ? '#4CAF50' : rate >= 40 ? '#FFC107' : rate >= 20 ? '#FF9800' : '#F44336';
  const isRollSuccess = lastRoll !== null && parseFloat(lastRoll) < successRate;

  return (
    <div className="rate-display" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 260, padding: 14, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
          <span style={{ color: '#AAA' }}>성공 확률</span>
          <span style={{ color: getRateColor(successRate), fontWeight: 'bold' }}>{successRate}%</span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: successRate + '%' }} transition={{ duration: 0.5 }} style={{ height: '100%', backgroundColor: getRateColor(successRate), borderRadius: 4 }} />
        </div>
      </div>
      {lastRoll !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
          <span style={{ color: '#888' }}>🎲 주사위</span>
          <span style={{ color: isRollSuccess ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
            {lastRoll} {isRollSuccess ? '✓' : '✗'}
          </span>
        </div>
      )}
      {downgradeRate > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#FF9800' }}>
          <span>⬇️ 실패 시 하락</span><span>{downgradeRate}%</span>
        </div>
      )}
      {destroyRate > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#F44336' }}>
          <span>💥 파괴 확률</span><span>{destroyRate}%</span>
        </div>
      )}
    </div>
  );
};

export default RateDisplay;
