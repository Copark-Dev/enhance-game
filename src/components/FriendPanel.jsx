import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatGold, getLevelColor, getLevelTier } from '../utils/constants';

const FriendPanel = ({ isOpen, onClose }) => {
  const { user, searchUserByNickname, addFriend, removeFriend, getFriendsList, sendGold } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftingTo, setGiftingTo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setLoading(true);
    const list = await getFriendsList();
    setFriends(list);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await searchUserByNickname(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  const handleAddFriend = async (friendId) => {
    const success = await addFriend(friendId);
    if (success) {
      setMessage('친구 추가 완료!');
      setSearchResults([]);
      setSearchQuery('');
      loadFriends();
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveFriend = async (friendId) => {
    if (confirm('정말 친구를 삭제하시겠습니까?')) {
      await removeFriend(friendId);
      loadFriends();
    }
  };

  const handleSendGold = async (friendId) => {
    const amount = parseInt(giftAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('올바른 금액을 입력하세요');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    const result = await sendGold(friendId, amount);
    setMessage(result.message);
    setGiftingTo(null);
    setGiftAmount('');
    if (result.success) {
      loadFriends();
    }
    setTimeout(() => setMessage(''), 2000);
  };

  if (!isOpen) return null;

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
            <h2 style={styles.title}>👥 친구</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          {/* 검색 영역 */}
          <div style={styles.searchArea}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="닉네임으로 검색..."
              style={styles.searchInput}
            />
            <button onClick={handleSearch} style={styles.searchBtn}>🔍</button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map((result) => (
                <div key={result.id} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    {result.profileImage && <img src={result.profileImage} alt="" style={styles.avatar} />}
                    <div>
                      <div style={styles.nickname}>{result.nickname}</div>
                      <div style={{ color: getLevelColor(result.level || 0), fontSize: 12 }}>
                        +{result.level || 0} {getLevelTier(result.level || 0)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleAddFriend(result.id)} style={styles.addBtn}>+ 추가</button>
                </div>
              ))}
            </div>
          )}

          {/* 친구 목록 */}
          <div style={styles.friendList}>
            <h3 style={styles.sectionTitle}>내 친구 ({friends.length})</h3>
            {loading ? (
              <div style={styles.loading}>로딩 중...</div>
            ) : friends.length === 0 ? (
              <div style={styles.empty}>친구가 없습니다. 닉네임으로 검색해 추가하세요!</div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} style={styles.friendCard}>
                  <div style={styles.userInfo}>
                    {friend.profileImage && <img src={friend.profileImage} alt="" style={styles.avatar} />}
                    <div>
                      <div style={styles.nickname}>{friend.nickname}</div>
                      <div style={{ color: getLevelColor(friend.level || 0), fontSize: 12 }}>
                        +{friend.level || 0} {getLevelTier(friend.level || 0)}
                      </div>
                      <div style={styles.goldInfo}>🪙 {formatGold(friend.gold || 0)}</div>
                    </div>
                  </div>
                  <div style={styles.friendActions}>
                    {giftingTo === friend.id ? (
                      <div style={styles.giftInput}>
                        <input
                          type="number"
                          value={giftAmount}
                          onChange={(e) => setGiftAmount(e.target.value)}
                          placeholder="금액"
                          style={styles.amountInput}
                        />
                        <button onClick={() => handleSendGold(friend.id)} style={styles.sendBtn}>보내기</button>
                        <button onClick={() => setGiftingTo(null)} style={styles.cancelBtn}>취소</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setGiftingTo(friend.id)} style={styles.giftBtn}>🎁</button>
                        <button onClick={() => handleRemoveFriend(friend.id)} style={styles.removeBtn}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'rgba(20,20,40,0.98)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80vh',
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
  message: {
    padding: '10px',
    backgroundColor: 'rgba(255,215,0,0.2)',
    color: '#FFD700',
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 12,
  },
  searchArea: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #444',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 14,
  },
  searchBtn: {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#FFD700',
    cursor: 'pointer',
    fontSize: 16,
  },
  searchResults: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #FFD700',
  },
  nickname: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goldInfo: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  friendList: {
    maxHeight: 300,
    overflowY: 'auto',
  },
  loading: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontSize: 13,
  },
  friendCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 8,
  },
  friendActions: {
    display: 'flex',
    gap: 6,
  },
  giftBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#FFD700',
    cursor: 'pointer',
    fontSize: 14,
  },
  removeBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#F44336',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
  },
  giftInput: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  amountInput: {
    width: 60,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #444',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
  },
  sendBtn: {
    padding: '4px 8px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
  },
  cancelBtn: {
    padding: '4px 8px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#666',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
  },
};

export default FriendPanel;
