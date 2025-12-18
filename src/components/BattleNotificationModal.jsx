import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold, getLevelColor } from '../utils/constants';

const BattleNotificationModal = ({
  isOpen,
  notifications = [],
  onClose,
  onMarkRead
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || notifications.length === 0) return null;

  const current = notifications[currentIndex];
  const total = notifications.length;

  // 나 기준: 상대가 이겼으면 나는 진 것
  const iDefended = !current.attackerWon;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleClose = () => {
    if (onMarkRead) {
      onMarkRead(notifications.map(n => n.id));
    }
    onClose();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          style={styles.modal}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>⚔️ 배틀 알림</h2>
            <div style={styles.counter}>{currentIndex + 1} / {total}</div>
          </div>

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={styles.content}
          >
            <div style={styles.timestamp}>{formatTime(current.timestamp)}</div>

            <div style={styles.attackerInfo}>
              <img
                src={current.attackerImage || '/default-avatar.png'}
                alt=""
                style={styles.avatar}
                onError={(e) => { e.target.src = '/default-avatar.png'; }}
              />
              <div style={styles.attackerName}>{current.attackerName}</div>
              <div style={{ color: getLevelColor(current.attackerLevel), fontSize: 14 }}>
                +{current.attackerLevel}
              </div>
            </div>

            <div style={styles.battleMessage}>
              님이 당신에게 배틀을 걸었습니다!
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                ...styles.resultBanner,
                backgroundColor: iDefended ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)',
                borderColor: iDefended ? '#4CAF50' : '#F44336'
              }}
            >
              <div style={{ fontSize: 36 }}>{iDefended ? '🛡️' : '💔'}</div>
              <div style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: iDefended ? '#4CAF50' : '#F44336'
              }}>
                {iDefended ? '방어 성공!' : '방어 실패...'}
              </div>
              {!iDefended && current.reward > 0 && (
                <div style={{ color: '#F44336', fontSize: 14, marginTop: 4 }}>
                  {current.attackerName}님이 {formatGold(current.reward)}G 획득
                </div>
              )}
              {iDefended && (
                <div style={{ color: '#4CAF50', fontSize: 14, marginTop: 4 }}>
                  공격을 막아냈습니다!
                </div>
              )}
            </motion.div>

            <div style={styles.battleDetails}>
              <div style={styles.detailRow}>
                <span style={{ color: '#888' }}>상대 레벨</span>
                <span style={{ color: getLevelColor(current.attackerLevel) }}>+{current.attackerLevel}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={{ color: '#888' }}>상대 스탯</span>
                <span style={{ color: '#aaa' }}>⚔️{current.attackerAttack || '-'} ❤️{current.attackerHp || '-'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={{ color: '#888' }}>라운드</span>
                <span style={{ color: '#fff' }}>{current.rounds}R</span>
              </div>
            </div>
          </motion.div>

          {total > 1 && (
            <div style={styles.navigation}>
              <motion.button
                onClick={handlePrev}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={styles.navBtn}
              >
                ◀
              </motion.button>
              <div style={styles.dots}>
                {notifications.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.dot,
                      backgroundColor: idx === currentIndex ? '#FFD700' : '#444'
                    }}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={styles.navBtn}
              >
                ▶
              </motion.button>
            </div>
          )}

          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.closeBtn}
          >
            확인 ({total}개 모두 읽음 처리)
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'rgba(20,20,40,0.98)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    border: '2px solid #FF6B6B',
    boxShadow: '0 0 60px rgba(255,107,107,0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    margin: 0,
    color: '#FF6B6B',
    fontSize: 20,
  },
  counter: {
    color: '#888',
    fontSize: 14,
  },
  content: {
    textAlign: 'center',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  attackerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #FF6B6B',
    backgroundColor: '#333',
  },
  attackerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  battleMessage: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },
  resultBanner: {
    padding: 20,
    borderRadius: 16,
    border: '2px solid',
    marginBottom: 16,
  },
  battleDetails: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    marginBottom: 6,
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1px solid #444',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  dots: {
    display: 'flex',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  closeBtn: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FF6B6B',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default BattleNotificationModal;
