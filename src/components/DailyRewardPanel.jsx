import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold } from '../utils/constants';

const DailyRewardPanel = ({ isOpen, onClose, user, onClaimReward }) => {
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    if (!user) return;

    // 한국시간(KST, UTC+9) 기준으로 날짜 계산
    const getKSTDate = (date) => {
      const kstOffset = 9 * 60; // KST는 UTC+9
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      return new Date(utc + (kstOffset * 60000));
    };

    const getKSTDateOnly = (date) => {
      const kst = getKSTDate(date);
      return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
    };

    const checkReward = () => {
      const lastClaim = user.lastDailyReward ? new Date(user.lastDailyReward) : null;
      const now = new Date();

      if (!lastClaim) {
        setCanClaim(true);
        setStreak(0);
        return;
      }

      // KST 기준으로 날짜 비교
      const lastClaimKST = getKSTDateOnly(lastClaim);
      const todayKST = getKSTDateOnly(now);
      const diffDays = Math.floor((todayKST - lastClaimKST) / (1000 * 60 * 60 * 24));

      if (diffDays >= 1) {
        setCanClaim(true);
        // 연속 출석 체크 (하루 이상 놓치면 리셋)
        if (diffDays === 1) {
          setStreak(user.dailyStreak || 0);
        } else {
          setStreak(0);
        }
      } else {
        setCanClaim(false);
        setStreak(user.dailyStreak || 0);

        // 다음 보상까지 남은 시간 (KST 자정 기준)
        const nowKST = getKSTDate(now);
        // 오늘 KST 자정부터 지금까지 흐른 시간(분)
        const elapsedMinutes = nowKST.getHours() * 60 + nowKST.getMinutes();
        // 다음 KST 자정까지 남은 시간(분)
        const remainingMinutes = 24 * 60 - elapsedMinutes;
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        setTimeUntilReset(`${hours}시간 ${minutes}분`);
      }
    };

    checkReward();
    const interval = setInterval(checkReward, 60000); // 1분마다 체크
    return () => clearInterval(interval);
  }, [user, isOpen]);

  // 연속 출석 보상 계산
  const getRewardAmount = (currentStreak) => {
    if (currentStreak >= 7) return 100000; // 7일 연속 특별 보상
    const baseReward = 10000;
    const streakBonus = Math.min(currentStreak - 1, 6) * 3000; // 일당 +3000
    return baseReward + streakBonus;
  };

  const handleClaim = () => {
    if (!canClaim) return;
    const newStreak = streak + 1;
    const reward = getRewardAmount(newStreak);
    onClaimReward(reward, newStreak);
    setCanClaim(false);
    setStreak(newStreak);
  };

  if (!isOpen) return null;

  const rewards = [
    { day: 1, gold: 10000 },
    { day: 2, gold: 13000 },
    { day: 3, gold: 16000 },
    { day: 4, gold: 19000 },
    { day: 5, gold: 22000 },
    { day: 6, gold: 25000 },
    { day: 7, gold: 100000, special: true },
  ];

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
            <h2 style={styles.title}>🎁 일일 보상</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          <div style={styles.streakInfo}>
            <span style={styles.streakLabel}>연속 출석</span>
            <span style={styles.streakValue}>{streak}일</span>
          </div>

          <div style={styles.rewardGrid}>
            {rewards.map((r) => {
              // 7일 사이클로 표시
              const cycleProgress = streak % 7; // 0~6 (0은 7일차 완료 상태)

              let isClaimed, isCurrent;
              if (canClaim) {
                // 오늘 아직 안 받음 - 다음에 받을 날짜 계산
                const nextDay = cycleProgress + 1; // 1~7
                isCurrent = r.day === nextDay;
                isClaimed = r.day < nextDay;
              } else {
                // 오늘 이미 받음
                const claimedUpTo = cycleProgress === 0 ? 7 : cycleProgress;
                isClaimed = r.day <= claimedUpTo;
                isCurrent = false;
              }
              const isLocked = !isClaimed && !isCurrent;

              return (
                <div
                  key={r.day}
                  style={{
                    ...styles.rewardItem,
                    backgroundColor: isClaimed ? 'rgba(76,175,80,0.3)' : isCurrent ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.05)',
                    borderColor: isCurrent ? '#FFD700' : isClaimed ? '#4CAF50' : '#333',
                    opacity: isLocked && !isCurrent ? 0.5 : 1,
                  }}
                >
                  <div style={styles.dayLabel}>Day {r.day}</div>
                  <div style={{ fontSize: r.special ? 24 : 20 }}>{r.special ? '🎉' : '🪙'}</div>
                  <div style={{ ...styles.goldAmount, color: r.special ? '#FFD700' : '#fff' }}>
                    {formatGold(r.gold)}G
                  </div>
                  {isClaimed && <div style={styles.checkMark}>✓</div>}
                </div>
              );
            })}
          </div>

          {canClaim ? (
            <motion.button
              onClick={handleClaim}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={styles.claimBtn}
            >
              🎁 보상 받기 ({formatGold(getRewardAmount(streak + 1))}G)
            </motion.button>
          ) : (
            <div style={styles.nextReward}>
              다음 보상까지: {timeUntilReset}
            </div>
          )}
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
    maxWidth: 380,
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
  streakInfo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: '10px 20px',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 10,
  },
  streakLabel: { color: '#aaa', fontSize: 14 },
  streakValue: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  rewardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  rewardItem: {
    padding: 10,
    borderRadius: 10,
    border: '2px solid',
    textAlign: 'center',
    position: 'relative',
  },
  dayLabel: { fontSize: 10, color: '#888', marginBottom: 4 },
  goldAmount: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  checkMark: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#fff',
  },
  claimBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  nextReward: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    padding: 14,
  },
};

export default DailyRewardPanel;
