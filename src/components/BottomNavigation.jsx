import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNavigation = ({
  onShowFriend,
  onShowRanking,
  onShowBattle,
  onShowDailyReward,
  onShowAchievement,
  onShowGuide,
  onShowStats,
  onToggleSound,
  onShare,
  onLogout,
  isMuted,
  hasNotification = false
}) => {
  const [activeMenu, setActiveMenu] = useState(null); // 'social' | 'reward' | 'more'

  const closeMenu = () => setActiveMenu(null);

  const handleMenuClick = (menu) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  const handleAction = (action) => {
    closeMenu();
    action();
  };

  return (
    <>
      {/* 오버레이 - 메뉴 열렸을 때 배경 클릭으로 닫기 */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            style={styles.overlay}
          />
        )}
      </AnimatePresence>

      {/* 하단 네비게이션 바 */}
      <div style={styles.container}>
        {/* 홈 */}
        <div style={styles.navItem}>
          <div style={{ ...styles.navIcon, color: '#FFD700' }}>🏠</div>
          <span style={{ ...styles.navLabel, color: '#FFD700' }}>홈</span>
        </div>

        {/* 소셜 */}
        <div style={styles.navItem} onClick={() => handleMenuClick('social')}>
          <div style={styles.navIcon}>👥</div>
          <span style={styles.navLabel}>소셜</span>
          <AnimatePresence>
            {activeMenu === 'social' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                style={styles.submenu}
              >
                <div style={styles.submenuItem} onClick={() => handleAction(onShowFriend)}>
                  <span>👥</span>
                  <span>친구</span>
                </div>
                <div style={styles.submenuItem} onClick={() => handleAction(onShowRanking)}>
                  <span>🏅</span>
                  <span>랭킹</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 배틀 */}
        <div style={styles.navItem} onClick={() => handleAction(onShowBattle)}>
          <div style={styles.battleIcon}>
            ⚔️
            {hasNotification && <div style={styles.notificationDot} />}
          </div>
          <span style={styles.navLabel}>배틀</span>
        </div>

        {/* 보상 */}
        <div style={styles.navItem} onClick={() => handleMenuClick('reward')}>
          <div style={styles.navIcon}>🎁</div>
          <span style={styles.navLabel}>보상</span>
          <AnimatePresence>
            {activeMenu === 'reward' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                style={styles.submenu}
              >
                <div style={styles.submenuItem} onClick={() => handleAction(onShowDailyReward)}>
                  <span>🎁</span>
                  <span>일일보상</span>
                </div>
                <div style={styles.submenuItem} onClick={() => handleAction(onShowAchievement)}>
                  <span>🏆</span>
                  <span>업적</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 더보기 */}
        <div style={styles.navItem} onClick={() => handleMenuClick('more')}>
          <div style={styles.navIcon}>☰</div>
          <span style={styles.navLabel}>더보기</span>
          <AnimatePresence>
            {activeMenu === 'more' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                style={{ ...styles.submenu, right: 0, left: 'auto' }}
              >
                <div style={styles.submenuItem} onClick={() => handleAction(onShowStats)}>
                  <span>📊</span>
                  <span>통계</span>
                </div>
                <div style={styles.submenuItem} onClick={() => handleAction(onShowGuide)}>
                  <span>❓</span>
                  <span>가이드</span>
                </div>
                <div style={styles.submenuItem} onClick={() => handleAction(onToggleSound)}>
                  <span>{isMuted ? '🔇' : '🔊'}</span>
                  <span>사운드</span>
                </div>
                <div style={styles.submenuItem} onClick={() => handleAction(onShare)}>
                  <span>📤</span>
                  <span>공유</span>
                </div>
                <div style={styles.divider} />
                <div style={{ ...styles.submenuItem, color: '#F44336' }} onClick={() => handleAction(onLogout)}>
                  <span>🚪</span>
                  <span>로그아웃</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 90,
  },
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15,15,30,0.98)',
    borderTop: '1px solid #333',
    padding: '8px 0',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 12px',
    cursor: 'pointer',
    position: 'relative',
    minWidth: 50,
  },
  navIcon: {
    fontSize: 22,
  },
  battleIcon: {
    fontSize: 22,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    backgroundColor: '#F44336',
    borderRadius: '50%',
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
  },
  submenu: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(30,30,50,0.98)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    minWidth: 120,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
    border: '1px solid #444',
  },
  submenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    margin: '4px 0',
  },
};

export default BottomNavigation;
