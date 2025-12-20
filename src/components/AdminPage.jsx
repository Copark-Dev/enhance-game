import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getLevelColor, getLevelTier, formatGold, getItemImage, SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST } from '../utils/constants';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'psw4887@naver.com';
const ADMIN_NICKNAME = '박세완';

const isAdmin = (user) => user?.email === ADMIN_EMAIL || user?.nickname === ADMIN_NICKNAME;

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editGold, setEditGold] = useState('');

  // 강화 설정 상태
  const [settings, setSettings] = useState({
    successRates: { ...SUCCESS_RATES },
    downgradeRates: { ...DOWNGRADE_RATES },
    destroyRates: { ...DESTROY_RATES },
    enhanceCosts: { ...ENHANCE_COST },
  });
  const [editingLevel, setEditingLevel] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // 어드민 체크
  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/');
    }
  }, [user, navigate]);

  // Firebase에서 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'enhance');
        const snapshot = await getDoc(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({
            successRates: data.successRates || { ...SUCCESS_RATES },
            downgradeRates: data.downgradeRates || { ...DOWNGRADE_RATES },
            destroyRates: data.destroyRates || { ...DESTROY_RATES },
            enhanceCosts: data.enhanceCosts || { ...ENHANCE_COST },
          });
        }
      } catch (err) {
        console.error('설정 불러오기 실패:', err);
      }
    };
    fetchSettings();
  }, []);

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

  // 설정 저장
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const settingsRef = doc(db, 'settings', 'enhance');
      await setDoc(settingsRef, settings);
      alert('설정이 저장되었습니다!');
    } catch (err) {
      console.error('설정 저장 실패:', err);
      alert('저장 실패: ' + err.message);
    }
    setSavingSettings(false);
  };

  // 설정값 업데이트
  const updateSetting = (type, level, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [level]: numValue }
    }));
  };

  // 기본값으로 리셋
  const resetToDefault = () => {
    if (confirm('기본값으로 초기화하시겠습니까?')) {
      setSettings({
        successRates: { ...SUCCESS_RATES },
        downgradeRates: { ...DOWNGRADE_RATES },
        destroyRates: { ...DESTROY_RATES },
        enhanceCosts: { ...ENHANCE_COST },
      });
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
          onClick={() => setActiveTab('settings')}
          style={{ ...styles.tab, backgroundColor: activeTab === 'settings' ? '#FFD700' : '#333', color: activeTab === 'settings' ? '#000' : '#fff' }}
        >
          🎯 강화 설정
        </button>
        <button
          onClick={() => setActiveTab('images')}
          style={{ ...styles.tab, backgroundColor: activeTab === 'images' ? '#FFD700' : '#333', color: activeTab === 'images' ? '#000' : '#fff' }}
        >
          📷 이미지 확인
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ ...styles.tab, backgroundColor: activeTab === 'users' ? '#FFD700' : '#333', color: activeTab === 'users' ? '#000' : '#fff' }}
        >
          👥 유저 관리
        </button>
      </div>

      {/* 강화 설정 탭 */}
      {activeTab === 'settings' && (
        <>
          <div style={styles.statsBar}>
            <span>🎯 강화 확률 및 비용 설정</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                onClick={resetToDefault}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={styles.resetBtn}
              >
                🔄 기본값
              </motion.button>
              <motion.button
                onClick={saveSettings}
                disabled={savingSettings}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={styles.saveAllBtn}
              >
                {savingSettings ? '저장 중...' : '💾 저장'}
              </motion.button>
            </div>
          </div>

          <div style={styles.settingsTable}>
            <div style={styles.tableHeader}>
              <div style={styles.colLevel}>레벨</div>
              <div style={styles.colRate}>성공률 (%)</div>
              <div style={styles.colRate}>하락률 (%)</div>
              <div style={styles.colRate}>파괴율 (%)</div>
              <div style={styles.colCost}>강화비용 (G)</div>
            </div>
            {levels.map((level) => {
              const color = getLevelColor(level);
              const isEditing = editingLevel === level;
              return (
                <div
                  key={level}
                  style={{
                    ...styles.tableRow,
                    backgroundColor: isEditing ? 'rgba(255,215,0,0.1)' : 'transparent',
                  }}
                  onClick={() => setEditingLevel(isEditing ? null : level)}
                >
                  <div style={styles.colLevel}>
                    <span style={{ ...styles.levelBadge, backgroundColor: color, color: level >= 15 ? '#fff' : '#000' }}>
                      +{level}
                    </span>
                  </div>
                  <div style={styles.colRate}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={settings.successRates[level]}
                        onChange={(e) => updateSetting('successRates', level, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={styles.input}
                        step="0.1"
                      />
                    ) : (
                      <span style={{ color: '#4CAF50' }}>{settings.successRates[level]}%</span>
                    )}
                  </div>
                  <div style={styles.colRate}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={settings.downgradeRates[level]}
                        onChange={(e) => updateSetting('downgradeRates', level, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={styles.input}
                        step="0.1"
                      />
                    ) : (
                      <span style={{ color: '#FF9800' }}>{settings.downgradeRates[level]}%</span>
                    )}
                  </div>
                  <div style={styles.colRate}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={settings.destroyRates[level]}
                        onChange={(e) => updateSetting('destroyRates', level, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={styles.input}
                        step="0.1"
                      />
                    ) : (
                      <span style={{ color: '#F44336' }}>{settings.destroyRates[level]}%</span>
                    )}
                  </div>
                  <div style={styles.colCost}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={settings.enhanceCosts[level]}
                        onChange={(e) => updateSetting('enhanceCosts', level, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...styles.input, width: 100 }}
                      />
                    ) : (
                      <span style={{ color: '#FFD700' }}>{formatGold(settings.enhanceCosts[level])}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={styles.hint}>* 행을 클릭하면 수정 모드로 전환됩니다</div>
        </>
      )}

      {/* 이미지 확인 탭 */}
      {activeTab === 'images' && (
        <>
          <div style={styles.statsBar}>
            <span>📷 레벨별 영웅 이미지 (읽기 전용)</span>
          </div>

          <div style={styles.grid}>
            {levels.map((level) => {
              const color = getLevelColor(level);
              const tier = getLevelTier(level);

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: level * 0.03 }}
                  style={{
                    ...styles.card,
                    borderColor: color,
                    boxShadow: '0 0 15px ' + color + '44',
                  }}
                >
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.levelBadge, backgroundColor: color, color: level >= 15 ? '#fff' : '#000' }}>
                      +{level}
                    </span>
                    <span style={{ ...styles.tierLabel, color }}>{tier}</span>
                  </div>

                  <div style={styles.imageArea}>
                    <img
                      src={getItemImage(level)}
                      alt={'level ' + level}
                      style={styles.previewImage}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>

                  <div style={styles.imagePath}>
                    {level}.png
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
    maxHeight: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)',
    padding: 20,
    paddingBottom: 40,
    fontFamily: 'Noto Sans KR, sans-serif',
    WebkitOverflowScrolling: 'touch', // iOS 부드러운 스크롤
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
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
    gap: 10,
  },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveAllBtn: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
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
  settingsTable: {
    backgroundColor: 'rgba(20,20,40,0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #333',
  },
  tableHeader: {
    display: 'flex',
    padding: '12px 16px',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderBottom: '1px solid #444',
    fontWeight: 'bold',
    color: '#FFD700',
    fontSize: 13,
  },
  tableRow: {
    display: 'flex',
    padding: '10px 16px',
    borderBottom: '1px solid #333',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  colLevel: { width: 80, flexShrink: 0 },
  colRate: { flex: 1, textAlign: 'center', fontSize: 14 },
  colCost: { width: 120, textAlign: 'right', fontSize: 14 },
  levelBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 'bold',
    display: 'inline-block',
  },
  input: {
    width: 60,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #FFD700',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
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
    gap: 8,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  imageArea: {
    width: 90,
    height: 90,
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
  imagePath: {
    color: '#666',
    fontSize: 11,
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
