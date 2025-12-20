import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhance } from '../hooks/useEnhance';
import { useAuth } from '../context/AuthContext';
import { MAX_LEVEL, formatGold, SELL_PRICE, getLevelColor, getLevelTier } from '../utils/constants';
import { toggleMute, getMuteStatus } from '../utils/sounds';
import ItemDisplay from './ItemDisplay';
import RateDisplay from './RateDisplay';
import EnhanceButton from './EnhanceButton';
import ParticleEffect from './ParticleEffect';
import ResultOverlay from './ResultOverlay';
import StatsPanel from './StatsPanel';
import FriendPanel from './FriendPanel';
import GuidePanel from './GuidePanel';
import DailyRewardPanel from './DailyRewardPanel';
import AchievementPanel from './AchievementPanel';
import RankingPanel from './RankingPanel';
import BattlePanel from './BattlePanel';
import BattleNotificationModal from './BattleNotificationModal';
import BottomNavigation from './BottomNavigation';
import InstallPromptModal, { shouldShowInstallPrompt } from './InstallPromptModal';
import LiveFeed from './LiveFeed';
import GiftNotificationModal from './GiftNotificationModal';

const EnhanceGame = () => {
  const navigate = useNavigate();
  const {
    user, logout, updateUserData, getRankings, claimDailyReward, claimAchievement, updateBattleStats,
    getRandomOpponents, saveBattleNotification, getBattleNotifications, markBattleNotificationsRead,
    saveFCMToken, notifyFriendsHighEnhance, saveEnhanceLog,
    getGiftNotifications, markGiftNotificationsRead,
    offlineReward, dismissOfflineReward
  } = useAuth();
  const {
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice, isNewRecord,
    successRate, downgradeRate, destroyRate, enhanceCost, inventory,
    buffs, activeEvent, eventMultiplier, lastRoll, itemStats,
    canEnhance, enhance, sell, reset, addGold, setResult, setGold, setStats,
    setLevel, setInventory, setBuffs, setItemStats, storeItem, takeItem
  } = useEnhance(0, user?.gold || 50000);

  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showFriendPanel, setShowFriendPanel] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteStatus());
  const [battleNotifications, setBattleNotifications] = useState([]);
  const [showBattleNotifications, setShowBattleNotifications] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [activeBuffTooltip, setActiveBuffTooltip] = useState(null);
  const [giftNotifications, setGiftNotifications] = useState([]);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);
  const sellRange = SELL_PRICE[level] || { min: 0, max: 0 };

  // 유저 데이터로 초기화
  useEffect(() => {
    if (user) {
      setGold(user.gold || 50000);
      if (user.stats) setStats(user.stats);
      if (typeof user.level === 'number') setLevel(user.level);
      if (user.inventory) setInventory(user.inventory);
      if (user.buffs) setBuffs(user.buffs);
      if (user.itemStats) setItemStats(user.itemStats);
    }
  }, [user]);

  // 접속 시 배틀 알림 확인
  useEffect(() => {
    const checkBattleNotifications = async () => {
      if (user && getBattleNotifications) {
        try {
          const notifications = await getBattleNotifications();
          if (notifications.length > 0) {
            setBattleNotifications(notifications);
            setShowBattleNotifications(true);
          }
        } catch (err) {
          console.error('배틀 알림 로드 실패:', err);
        }
      }
    };
    checkBattleNotifications();
  }, [user]);

  // 접속 시 선물 알림 확인
  useEffect(() => {
    const checkGiftNotifications = async () => {
      if (user && getGiftNotifications) {
        try {
          const notifications = await getGiftNotifications();
          if (notifications.length > 0) {
            setGiftNotifications(notifications);
          }
        } catch (err) {
          console.error('선물 알림 로드 실패:', err);
        }
      }
    };
    checkGiftNotifications();
  }, [user]);

  // FCM 토큰 요청 (로그인 후)
  useEffect(() => {
    if (user && saveFCMToken) {
      // 3초 후 알림 권한 요청 (사용자 경험 개선)
      const timer = setTimeout(() => {
        saveFCMToken();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // 10강 이상 성공 시 친구들에게 알림
  useEffect(() => {
    if (result === 'success' && level >= 10 && notifyFriendsHighEnhance) {
      notifyFriendsHighEnhance(level);
    }
  }, [result, level]);

  // 강화 결과 실시간 피드에 저장
  useEffect(() => {
    if (result && saveEnhanceLog && (result === 'success' || result === 'fail' || result === 'destroyed')) {
      saveEnhanceLog(level, result, previousLevel);
    }
  }, [result]);

  // 강화 시작 전 현재 레벨 저장
  useEffect(() => {
    if (isEnhancing) {
      setPreviousLevel(level);
    }
  }, [isEnhancing]);

  // 홈 화면 추가 가이드 (모바일 웹 사용자만)
  useEffect(() => {
    if (user && shouldShowInstallPrompt()) {
      // 5초 후 표시 (사용자 경험 개선)
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // 데이터 변경시 Firebase 저장
  useEffect(() => {
    if (user && !isEnhancing) {
      const saveTimeout = setTimeout(() => {
        updateUserData({ gold, stats, level, inventory, buffs, itemStats });
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [gold, stats, level, inventory, buffs, itemStats, isEnhancing]);

  // 이벤트 메시지
  const eventMessages = {
    lucky: '⚡ 럭키 강화! +2 상승!',
    blessing: '🌟 축복 획득! 다음 하락 방지',
    blessingUsed: '🌟 축복 발동! 하락 방지됨',
    passion: '🔥 열정 모드! 성공률 2배',
    shieldGain: '🛡️ 보호막 획득!',
    shieldUsed: '🛡️ 보호막 발동! 파괴 방지됨',
    goldenChance: `💰 황금 찬스! ${eventMultiplier}배 판매!`,
    freeEnhance: '🎁 무료 강화권 획득!',
  };

  useEffect(() => {
    if (result) {
      const duration = result === 'sold' ? 1500 : level >= 15 ? 2500 : level >= 10 ? 2000 : 1500;
      const timer = setTimeout(() => setResult(null), duration);
      return () => clearTimeout(timer);
    }
  }, [result, setResult, level]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleShare = () => {
    if (!window.Kakao) {
      alert('카카오 SDK 로드 실패');
      return;
    }
    const maxTierName = tierGuide.find(t => {
      const [start, end] = t.range.replace('+', '').split('~').map(Number);
      return stats.maxLevel >= start && stats.maxLevel <= end;
    })?.label || '일반';

    const currentTierName = tierGuide.find(t => {
      const [start, end] = t.range.replace('+', '').split('~').map(Number);
      return level >= start && level <= end;
    })?.label || '일반';

    const successRate = stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0;
    const netProfit = stats.totalEarned - stats.totalSpent;

    // 최고 레벨 아이템 이미지 사용
    const imageUrl = `https://copark-dev.github.io/enhance-game/images/items/${stats.maxLevel}.png`;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `⚔️ ${user?.nickname || '사용자'}의 강화 기록`,
        description: `🏆 최고 달성: +${stats.maxLevel} ${maxTierName}\n⚔️ 현재 장비: +${level} ${currentTierName}\n🎯 성공률: ${successRate}% (${stats.successes}/${stats.attempts})\n💰 순이익: ${formatGold(netProfit)}G`,
        imageUrl: imageUrl,
        link: {
          mobileWebUrl: 'https://copark-dev.github.io/enhance-game/',
          webUrl: 'https://copark-dev.github.io/enhance-game/',
        },
      },
      buttons: [
        {
          title: '나도 강화하기',
          link: {
            mobileWebUrl: 'https://copark-dev.github.io/enhance-game/',
            webUrl: 'https://copark-dev.github.io/enhance-game/',
          },
        },
      ],
    });
  };

  const tierGuide = [
    { range: '+0~2', color: '#AAAAAA', label: '일반' },
    { range: '+3~5', color: '#4CAF50', label: '고급' },
    { range: '+6~8', color: '#2196F3', label: '희귀' },
    { range: '+9~11', color: '#9C27B0', label: '영웅' },
    { range: '+12~14', color: '#FF9800', label: '전설' },
    { range: '+15~17', color: '#F44336', label: '신화' },
    { range: '+18~20', color: '#E91E63', label: '초월' },
  ];

  return (
    <div style={styles.container} className="game-container">
      <div style={styles.bgGlow} />

      {/* 상단 고정바 - 간소화 */}
      <div style={styles.topBar} className="top-bar">
        <div style={styles.topBarLeft}>
          {user?.profileImage && <img src={user.profileImage} alt='profile' style={styles.profileImg} />}
          <span style={styles.userName}>{user?.nickname || '사용자'}</span>
        </div>
        <div style={styles.topBarRight}>
          <motion.button
            onClick={() => navigate('/ad-reward')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.adBtn}
          >
            🎬 +1만G
          </motion.button>
          {(user?.email === 'psw4887@naver.com' || user?.nickname === '박세완') && (
            <motion.button onClick={() => navigate('/admin')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.adminBtn}>
              ⚙️
            </motion.button>
          )}
        </div>
      </div>

      {/* 파티클 이펙트 - 별도 레이어 */}
      <ParticleEffect trigger={result} type={result || 'success'} level={level} />

      {/* 아이템 영역 - 화면 정중앙 고정 */}
      <div style={styles.centerItem} className="item-display-wrapper">
        <ItemDisplay level={level} isEnhancing={isEnhancing} result={result} isDestroyed={isDestroyed} />
      </div>

      {/* 상단 UI */}
      <div style={styles.topUI}>
        <motion.h1 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={styles.title} className="game-title">⚔️ 강화 시뮬레이터</motion.h1>
        <div style={styles.goldArea} className="gold-area">
          <div style={styles.coinIcon}>
            <span style={styles.coinInner}>G</span>
          </div>
          <span style={styles.goldAmount} className="gold-amount">{formatGold(gold)}</span>
        </div>

        {/* 활성 버프 표시 (클릭 시 툴팁) */}
        {(buffs.shield || buffs.freeEnhance || buffs.passion || buffs.blessing) && (
          <div style={styles.buffArea}>
            {buffs.shield && (
              <span
                style={styles.buffBadge}
                onClick={() => setActiveBuffTooltip(activeBuffTooltip === 'shield' ? null : 'shield')}
              >
                🛡️
                {activeBuffTooltip === 'shield' && (
                  <div style={styles.buffTooltip}>파괴 방지: 다음 파괴 시 보호</div>
                )}
              </span>
            )}
            {buffs.freeEnhance && (
              <span
                style={styles.buffBadge}
                onClick={() => setActiveBuffTooltip(activeBuffTooltip === 'free' ? null : 'free')}
              >
                🎁
                {activeBuffTooltip === 'free' && (
                  <div style={styles.buffTooltip}>무료 강화: 다음 강화 무료</div>
                )}
              </span>
            )}
            {buffs.passion && (
              <span
                style={{...styles.buffBadge, background: 'linear-gradient(145deg, #FF6B6B, #FF4444)'}}
                onClick={() => setActiveBuffTooltip(activeBuffTooltip === 'passion' ? null : 'passion')}
              >
                🔥 2x
                {activeBuffTooltip === 'passion' && (
                  <div style={styles.buffTooltip}>열정 모드: 성공률 2배</div>
                )}
              </span>
            )}
            {buffs.blessing && (
              <span
                style={styles.buffBadge}
                onClick={() => setActiveBuffTooltip(activeBuffTooltip === 'blessing' ? null : 'blessing')}
              >
                🌟
                {activeBuffTooltip === 'blessing' && (
                  <div style={styles.buffTooltip}>축복: 다음 하락 방지</div>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 이벤트 알림 */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            style={styles.eventNotification}
          >
            {eventMessages[activeEvent]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 UI */}
      <div style={styles.bottomUI}>
        <div style={styles.priceInfo} className="price-info">
          <div style={styles.priceRow}><span style={styles.priceLabel}>강화 비용</span><span style={styles.priceCost}>{formatGold(enhanceCost)} G</span></div>
          <div style={styles.priceRow}><span style={styles.priceLabel}>판매 예상가</span><span style={styles.priceSell}>{formatGold(sellRange.min)} ~ {formatGold(sellRange.max)} G</span></div>
          {level > 0 && (
            <div style={styles.statsRow}>
              <span style={styles.statLabel}>⚔️ {itemStats.attack}</span>
              <span style={styles.statLabel}>❤️ {300 + itemStats.hp * 3}</span>
              <span style={styles.statLabel}>💨 {itemStats.speed || 0}</span>
            </div>
          )}
        </div>

        <RateDisplay successRate={successRate} downgradeRate={downgradeRate} destroyRate={destroyRate} />

        <div style={styles.buttonArea}>
          {isDestroyed ? (
            <motion.button onClick={reset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.resetBtn}>🔄 다시 시작</motion.button>
          ) : (
            <div style={styles.buttonRow} className="button-row">
              <EnhanceButton onClick={enhance} disabled={!canEnhance} isEnhancing={isEnhancing} isMax={level >= MAX_LEVEL} level={level} />
              <motion.button onClick={sell} disabled={isEnhancing || level === 0}
                whileHover={!isEnhancing && level > 0 ? { scale: 1.05 } : {}}
                whileTap={!isEnhancing && level > 0 ? { scale: 0.95 } : {}}
                className="sell-btn"
                style={{ ...styles.sellBtn, opacity: isEnhancing || level === 0 ? 0.4 : 1, cursor: isEnhancing || level === 0 ? 'not-allowed' : 'pointer' }}>
                💰 판매
              </motion.button>
              <motion.button onClick={storeItem} disabled={isEnhancing || level === 0 || inventory.length >= 5}
                whileHover={!isEnhancing && level > 0 && inventory.length < 5 ? { scale: 1.05 } : {}}
                whileTap={!isEnhancing && level > 0 && inventory.length < 5 ? { scale: 0.95 } : {}}
                className="store-btn"
                style={{ ...styles.storeBtn, opacity: isEnhancing || level === 0 || inventory.length >= 5 ? 0.4 : 1, cursor: isEnhancing || level === 0 || inventory.length >= 5 ? 'not-allowed' : 'pointer' }}>
                📦 보관
              </motion.button>
            </div>
          )}
        </div>

        {gold < enhanceCost && !isDestroyed && level < MAX_LEVEL && <div style={styles.warning}>⚠️ 골드 부족! (필요: {formatGold(enhanceCost)}G)</div>}

        {/* 보관함 */}
        <div style={styles.inventoryArea} className="inventory-area">
          <div style={styles.inventoryLabel}>📦 보관함 ({inventory.length}/5)</div>
          <div style={styles.inventorySlots}>
            {[0, 1, 2, 3, 4].map((i) => {
              const item = inventory[i];
              const hasItem = item !== undefined;
              const itemLevel = hasItem ? (item.level || item) : 0; // 이전 형식 호환
              const color = hasItem ? getLevelColor(itemLevel) : '#333';
              return (
                <motion.div
                  key={i}
                  onClick={() => hasItem && takeItem(i)}
                  whileHover={hasItem ? { scale: 1.1 } : {}}
                  whileTap={hasItem ? { scale: 0.95 } : {}}
                  style={{
                    ...styles.inventorySlot,
                    borderColor: color,
                    boxShadow: hasItem ? `0 0 10px ${color}` : 'none',
                    cursor: hasItem ? 'pointer' : 'default',
                  }}
                >
                  {hasItem ? (
                    <span style={{ color, fontWeight: 'bold', fontSize: 16 }}>+{itemLevel}</span>
                  ) : (
                    <span style={{ color: '#444', fontSize: 18 }}>-</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <StatsPanel
        stats={stats}
        gold={gold}
        isMobileOpen={showMobileStats}
        onClose={() => setShowMobileStats(false)}
        onResetStats={() => setStats({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 })}
        user={user}
      />
      <ResultOverlay result={result} level={level} lastSellPrice={lastSellPrice} isNewRecord={isNewRecord} />
      <FriendPanel isOpen={showFriendPanel} onClose={() => setShowFriendPanel(false)} onGoldChange={setGold} />
      <GuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <DailyRewardPanel
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        user={user}
        onClaimReward={(reward, streak) => {
          claimDailyReward(reward, streak);
          setGold(g => g + reward);
        }}
      />
      <AchievementPanel
        isOpen={showAchievement}
        onClose={() => setShowAchievement(false)}
        stats={{ ...stats, battles: user?.battleStats?.battles || 0, wins: user?.battleStats?.wins || 0 }}
        claimedAchievements={user?.claimedAchievements || []}
        onClaimAchievement={(id, reward) => {
          claimAchievement(id, reward);
          setGold(g => g + reward);
        }}
      />
      <RankingPanel
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        currentUser={user}
        getRankings={getRankings}
      />
      <BattlePanel
        isOpen={showBattle}
        onClose={() => setShowBattle(false)}
        currentUser={user}
        userStats={user?.battleStats}
        inventory={inventory.map((item, idx) => ({
          id: idx,
          level: item.level || item,
          attack: item.attack || 0,
          hp: item.hp || 0,
          speed: item.speed || 0
        }))}
        currentItem={{ level, attack: itemStats.attack, hp: itemStats.hp, speed: itemStats.speed || 0 }}
        getRandomOpponents={getRandomOpponents}
        saveBattleNotification={saveBattleNotification}
        onBattle={(result) => {
          updateBattleStats(result.won, result.reward);
          if (result.won) {
            setGold(g => g + result.reward);
          }
        }}
      />
      <BattleNotificationModal
        isOpen={showBattleNotifications}
        notifications={battleNotifications}
        onClose={() => setShowBattleNotifications(false)}
        onMarkRead={(ids) => {
          if (markBattleNotificationsRead) {
            markBattleNotificationsRead(ids);
          }
          setBattleNotifications([]);
        }}
      />

      {/* 홈 화면 추가 가이드 모달 */}
      <InstallPromptModal
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />

      {/* 선물 알림 모달 */}
      {giftNotifications.length > 0 && (
        <GiftNotificationModal
          notifications={giftNotifications}
          onClose={() => {
            markGiftNotificationsRead();
            setGiftNotifications([]);
          }}
        />
      )}

      {/* 오프라인 보상 모달 */}
      <AnimatePresence>
        {offlineReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissOfflineReward}
            style={styles.offlineOverlay}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={styles.offlineModal}
            >
              <div style={styles.offlineIcon}>💰</div>
              <h2 style={styles.offlineTitle}>다시 오셨군요!</h2>
              <p style={styles.offlineDesc}>
                {offlineReward.hours}시간 동안 골드가 쌓였어요
              </p>
              <div style={styles.offlineReward}>
                +{formatGold(offlineReward.gold)} G
              </div>
              <motion.button
                onClick={dismissOfflineReward}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={styles.offlineBtn}
              >
                받기
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 실시간 강화 피드 */}
      <LiveFeed
        isOpen={showLiveFeed}
        onToggle={() => setShowLiveFeed(!showLiveFeed)}
      />

      {/* 하단 네비게이션 */}
      <BottomNavigation
        onShowFriend={() => setShowFriendPanel(true)}
        onShowRanking={() => setShowRanking(true)}
        onShowBattle={() => setShowBattle(true)}
        onShowDailyReward={() => setShowDailyReward(true)}
        onShowAchievement={() => setShowAchievement(true)}
        onShowGuide={() => setShowGuide(true)}
        onShowStats={() => setShowMobileStats(true)}
        onToggleSound={() => { toggleMute(); setIsMuted(!isMuted); }}
        onShare={handleShare}
        onLogout={handleLogout}
        isMuted={isMuted}
        hasNotification={battleNotifications.length > 0}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 72,
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  centerItem: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' },
  topUI: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2, width: '100%', maxWidth: 360 },
  bottomUI: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2, width: '100%', maxWidth: 360 },
  bgGlow: { position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(100,80,200,0.15) 0%, transparent 60%)', pointerEvents: 'none' },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(15,15,35,0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    zIndex: 100,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  adminBtn: { padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  adBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
  },
  profileImg: { width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,215,0,0.6)' },
  userName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  title: { color: '#fff', fontSize: 20, marginBottom: 0, marginTop: 0, fontWeight: '700', letterSpacing: '-0.5px' },
  goldArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'rgba(255,215,0,0.1)',
    borderRadius: 50,
    border: '1px solid rgba(255,215,0,0.2)',
  },
  coinIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #FFD700, #FFA500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
  },
  coinInner: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goldAmount: { color: '#FFD700', fontSize: 22, fontWeight: '700', letterSpacing: '-0.5px' },
  priceInfo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
  },
  priceRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14 },
  priceLabel: { color: 'rgba(255,255,255,0.5)' },
  priceCost: { color: '#FF6B6B', fontWeight: '600' },
  priceSell: { color: '#4CAF50', fontWeight: '600' },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' },
  statLabel: { color: 'rgba(255,215,0,0.9)', fontSize: 13, fontWeight: '600' },
  buttonArea: { marginTop: 8, width: '100%' },
  buttonRow: { display: 'flex', gap: 10, justifyContent: 'center' },
  resetBtn: {
    padding: '14px 40px',
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(76,175,80,0.3)',
  },
  sellBtn: {
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    background: 'linear-gradient(135deg, #FFD700, #FFC107)',
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(255,215,0,0.25)',
  },
  storeBtn: {
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    background: 'linear-gradient(135deg, #7C4DFF, #651FFF)',
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(124,77,255,0.25)',
  },
  warning: {
    marginTop: 12,
    padding: '12px 20px',
    background: 'rgba(255,152,0,0.15)',
    color: '#FF9800',
    borderRadius: 12,
    fontSize: 13,
    border: '1px solid rgba(255,152,0,0.2)',
    textAlign: 'center',
  },
  inventoryArea: {
    width: '100%',
    marginTop: 8,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  inventoryLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' },
  inventorySlots: { display: 'flex', gap: 8, justifyContent: 'center' },
  inventorySlot: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  buffArea: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 },
  buffBadge: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    fontSize: 13,
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    position: 'relative',
    cursor: 'pointer',
  },
  buffTooltip: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.95)',
    borderRadius: 10,
    fontSize: 12,
    color: '#fff',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255,215,0,0.3)',
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  eventNotification: {
    position: 'fixed',
    top: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #FFD700, #FFC107)',
    color: '#000',
    borderRadius: 50,
    fontSize: 14,
    fontWeight: '700',
    boxShadow: '0 8px 30px rgba(255,215,0,0.4)',
    zIndex: 1000,
    whiteSpace: 'nowrap',
    maxWidth: '90%',
  },
  offlineOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: 20,
  },
  offlineModal: {
    background: 'linear-gradient(145deg, #1a1a3e, #0f0f23)',
    borderRadius: 24,
    padding: '40px 30px',
    textAlign: 'center',
    border: '2px solid rgba(255,215,0,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.1)',
    maxWidth: 320,
    width: '100%',
  },
  offlineIcon: {
    fontSize: 60,
    marginBottom: 16,
    filter: 'drop-shadow(0 4px 10px rgba(255,215,0,0.4))',
  },
  offlineTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  offlineDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    margin: '0 0 20px 0',
  },
  offlineReward: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 24,
    textShadow: '0 2px 10px rgba(76,175,80,0.4)',
  },
  offlineBtn: {
    padding: '14px 50px',
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    background: 'linear-gradient(135deg, #FFD700, #FFC107)',
    border: 'none',
    borderRadius: 50,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
  },
};

export default EnhanceGame;
