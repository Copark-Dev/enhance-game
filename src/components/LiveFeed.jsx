import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getLevelColor } from '../utils/constants';

const LiveFeed = ({ isOpen, onToggle }) => {
  const [logs, setLogs] = useState([]);
  const [newLogIds, setNewLogIds] = useState(new Set());
  const feedRef = useRef(null);

  useEffect(() => {
    // 실시간 리스너 설정
    const logsRef = collection(db, 'enhanceLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = [];
      const newIds = new Set();

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          newIds.add(change.doc.id);
        }
      });

      snapshot.forEach((doc) => {
        newLogs.push({ id: doc.id, ...doc.data() });
      });

      setLogs(newLogs);
      setNewLogIds(newIds);

      // 새 로그 하이라이트 3초 후 제거
      if (newIds.size > 0) {
        setTimeout(() => setNewLogIds(new Set()), 3000);
      }
    }, (error) => {
      console.error('실시간 피드 오류:', error);
    });

    return () => unsubscribe();
  }, []);

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now - logTime;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 10) return '방금';
    if (diffSec < 60) return `${diffSec}초 전`;
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return '오래전';
  };

  const getResultEmoji = (result, level) => {
    if (result === 'destroyed') return '💀';
    if (result === 'success') {
      if (level >= 20) return '🌈';
      if (level >= 15) return '🔥';
      if (level >= 10) return '🎉';
      return '✨';
    }
    return '💔';
  };

  const getResultText = (result, level, previousLevel) => {
    if (result === 'destroyed') return '파괴됨';
    if (result === 'success') return `+${level} 성공!`;
    if (level < previousLevel) return `+${level} 하락`;
    return '실패';
  };

  return (
    <>
      {/* 토글 버튼 */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          ...styles.toggleBtn,
          backgroundColor: isOpen ? '#FFD700' : 'rgba(255,215,0,0.2)',
          color: isOpen ? '#000' : '#FFD700',
        }}
      >
        📡 {isOpen ? '피드 닫기' : '실시간'}
        {!isOpen && logs.length > 0 && (
          <span style={styles.badge}>{logs.length}</span>
        )}
      </motion.button>

      {/* 피드 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            style={styles.panel}
          >
            <div style={styles.header}>
              <span style={styles.title}>🔥 실시간 강화</span>
              <span style={styles.liveIndicator}>
                <span style={styles.liveDot} />
                LIVE
              </span>
            </div>

            <div ref={feedRef} style={styles.feedList}>
              {logs.length === 0 ? (
                <div style={styles.empty}>
                  아직 강화 기록이 없어요
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      ...styles.logItem,
                      backgroundColor: newLogIds.has(log.id)
                        ? 'rgba(255,215,0,0.2)'
                        : log.result === 'destroyed'
                        ? 'rgba(244,67,54,0.1)'
                        : log.result === 'success'
                        ? 'rgba(76,175,80,0.1)'
                        : 'rgba(255,255,255,0.05)',
                      borderLeftColor: log.result === 'destroyed'
                        ? '#F44336'
                        : log.result === 'success'
                        ? getLevelColor(log.level)
                        : '#666',
                    }}
                  >
                    <div style={styles.logLeft}>
                      {log.profileImage ? (
                        <img src={log.profileImage} alt="" style={styles.avatar} />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {log.nickname?.charAt(0) || '?'}
                        </div>
                      )}
                      <div style={styles.logInfo}>
                        <span style={styles.nickname}>{log.nickname}</span>
                        <span style={{
                          ...styles.result,
                          color: log.result === 'destroyed'
                            ? '#F44336'
                            : log.result === 'success'
                            ? getLevelColor(log.level)
                            : '#888'
                        }}>
                          {getResultEmoji(log.result, log.level)} {getResultText(log.result, log.level, log.previousLevel)}
                        </span>
                      </div>
                    </div>
                    <span style={styles.time}>{getTimeAgo(log.timestamp)}</span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const styles = {
  toggleBtn: {
    position: 'fixed',
    top: 70,
    right: 10,
    padding: '8px 14px',
    borderRadius: 20,
    border: '2px solid #FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#F44336',
    color: '#fff',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 10,
    marginLeft: 4,
  },
  panel: {
    position: 'fixed',
    top: 60,
    right: 0,
    width: 280,
    maxWidth: '85vw',
    height: 'calc(100vh - 140px)',
    backgroundColor: 'rgba(15,15,30,0.98)',
    borderLeft: '1px solid #333',
    borderBottom: '1px solid #333',
    borderRadius: '0 0 0 16px',
    zIndex: 99,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 4px 20px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #333',
  },
  title: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#F44336',
    fontSize: 11,
    fontWeight: 'bold',
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#F44336',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },
  feedList: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    marginBottom: 6,
    borderRadius: 10,
    borderLeft: '3px solid',
  },
  logLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid #444',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nickname: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  result: {
    fontSize: 12,
  },
  time: {
    color: '#666',
    fontSize: 11,
    flexShrink: 0,
  },
};

// CSS 애니메이션 추가 (index.html이나 App.jsx에 추가 필요)
const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// 스타일 태그 동적 추가
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = pulseKeyframes;
  document.head.appendChild(styleEl);
}

export default LiveFeed;
