import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold } from '../utils/constants';

// 업적 정의
export const ACHIEVEMENTS = [
  { id: 'first_enhance', name: '첫 강화', desc: '첫 강화 시도', icon: '⚔️', condition: (s) => s.attempts >= 1, reward: 500 },
  { id: 'enhance_10', name: '강화 입문', desc: '강화 10회 시도', icon: '🔨', condition: (s) => s.attempts >= 10, reward: 1000 },
  { id: 'enhance_100', name: '강화 숙련', desc: '강화 100회 시도', icon: '⚒️', condition: (s) => s.attempts >= 100, reward: 5000 },
  { id: 'enhance_1000', name: '강화 장인', desc: '강화 1000회 시도', icon: '🛠️', condition: (s) => s.attempts >= 1000, reward: 50000 },
  { id: 'success_10', name: '행운아', desc: '성공 10회', icon: '🍀', condition: (s) => s.successes >= 10, reward: 2000 },
  { id: 'success_100', name: '황금손', desc: '성공 100회', icon: '✋', condition: (s) => s.successes >= 100, reward: 20000 },
  { id: 'level_5', name: '+5 달성', desc: '5강 달성', icon: '⭐', condition: (s) => s.maxLevel >= 5, reward: 3000 },
  { id: 'level_10', name: '+10 달성', desc: '10강 달성', icon: '🌟', condition: (s) => s.maxLevel >= 10, reward: 10000 },
  { id: 'level_15', name: '+15 달성', desc: '15강 달성 (신화)', icon: '💫', condition: (s) => s.maxLevel >= 15, reward: 100000 },
  { id: 'level_20', name: '+20 달성', desc: '20강 달성 (초월)', icon: '👑', condition: (s) => s.maxLevel >= 20, reward: 1000000 },
  { id: 'earn_100k', name: '부자의 길', desc: '총 수익 10만G', icon: '💰', condition: (s) => s.totalEarned >= 100000, reward: 5000 },
  { id: 'earn_1m', name: '백만장자', desc: '총 수익 100만G', icon: '💎', condition: (s) => s.totalEarned >= 1000000, reward: 50000 },
  { id: 'earn_10m', name: '재벌', desc: '총 수익 1000만G', icon: '🏆', condition: (s) => s.totalEarned >= 10000000, reward: 500000 },
  { id: 'fail_50', name: '불굴의 의지', desc: '실패 50회', icon: '💪', condition: (s) => s.failures >= 50, reward: 3000 },
  { id: 'profit_positive', name: '흑자 전환', desc: '순이익 달성', icon: '📈', condition: (s) => s.totalEarned > s.totalSpent, reward: 2000 },
];

const AchievementPanel = ({ isOpen, onClose, stats, claimedAchievements = [], onClaimAchievement }) => {
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    if (!stats) return;

    // 새로 달성한 업적 체크
    const unlocked = ACHIEVEMENTS.filter(a =>
      a.condition(stats) && !claimedAchievements.includes(a.id)
    );
    setNewlyUnlocked(unlocked.map(a => a.id));
  }, [stats, claimedAchievements]);

  const handleClaim = (achievement) => {
    if (!newlyUnlocked.includes(achievement.id)) return;
    onClaimAchievement(achievement.id, achievement.reward);
    setNewlyUnlocked(prev => prev.filter(id => id !== achievement.id));
  };

  if (!isOpen) return null;

  const totalReward = ACHIEVEMENTS
    .filter(a => claimedAchievements.includes(a.id))
    .reduce((sum, a) => sum + a.reward, 0);

  const unclaimedReward = ACHIEVEMENTS
    .filter(a => newlyUnlocked.includes(a.id))
    .reduce((sum, a) => sum + a.reward, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={styles.overlay}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={styles.modal}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>🏆 업적</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>달성</span>
              <span style={styles.summaryValue}>{claimedAchievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>획득 보상</span>
              <span style={{ ...styles.summaryValue, color: '#FFD700' }}>{formatGold(totalReward)}G</span>
            </div>
            {unclaimedReward > 0 && (
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>미수령</span>
                <span style={{ ...styles.summaryValue, color: '#4CAF50' }}>+{formatGold(unclaimedReward)}G</span>
              </div>
            )}
          </div>

          <div style={styles.achievementList}>
            {ACHIEVEMENTS.map((a) => {
              const isUnlocked = a.condition(stats);
              const isClaimed = claimedAchievements.includes(a.id);
              const canClaim = isUnlocked && !isClaimed;

              return (
                <div
                  key={a.id}
                  style={{
                    ...styles.achievementItem,
                    backgroundColor: isClaimed ? 'rgba(76,175,80,0.2)' : canClaim ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                    borderColor: canClaim ? '#FFD700' : isClaimed ? '#4CAF50' : '#333',
                    opacity: isUnlocked ? 1 : 0.5,
                  }}
                >
                  <div style={styles.achievementIcon}>{a.icon}</div>
                  <div style={styles.achievementInfo}>
                    <div style={styles.achievementName}>{a.name}</div>
                    <div style={styles.achievementDesc}>{a.desc}</div>
                  </div>
                  <div style={styles.achievementReward}>
                    {isClaimed ? (
                      <span style={{ color: '#4CAF50' }}>✓</span>
                    ) : canClaim ? (
                      <motion.button
                        onClick={() => handleClaim(a)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={styles.claimBtn}
                      >
                        {formatGold(a.reward)}G
                      </motion.button>
                    ) : (
                      <span style={{ color: '#666', fontSize: 11 }}>{formatGold(a.reward)}G</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 15,
  },
  modal: {
    backgroundColor: 'rgba(20,20,40,0.98)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85vh',
    overflowY: 'auto',
    border: '2px solid #FFD700',
    boxShadow: '0 0 40px rgba(255,215,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { margin: 0, color: '#FFD700', fontSize: 20 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 24,
    cursor: 'pointer',
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: { color: '#888', fontSize: 11 },
  summaryValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  achievementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: '1px solid',
  },
  achievementIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  achievementDesc: {
    color: '#888',
    fontSize: 11,
  },
  achievementReward: {
    minWidth: 60,
    textAlign: 'right',
  },
  claimBtn: {
    padding: '6px 10px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default AchievementPanel;
