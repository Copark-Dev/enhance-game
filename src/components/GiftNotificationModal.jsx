import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold } from '../utils/constants';

const GiftNotificationModal = ({ notifications, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!notifications || notifications.length === 0) return null;

  const current = notifications[currentIndex];
  const hasMore = currentIndex < notifications.length - 1;

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={styles.modal}
        >
          <div style={styles.icon}>🎁</div>
          <div style={styles.title}>선물 도착!</div>

          <div style={styles.senderInfo}>
            {current.senderProfileImage ? (
              <img src={current.senderProfileImage} alt="" style={styles.avatar} />
            ) : (
              <div style={styles.defaultAvatar}>👤</div>
            )}
            <div style={styles.senderName}>{current.senderNickname}</div>
          </div>

          <div style={styles.message}>
            님이 골드를 선물했습니다!
          </div>

          <div style={styles.amount}>
            +{formatGold(current.amount)} G
          </div>

          <div style={styles.time}>
            {new Date(current.timestamp).toLocaleString('ko-KR')}
          </div>

          <button onClick={handleNext} style={styles.button}>
            {hasMore ? `다음 (${notifications.length - currentIndex - 1}개 더)` : '확인'}
          </button>
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
    zIndex: 3000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'rgba(20,20,40,0.98)',
    borderRadius: 24,
    padding: 30,
    textAlign: 'center',
    border: '3px solid #FFD700',
    boxShadow: '0 0 60px rgba(255,215,0,0.4)',
    maxWidth: 320,
    width: '100%',
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  senderInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: '2px solid #FFD700',
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    backgroundColor: '#333',
    border: '2px solid #FFD700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  senderName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 15,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
  },
  time: {
    color: '#666',
    fontSize: 11,
    marginBottom: 20,
  },
  button: {
    padding: '12px 40px',
    backgroundColor: '#FFD700',
    border: 'none',
    borderRadius: 12,
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default GiftNotificationModal;
