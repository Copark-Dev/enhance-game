import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useImages } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import { getLevelColor, getLevelTier, formatGold } from '../utils/constants';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'psw4887@naver.com';
const ADMIN_NICKNAME = '박세완';

const isAdmin = (user) => user?.email === ADMIN_EMAIL || user?.nickname === ADMIN_NICKNAME;

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { levelImages, setImageForLevel, removeImageForLevel, clearAllImages } = useImages();
  const [activeTab, setActiveTab] = useState('images');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editGold, setEditGold] = useState('');

  // 어드민 체크
  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/');
    }
  }, [user, navigate]);

  // 유저 목록 불러오기
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (err) {
      console.error('유저 목록 불러오기 실패:', err);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleImageUpload = (level, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageForLevel(level, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGold = async (userId) => {
    const newGold = parseInt(editGold);
    if (isNaN(newGold) || newGold < 0) {
      alert('올바른 골드 값을 입력하세요');
      return;
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { gold: newGold });
      setUsers(users.map(u => u.id === userId ? { ...u, gold: newGold } : u));
      setEditingUser(null);
      setEditGold('');
    } catch (err) {
      console.error('골드 업데이트 실패:', err);
      alert('업데이트 실패');
    }
  };

  const levels = Array.from({ length: 21 }, (_, i) => i);

  if (!user || !isAdmin(user)) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>
          접근 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.h1 style={styles.title} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          ⚙️ 어드민 페이지
        </motion.h1>
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={styles.backBtn}
        >
          🎮 게임으로
        </motion.button>
      </div>

      {/* 탭 메뉴 */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('images')}
          style={{ ...styles.tab, backgroundColor: activeTab === 'images' ? '#FFD700' : '#333', color: activeTab === 'images' ? '#000' : '#fff' }}
        >
          📷 이미지 관리
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ ...styles.tab, backgroundColor: activeTab === 'users' ? '#FFD700' : '#333', color: activeTab === 'users' ? '#000' : '#fff' }}
        >
          👥 유저 관리
        </button>
      </div>

      {/* 이미지 관리 탭 */}
      {activeTab === 'images' && (
        <>
          <div style={styles.statsBar}>
            <span>📷 등록된 이미지: {Object.keys(levelImages).length} / 21</span>
            <motion.button
              onClick={clearAllImages}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={styles.clearBtn}
            >
              🗑️ 전체 삭제
            </motion.button>
          </div>

          <div style={styles.grid}>
            {levels.map((level) => {
              const color = getLevelColor(level);
              const tier = getLevelTier(level);
              const hasImage = !!levelImages[level];

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: level * 0.03 }}
                  style={{
                    ...styles.card,
                    borderColor: hasImage ? color : '#333',
                    boxShadow: hasImage ? '0 0 15px ' + color + '44' : 'none',
                  }}
                >
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.levelBadge, backgroundColor: color, color: level >= 15 ? '#fff' : '#000' }}>
                      +{level}
                    </span>
                    <span style={{ ...styles.tierLabel, color }}>{tier}</span>
                  </div>

                  <div style={styles.imageArea}>
                    {hasImage ? (
                      <img src={levelImages[level]} alt={'level ' + level} style={styles.previewImage} />
                    ) : (
                      <div style={styles.placeholder}>
                        <span style={{ fontSize: 30 }}>📷</span>
                        <span style={{ fontSize: 12, color: '#666' }}>이미지 없음</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardActions}>
                    <label style={styles.uploadLabel}>
                      {hasImage ? '변경' : '업로드'}
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleImageUpload(level, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {hasImage && (
                      <button onClick={() => removeImageForLevel(level)} style={styles.removeBtn}>
                        삭제
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* 유저 관리 탭 */}
      {activeTab === 'users' && (
        <div style={styles.usersSection}>
          <div style={styles.statsBar}>
            <span>👥 총 유저: {users.length}명</span>
            <motion.button
              onClick={fetchUsers}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={styles.refreshBtn}
            >
              🔄 새로고침
            </motion.button>
          </div>

          {loadingUsers ? (
            <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>로딩 중...</div>
          ) : (
            <div style={styles.userList}>
              {users.map((u) => (
                <div key={u.id} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    {u.profileImage && <img src={u.profileImage} alt='' style={styles.userAvatar} />}
                    <div>
                      <div style={styles.userName}>{u.nickname || '이름없음'}</div>
                      <div style={styles.userEmail}>{u.email || 'ID: ' + u.id}</div>
                    </div>
                  </div>
                  <div style={styles.userStats}>
                    <div style={styles.statItem}>
                      <span style={{ color: '#888' }}>🏆 최고기록</span>
                      <span style={{ color: getLevelColor(u.stats?.maxLevel || 0) }}>+{u.stats?.maxLevel || 0}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={{ color: '#888' }}>🎯 시도</span>
                      <span style={{ color: '#fff' }}>{u.stats?.attempts || 0}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={{ color: '#888' }}>🪙 골드</span>
                      {editingUser === u.id ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <input
                            type='number'
                            value={editGold}
                            onChange={(e) => setEditGold(e.target.value)}
                            style={styles.goldInput}
                          />
                          <button onClick={() => handleUpdateGold(u.id)} style={styles.saveBtn}>저장</button>
                          <button onClick={() => { setEditingUser(null); setEditGold(''); }} style={styles.cancelBtn}>취소</button>
                        </div>
                      ) : (
                        <span
                          onClick={() => { setEditingUser(u.id); setEditGold(u.gold?.toString() || '0'); }}
                          style={{ color: '#FFD700', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {formatGold(u.gold || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)',
    padding: 20,
    fontFamily: 'Noto Sans KR, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 15,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    margin: 0,
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabs: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsBar: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: '12px 20px',
    borderRadius: 10,
    color: '#aaa',
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    padding: '8px 16px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 15,
  },
  card: {
    backgroundColor: 'rgba(20,20,40,0.9)',
    borderRadius: 12,
    padding: 12,
    border: '2px solid #333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  levelBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageArea: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    width: '100%',
  },
  uploadLabel: {
    flex: 1,
    padding: '8px 0',
    backgroundColor: '#2196F3',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  removeBtn: {
    padding: '8px 12px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usersSection: {},
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  userCard: {
    backgroundColor: 'rgba(20,20,40,0.9)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '2px solid #FFD700',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#888',
    fontSize: 12,
  },
  userStats: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
  },
  goldInput: {
    width: 80,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #FFD700',
    backgroundColor: '#1a1a2e',
    color: '#FFD700',
    fontSize: 13,
  },
  saveBtn: {
    padding: '4px 10px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
  cancelBtn: {
    padding: '4px 10px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
};

export default AdminPage;
