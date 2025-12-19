import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold } from '../utils/constants';

// 업적 정의 (50개)
export const ACHIEVEMENTS = [
  // 강화 시도 (8개)
  { id: 'first_enhance', name: '첫 강화', desc: '첫 강화 시도', icon: '⚔️', condition: (s) => s.attempts >= 1, reward: 500, category: '시도' },
  { id: 'enhance_10', name: '강화 입문', desc: '강화 10회 시도', icon: '🔨', condition: (s) => s.attempts >= 10, reward: 1000, category: '시도' },
  { id: 'enhance_50', name: '강화 견습생', desc: '강화 50회 시도', icon: '🔧', condition: (s) => s.attempts >= 50, reward: 2500, category: '시도' },
  { id: 'enhance_100', name: '강화 숙련', desc: '강화 100회 시도', icon: '⚒️', condition: (s) => s.attempts >= 100, reward: 5000, category: '시도' },
  { id: 'enhance_300', name: '강화 전문가', desc: '강화 300회 시도', icon: '🔩', condition: (s) => s.attempts >= 300, reward: 15000, category: '시도' },
  { id: 'enhance_500', name: '강화 달인', desc: '강화 500회 시도', icon: '⛏️', condition: (s) => s.attempts >= 500, reward: 25000, category: '시도' },
  { id: 'enhance_1000', name: '강화 장인', desc: '강화 1000회 시도', icon: '🛠️', condition: (s) => s.attempts >= 1000, reward: 50000, category: '시도' },
  { id: 'enhance_5000', name: '강화의 신', desc: '강화 5000회 시도', icon: '🌟', condition: (s) => s.attempts >= 5000, reward: 200000, category: '시도' },

  // 성공 횟수 (7개)
  { id: 'success_5', name: '초보 행운', desc: '성공 5회', icon: '🌱', condition: (s) => s.successes >= 5, reward: 1000, category: '성공' },
  { id: 'success_10', name: '행운아', desc: '성공 10회', icon: '🍀', condition: (s) => s.successes >= 10, reward: 2000, category: '성공' },
  { id: 'success_30', name: '좋은 기운', desc: '성공 30회', icon: '🌈', condition: (s) => s.successes >= 30, reward: 5000, category: '성공' },
  { id: 'success_50', name: '행운의 손', desc: '성공 50회', icon: '✨', condition: (s) => s.successes >= 50, reward: 10000, category: '성공' },
  { id: 'success_100', name: '황금손', desc: '성공 100회', icon: '✋', condition: (s) => s.successes >= 100, reward: 20000, category: '성공' },
  { id: 'success_300', name: '마이더스의 손', desc: '성공 300회', icon: '👐', condition: (s) => s.successes >= 300, reward: 60000, category: '성공' },
  { id: 'success_500', name: '강화 천재', desc: '성공 500회', icon: '🤲', condition: (s) => s.successes >= 500, reward: 100000, category: '성공' },

  // 레벨 달성 (10개)
  { id: 'level_1', name: '+1 달성', desc: '1강 달성', icon: '1️⃣', condition: (s) => s.maxLevel >= 1, reward: 500, category: '레벨' },
  { id: 'level_3', name: '+3 달성', desc: '3강 달성', icon: '3️⃣', condition: (s) => s.maxLevel >= 3, reward: 1000, category: '레벨' },
  { id: 'level_5', name: '+5 달성', desc: '5강 달성', icon: '⭐', condition: (s) => s.maxLevel >= 5, reward: 3000, category: '레벨' },
  { id: 'level_7', name: '+7 달성', desc: '7강 달성', icon: '💠', condition: (s) => s.maxLevel >= 7, reward: 5000, category: '레벨' },
  { id: 'level_10', name: '+10 달성', desc: '10강 달성 (영웅)', icon: '🌟', condition: (s) => s.maxLevel >= 10, reward: 10000, category: '레벨' },
  { id: 'level_12', name: '+12 달성', desc: '12강 달성', icon: '💎', condition: (s) => s.maxLevel >= 12, reward: 30000, category: '레벨' },
  { id: 'level_15', name: '+15 달성', desc: '15강 달성 (신화)', icon: '💫', condition: (s) => s.maxLevel >= 15, reward: 100000, category: '레벨' },
  { id: 'level_17', name: '+17 달성', desc: '17강 달성', icon: '🔥', condition: (s) => s.maxLevel >= 17, reward: 300000, category: '레벨' },
  { id: 'level_19', name: '+19 달성', desc: '19강 달성', icon: '⚡', condition: (s) => s.maxLevel >= 19, reward: 500000, category: '레벨' },
  { id: 'level_20', name: '+20 달성', desc: '20강 달성 (초월)', icon: '👑', condition: (s) => s.maxLevel >= 20, reward: 1000000, category: '레벨' },

  // 수익 관련 (8개)
  { id: 'earn_10k', name: '첫 수익', desc: '총 수익 1만G', icon: '💵', condition: (s) => s.totalEarned >= 10000, reward: 1000, category: '수익' },
  { id: 'earn_50k', name: '저축가', desc: '총 수익 5만G', icon: '💴', condition: (s) => s.totalEarned >= 50000, reward: 3000, category: '수익' },
  { id: 'earn_100k', name: '부자의 길', desc: '총 수익 10만G', icon: '💰', condition: (s) => s.totalEarned >= 100000, reward: 5000, category: '수익' },
  { id: 'earn_500k', name: '자산가', desc: '총 수익 50만G', icon: '💳', condition: (s) => s.totalEarned >= 500000, reward: 25000, category: '수익' },
  { id: 'earn_1m', name: '백만장자', desc: '총 수익 100만G', icon: '💎', condition: (s) => s.totalEarned >= 1000000, reward: 50000, category: '수익' },
  { id: 'earn_5m', name: '부호', desc: '총 수익 500만G', icon: '🏅', condition: (s) => s.totalEarned >= 5000000, reward: 250000, category: '수익' },
  { id: 'earn_10m', name: '재벌', desc: '총 수익 1000만G', icon: '🏆', condition: (s) => s.totalEarned >= 10000000, reward: 500000, category: '수익' },
  { id: 'earn_50m', name: '전설의 부자', desc: '총 수익 5000만G', icon: '🌐', condition: (s) => s.totalEarned >= 50000000, reward: 2000000, category: '수익' },

  // 실패/파괴 관련 (8개)
  { id: 'fail_10', name: '첫 좌절', desc: '실패 10회', icon: '😢', condition: (s) => s.failures >= 10, reward: 1000, category: '실패' },
  { id: 'fail_50', name: '불굴의 의지', desc: '실패 50회', icon: '💪', condition: (s) => s.failures >= 50, reward: 3000, category: '실패' },
  { id: 'fail_100', name: '강철 멘탈', desc: '실패 100회', icon: '🛡️', condition: (s) => s.failures >= 100, reward: 8000, category: '실패' },
  { id: 'fail_300', name: '실패는 성공의 어머니', desc: '실패 300회', icon: '🦾', condition: (s) => s.failures >= 300, reward: 25000, category: '실패' },
  { id: 'fail_500', name: '포기하지 않는 자', desc: '실패 500회', icon: '🔱', condition: (s) => s.failures >= 500, reward: 50000, category: '실패' },
  { id: 'destroy_1', name: '첫 파괴', desc: '첫 파괴 경험', icon: '💔', condition: (s) => (s.destroys || 0) >= 1, reward: 2000, category: '파괴' },
  { id: 'destroy_10', name: '파괴 경험자', desc: '파괴 10회', icon: '💀', condition: (s) => (s.destroys || 0) >= 10, reward: 10000, category: '파괴' },
  { id: 'destroy_50', name: '불사조', desc: '파괴 50회', icon: '🔥', condition: (s) => (s.destroys || 0) >= 50, reward: 50000, category: '파괴' },

  // 특수 업적 (9개)
  { id: 'profit_positive', name: '흑자 전환', desc: '순이익 달성', icon: '📈', condition: (s) => s.totalEarned > s.totalSpent, reward: 2000, category: '특수' },
  { id: 'profit_100k', name: '투자의 귀재', desc: '순이익 10만G', icon: '📊', condition: (s) => s.totalEarned - s.totalSpent >= 100000, reward: 10000, category: '특수' },
  { id: 'profit_1m', name: '투자의 신', desc: '순이익 100만G', icon: '🎯', condition: (s) => s.totalEarned - s.totalSpent >= 1000000, reward: 100000, category: '특수' },
  { id: 'success_rate_50', name: '확률의 지배자', desc: '성공률 50% 이상 (100회 이상)', icon: '🎲', condition: (s) => s.attempts >= 100 && (s.successes / s.attempts) >= 0.5, reward: 30000, category: '특수' },
  { id: 'spend_100k', name: '투자자', desc: '총 지출 10만G', icon: '🏦', condition: (s) => s.totalSpent >= 100000, reward: 5000, category: '특수' },
  { id: 'spend_1m', name: '큰손', desc: '총 지출 100만G', icon: '🎰', condition: (s) => s.totalSpent >= 1000000, reward: 50000, category: '특수' },
  { id: 'spend_10m', name: '통큰 강화사', desc: '총 지출 1000만G', icon: '🌋', condition: (s) => s.totalSpent >= 10000000, reward: 500000, category: '특수' },
  { id: 'battle_10', name: '배틀 입문', desc: '배틀 10회', icon: '⚔️', condition: (s) => (s.battles || 0) >= 10, reward: 5000, category: '배틀' },
  { id: 'battle_win_10', name: '배틀 승리자', desc: '배틀 승리 10회', icon: '🏅', condition: (s) => (s.wins || 0) >= 10, reward: 10000, category: '배틀' },
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
