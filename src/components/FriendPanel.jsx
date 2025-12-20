import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatGold, getLevelColor, getLevelTier } from '../utils/constants';
import { sanitizeString, sanitizeNumber } from '../utils/security';

const FriendPanel = ({ isOpen, onClose, onGoldChange }) => {
  const { user, searchUserByNickname, addFriend, removeFriend, getFriendsList, sendGold } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [giftAmount, setGiftAmount] = useState('');
  const [giftingTo, setGiftingTo] = useState(null);
  const [expandedFriend, setExpandedFriend] = useState(null);

  const loadFriends = async () => {
    setLoading(true);
    const list = await getFriendsList();
    setFriends(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      // 패널 열릴 때 검색 상태 초기화
      setSearchQuery('');
      setSearchResults([]);
      setMessage({ text: '', type: 'success' });
    }
  }, [isOpen]);

  const handleSearch = async () => {
    const sanitized = sanitizeString(searchQuery.trim());
    if (!sanitized) return;
    setLoading(true);
    const results = await searchUserByNickname(sanitized);
    setSearchResults(results);
    setLoading(false);
  };

  const handleAddFriend = async (friendId) => {
    const success = await addFriend(friendId);
    if (success) {
      setMessage({ text: '친구 추가 완료!', type: 'success' });
      setSearchResults([]);
      setSearchQuery('');
      loadFriends();
    } else {
      setMessage({ text: '이미 친구입니다', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: 'success' }), 2000);
  };

  const handleRemoveFriend = async (friendId) => {
    if (confirm('정말 친구를 삭제하시겠습니까?')) {
      await removeFriend(friendId);
      loadFriends();
    }
  };

  const handleSendGold = async (friendId) => {
    const amount = sanitizeNumber(giftAmount, 0, Number.MAX_SAFE_INTEGER); // JS 안전 정수 범위
    if (amount < 100) {
      setMessage({ text: '최소 100G 이상 입력하세요', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'success' }), 2000);
      return;
    }
    if (amount > user.gold) {
      setMessage({ text: '골드가 부족합니다', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'success' }), 2000);
      return;
    }
    const result = await sendGold(friendId, amount);
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setGiftingTo(null);
    setGiftAmount('');
    if (result.success) {
      loadFriends();
      // EnhanceGame의 골드 상태 동기화
      if (onGoldChange) {
        onGoldChange(user.gold - amount);
      }
    }
    setTimeout(() => setMessage({ text: '', type: 'success' }), 2000);
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

          {message.text && (
            <div style={{
              ...styles.message,
              backgroundColor: message.type === 'error' ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
              color: message.type === 'error' ? '#F44336' : '#4CAF50'
            }}>
              {message.text}
            </div>
          )}

          {/* 검색 영역 */}
          <div style={styles.searchArea}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="닉네임으로 검색..."
              style={styles.searchInput}
            />
            <button onClick={handleSearch} style={styles.searchBtn}>🔍</button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map((result) => {
                const isAlreadyFriend = user?.friends?.includes(result.id);
                return (
                  <div key={result.id} style={styles.userCard}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatarWrapper}>
                        {result.profileImage ? (
                          <img src={result.profileImage} alt="" style={styles.avatar} />
                        ) : (
                          <div style={styles.defaultAvatar}>👤</div>
                        )}
                      </div>
                      <div>
                        <div style={styles.nickname}>{result.nickname}</div>
                        <div style={{ color: getLevelColor(result.level || 0), fontSize: 12 }}>
                          +{result.level || 0} {getLevelTier(result.level || 0)}
                        </div>
                      </div>
                    </div>
                    {isAlreadyFriend ? (
                      <span style={styles.alreadyFriend}>친구</span>
                    ) : (
                      <button onClick={() => handleAddFriend(result.id)} style={styles.addBtn}>+ 추가</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 친구 목록 */}
          <div style={styles.friendList}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>내 친구 ({friends.length})</h3>
              <button onClick={loadFriends} style={styles.refreshBtn} disabled={loading}>
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
            {loading ? (
              <div style={styles.loading}>로딩 중...</div>
            ) : friends.length === 0 ? (
              <div style={styles.empty}>친구가 없습니다. 닉네임으로 검색해 추가하세요!</div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id}>
                  <div style={styles.friendCard} onClick={() => setExpandedFriend(expandedFriend === friend.id ? null : friend.id)}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatarWrapper}>
                        {friend.profileImage ? (
                          <img src={friend.profileImage} alt="" style={styles.avatar} />
                        ) : (
                          <div style={styles.defaultAvatar}>👤</div>
                        )}
                      </div>
                      <div>
                        <div style={styles.nickname}>{friend.nickname}</div>
                        <div style={{ color: getLevelColor(friend.level || 0), fontSize: 12 }}>
                          +{friend.level || 0} {getLevelTier(friend.level || 0)}
                        </div>
                        <div style={styles.goldInfo}>🪙 {formatGold(friend.gold || 0)}</div>
                      </div>
                    </div>
                    <div style={styles.friendActions} onClick={(e) => e.stopPropagation()}>
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
                  {/* 친구 상세 정보 (확장 시) */}
                  {expandedFriend === friend.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={styles.friendDetail}
                    >
                      <div style={styles.detailSection}>
                        <div style={styles.detailTitle}>📊 통계</div>
                        <div style={styles.detailStats}>
                          <span>시도: {friend.stats?.attempts || 0}</span>
                          <span>성공: {friend.stats?.successes || 0}</span>
                          <span>최고: +{friend.stats?.maxLevel || 0}</span>
                        </div>
                      </div>
                      {friend.inventory && friend.inventory.length > 0 && (
                        <div style={styles.detailSection}>
                          <div style={styles.detailTitle}>📦 보관함 ({friend.inventory.length}/5)</div>
                          <div style={styles.inventoryList}>
                            {friend.inventory.map((item, idx) => (
                              <div key={idx} style={{
                                ...styles.inventoryItem,
                                borderColor: getLevelColor(item.level || item)
                              }}>
                                <span style={{ color: getLevelColor(item.level || item) }}>
                                  +{item.level || item}
                                </span>
                                {item.attack && <span style={{fontSize: 9, color: '#aaa'}}>⚔️{item.attack} 💨{item.speed || 0}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
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
  avatarWrapper: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #FFD700',
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#333',
    border: '2px solid #FFD700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  alreadyFriend: {
    padding: '6px 12px',
    borderRadius: 6,
    backgroundColor: '#666',
    color: '#aaa',
    fontSize: 12,
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    margin: 0,
  },
  refreshBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontSize: 14,
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
  friendDetail: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '0 0 10px 10px',
    padding: 12,
    marginTop: -8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  detailSection: {
    marginBottom: 10,
  },
  detailTitle: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detailStats: {
    display: 'flex',
    gap: 12,
    fontSize: 11,
    color: '#aaa',
  },
  inventoryList: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  inventoryItem: {
    padding: '4px 8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    border: '1px solid',
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
};

export default FriendPanel;
