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
  const [activeMenu, setActiveMenu] = useState(null);

  const closeMenu = () => setActiveMenu(null);

  const handleMenuClick = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action) => {
    closeMenu();
    action();
  };

  const NavButton = ({ icon, label, isActive, onClick, badge }) => (
    <motion.div
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        ...styles.navItem,
        backgroundColor: isActive ? 'rgba(255,215,0,0.15)' : 'transparent',
      }}
    >
      <div style={styles.iconWrapper}>
        <span style={styles.navIcon}>{icon}</span>
        {badge && <div style={styles.badge} />}
      </div>
      <span style={{
        ...styles.navLabel,
        color: isActive ? '#FFD700' : '#888',
      }}>{label}</span>
    </motion.div>
  );

  return (
    <>
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

      <nav style={styles.container}>
        {/* 소셜 */}
        <div style={styles.navGroup}>
          <NavButton
            icon="👥"
            label="소셜"
            isActive={activeMenu === 'social'}
            onClick={() => handleMenuClick('social')}
          />
          <AnimatePresence>
            {activeMenu === 'social' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={styles.popup}
              >
                <div style={styles.popupItem} onClick={() => handleAction(onShowFriend)}>
                  <span style={styles.popupIcon}>👥</span>
                  <span>친구</span>
                </div>
                <div style={styles.popupItem} onClick={() => handleAction(onShowRanking)}>
                  <span style={styles.popupIcon}>🏅</span>
                  <span>랭킹</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 보상 */}
        <div style={styles.navGroup}>
          <NavButton
            icon="🎁"
            label="보상"
            isActive={activeMenu === 'reward'}
            onClick={() => handleMenuClick('reward')}
          />
          <AnimatePresence>
            {activeMenu === 'reward' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={styles.popup}
              >
                <div style={styles.popupItem} onClick={() => handleAction(onShowDailyReward)}>
                  <span style={styles.popupIcon}>📅</span>
                  <span>출석</span>
                </div>
                <div style={styles.popupItem} onClick={() => handleAction(onShowAchievement)}>
                  <span style={styles.popupIcon}>🏆</span>
                  <span>업적</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 배틀 (중앙 강조) */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAction(onShowBattle)}
          style={styles.battleBtn}
        >
          <span style={styles.battleIcon}>⚔️</span>
          {hasNotification && <div style={styles.battleBadge} />}
        </motion.div>

        {/* 통계 */}
        <NavButton
          icon="📊"
          label="통계"
          onClick={() => handleAction(onShowStats)}
        />

        {/* 설정 */}
        <div style={styles.navGroup}>
          <NavButton
            icon="⚙️"
            label="설정"
            isActive={activeMenu === 'more'}
            onClick={() => handleMenuClick('more')}
          />
          <AnimatePresence>
            {activeMenu === 'more' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{ ...styles.popup, right: 8, left: 'auto', transform: 'none' }}
              >
                <div style={styles.popupItem} onClick={() => handleAction(onShowGuide)}>
                  <span style={styles.popupIcon}>❓</span>
                  <span>가이드</span>
                </div>
                <div style={styles.popupItem} onClick={() => handleAction(onToggleSound)}>
                  <span style={styles.popupIcon}>{isMuted ? '🔇' : '🔊'}</span>
                  <span>소리</span>
                </div>
                <div style={styles.popupItem} onClick={() => handleAction(onShare)}>
                  <span style={styles.popupIcon}>📤</span>
                  <span>공유</span>
                </div>
                <div style={styles.popupDivider} />
                <div style={{ ...styles.popupItem, color: '#F44336' }} onClick={() => handleAction(onLogout)}>
                  <span style={styles.popupIcon}>🚪</span>
                  <span>로그아웃</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 90,
  },
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(10,10,25,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '4px 4px',
    paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
    zIndex: 100,
    backdropFilter: 'blur(20px)',
  },
  navGroup: {
    position: 'relative',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    padding: '6px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    minWidth: 44,
  },
  iconWrapper: {
    position: 'relative',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: -0.3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    backgroundColor: '#F44336',
    borderRadius: '50%',
  },
  battleBtn: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B6B, #FF4757)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: -16,
    boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
    border: '3px solid rgba(10,10,25,0.95)',
  },
  battleIcon: {
    fontSize: 20,
  },
  battleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    backgroundColor: '#FFD700',
    borderRadius: '50%',
    border: '2px solid rgba(10,10,25,0.95)',
  },
  popup: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(25,25,45,0.98)',
    borderRadius: 14,
    padding: 6,
    minWidth: 100,
    boxShadow: '0 -4px 25px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  popupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  popupIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: '4px 8px',
  },
};

export default BottomNavigation;
