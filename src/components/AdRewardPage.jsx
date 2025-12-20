import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatGold } from '../utils/constants';

const AD_DURATION = 30; // 30초
const DAILY_LIMIT = 10; // 하루 10회
const REWARD_GOLD = 50000; // 회당 50,000G

const AdRewardPage = () => {
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [isComplete, setIsComplete] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [canWatch, setCanWatch] = useState(true);
  const timerRef = useRef(null);

  // 오늘 시청 횟수 확인
  useEffect(() => {
    if (user) {
      const today = new Date().toDateString();
      const lastAdDate = user.lastAdDate;
      const adCount = user.adCount || 0;

      if (lastAdDate === today) {
        setTodayCount(adCount);
        if (adCount >= DAILY_LIMIT) {
          setCanWatch(false);
        }
      } else {
        setTodayCount(0);
      }
    }
  }, [user]);

  // 타이머 시작 (페이지가 보일 때만 카운트)
  useEffect(() => {
    if (!canWatch) return;

    let lastTime = Date.now();

    const tick = () => {
      // 페이지가 보이지 않으면 카운트하지 않음
      if (document.hidden) {
        lastTime = Date.now();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastTime;

      // 1초 이상 경과했을 때만 카운트 (탭 전환 후 돌아왔을 때 한번에 줄어드는 것 방지)
      if (elapsed >= 1000 && elapsed < 2000) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }
      lastTime = now;
    };

    timerRef.current = setInterval(tick, 1000);

    // 페이지 visibility 변경 시 lastTime 리셋
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canWatch]);

  // 보상 수령
  const claimReward = async () => {
    if (!user) return;

    const today = new Date().toDateString();
    const newCount = todayCount + 1;
    const newGold = (user.gold || 0) + REWARD_GOLD;

    await updateUserData({
      gold: newGold,
      lastAdDate: today,
      adCount: newCount
    });

    navigate('/');
  };

  // 나가기
  const handleExit = () => {
    navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* 상단 바 */}
      <div style={styles.topBar}>
        <button onClick={handleExit} style={styles.exitBtn}>
          ✕ 나가기
        </button>
        <div style={styles.countBadge}>
          오늘 {todayCount}/{DAILY_LIMIT}회
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={styles.content}>
        {!canWatch ? (
          // 오늘 한도 초과
          <div style={styles.limitBox}>
            <div style={styles.limitIcon}>⏰</div>
            <h2 style={styles.limitTitle}>오늘 보상을 모두 받았어요!</h2>
            <p style={styles.limitDesc}>내일 다시 방문해주세요</p>
            <motion.button
              onClick={handleExit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={styles.backBtn}
            >
              돌아가기
            </motion.button>
          </div>
        ) : !isComplete ? (
          // 광고 시청 중
          <>
            <div style={styles.timerBox}>
              <div style={styles.timerLabel}>보상까지</div>
              <div style={styles.timer}>{timeLeft}초</div>
              <div style={styles.progressBar}>
                <motion.div
                  style={styles.progressFill}
                  initial={{ width: '0%' }}
                  animate={{ width: `${((AD_DURATION - timeLeft) / AD_DURATION) * 100}%` }}
                />
              </div>
            </div>

            {/* 광고 영역들 - AdSense 코드가 들어갈 자리 */}
            <div style={styles.adSection}>
              <div style={styles.adSlot}>
                {/* AdSense 광고 1 */}
                <div style={styles.adPlaceholder}>
                  <span>광고 영역 1</span>
                  <span style={styles.adNote}>AdSense 승인 후 광고 표시</span>
                </div>
              </div>

              <div style={styles.adSlot}>
                {/* AdSense 광고 2 */}
                <div style={styles.adPlaceholder}>
                  <span>광고 영역 2</span>
                  <span style={styles.adNote}>AdSense 승인 후 광고 표시</span>
                </div>
              </div>

              <div style={styles.adSlotLarge}>
                {/* AdSense 광고 3 (큰 사이즈) */}
                <div style={styles.adPlaceholder}>
                  <span>광고 영역 3</span>
                  <span style={styles.adNote}>AdSense 승인 후 광고 표시</span>
                </div>
              </div>
            </div>

            <p style={styles.waitText}>
              잠시만 기다려주세요... 🎁
            </p>
          </>
        ) : (
          // 시청 완료
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={styles.completeBox}
          >
            <div style={styles.completeIcon}>🎉</div>
            <h2 style={styles.completeTitle}>시청 완료!</h2>
            <div style={styles.rewardAmount}>+{formatGold(REWARD_GOLD)} G</div>
            <motion.button
              onClick={claimReward}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={styles.claimBtn}
            >
              보상 받기
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  exitBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  countBadge: {
    padding: '6px 12px',
    background: 'rgba(255,215,0,0.2)',
    borderRadius: 20,
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  timerBox: {
    textAlign: 'center',
    marginBottom: 10,
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 4,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFD700',
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
  },
  progressBar: {
    width: 200,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #FFD700, #FFC107)',
    borderRadius: 3,
  },
  adSection: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  adSlot: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px dashed rgba(255,255,255,0.2)',
  },
  adSlotLarge: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px dashed rgba(255,255,255,0.2)',
  },
  adPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    gap: 8,
  },
  adNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
  waitText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 10,
  },
  completeBox: {
    textAlign: 'center',
    padding: '40px 30px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    border: '2px solid rgba(255,215,0,0.3)',
    marginTop: 40,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    margin: '0 0 16px 0',
  },
  rewardAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 24,
    textShadow: '0 0 20px rgba(76,175,80,0.5)',
  },
  claimBtn: {
    padding: '16px 60px',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    background: 'linear-gradient(135deg, #FFD700, #FFC107)',
    border: 'none',
    borderRadius: 50,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
  },
  limitBox: {
    textAlign: 'center',
    padding: '60px 30px',
    marginTop: 60,
  },
  limitIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  limitTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    margin: '0 0 12px 0',
  },
  limitDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    margin: '0 0 30px 0',
  },
  backBtn: {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    cursor: 'pointer',
  },
};

export default AdRewardPage;
