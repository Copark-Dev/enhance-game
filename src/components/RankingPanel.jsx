import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold, getLevelColor } from '../utils/constants';

const RankingPanel = ({ isOpen, onClose, currentUser, getRankings }) => {
  const [rankings, setRankings] = useState({
    maxLevel: [],
    totalEarned: [],
    successes: [],
    battleWins: []
  });
  const [activeTab, setActiveTab] = useState('maxLevel');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && getRankings) {
      loadRankings();
    }
  }, [isOpen]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await getRankings();
      setRankings(data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'maxLevel', label: '최고 강화', icon: '⚔️' },
    { id: 'totalEarned', label: '총 수익', icon: '💰' },
    { id: 'successes', label: '성공 횟수', icon: '✨' },
    { id: 'battleWins', label: '배틀 승리', icon: '🏆' }
  ];

  const formatValue = (tab, value) => {
    switch (tab) {
      case 'maxLevel':
        return `+${value}강`;
      case 'totalEarned':
        return `${formatGold(value)}G`;
      case 'successes':
      case 'battleWins':
        return `${value.toLocaleString()}회`;
      default:
        return value;
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { color: '#FFD700', fontWeight: 'bold' };
    if (rank === 2) return { color: '#C0C0C0', fontWeight: 'bold' };
    if (rank === 3) return { color: '#CD7F32', fontWeight: 'bold' };
    return { color: '#888' };
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const currentRankings = rankings[activeTab] || [];

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
            <h2 style={styles.title}>🏅 랭킹</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  backgroundColor: activeTab === tab.id ? 'rgba(255,215,0,0.3)' : 'transparent',
                  borderColor: activeTab === tab.id ? '#FFD700' : '#333'
                }}
              >
                <span>{tab.icon}</span>
                <span style={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={styles.loading}>로딩 중...</div>
          ) : (
            <div style={styles.rankingList}>
              {currentRankings.length === 0 ? (
                <div style={styles.empty}>아직 랭킹 데이터가 없습니다</div>
              ) : (
                currentRankings.map((user, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && user.id === currentUser.id;

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        ...styles.rankItem,
                        backgroundColor: isCurrentUser ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                        borderColor: isCurrentUser ? '#FFD700' : '#333'
                      }}
                    >
                      <div style={{ ...styles.rank, ...getRankStyle(rank) }}>
                        {getRankEmoji(rank)}
                      </div>
                      <div style={styles.userInfo}>
                        <img
                          src={user.avatar || '/default-avatar.png'}
                          alt=""
                          style={styles.avatar}
                          onError={(e) => { e.target.src = '/default-avatar.png'; }}
                        />
                        <span style={{
                          ...styles.nickname,
                          color: isCurrentUser ? '#FFD700' : '#fff'
                        }}>
                          {user.nickname || '익명'}
                          {isCurrentUser && ' (나)'}
                        </span>
                      </div>
                      <div style={{
                        ...styles.value,
                        color: activeTab === 'maxLevel' ? getLevelColor(user.value) : '#FFD700'
                      }}>
                        {formatValue(activeTab, user.value)}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          <motion.button
            onClick={loadRankings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.refreshBtn}
            disabled={loading}
          >
            🔄 새로고침
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
    maxWidth: 420,
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
  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 4px',
    border: '1px solid',
    borderRadius: 8,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: 40,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 40,
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  rankItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: '1px solid',
  },
  rank: {
    width: 30,
    textAlign: 'center',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#333',
  },
  nickname: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
  },
};

export default RankingPanel;
