import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold, getLevelColor, getItemImage, getLevelTier } from '../utils/constants';

const BattlePanel = ({
  isOpen,
  onClose,
  userStats,
  inventory = [],
  currentItem, // 현재 강화중인 아이템 {level, attack, hp}
  onBattle,
  getRandomOpponents,
  saveBattleNotification
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [matchedOpponent, setMatchedOpponent] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [isBattling, setIsBattling] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [tab, setTab] = useState('battle'); // 'battle' | 'history'
  const [battleHistory, setBattleHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // 히스토리 로드
      const history = JSON.parse(localStorage.getItem('battleHistory') || '[]');
      setBattleHistory(history.slice(0, 20));
      // 현재 아이템이 있으면 자동 선택
      if (currentItem && currentItem.level > 0) {
        setSelectedItem({
          id: 'current',
          level: currentItem.level,
          attack: currentItem.attack,
          hp: currentItem.hp
        });
      }
    }
  }, [isOpen, currentItem]);

  const loadHistory = () => {
    const history = JSON.parse(localStorage.getItem('battleHistory') || '[]');
    setBattleHistory(history.slice(0, 20));
  };

  const saveBattleToHistory = (result) => {
    const history = JSON.parse(localStorage.getItem('battleHistory') || '[]');
    history.unshift({
      ...result,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('battleHistory', JSON.stringify(history.slice(0, 50)));
    setBattleHistory(history.slice(0, 20));
  };

  // 아이템 스탯 기반 전투력 계산
  const calculatePower = (item) => {
    const attack = item?.attack || 0;
    const hp = item?.hp || 0;
    const level = item?.level || 0;
    // 공격력 + HP/2 + 레벨 보너스
    return Math.floor(attack + (hp / 2) + (level * 10));
  };

  // 아이템 스탯 기반 HP 계산
  const calculateMaxHp = (item) => {
    const baseHp = 100;
    const itemHp = item?.hp || 0;
    return baseHp + itemHp;
  };

  // 아이템 스탯 기반 공격력 계산
  const calculateAttack = (item) => {
    return item?.attack || 0;
  };

  // 크리티컬 확률 (레벨에 따라 증가)
  const getCritChance = (level) => {
    return Math.min(5 + level * 2, 50);
  };

  // 회피 확률 (HP 높을수록 증가)
  const getDodgeChance = (item) => {
    const hp = item?.hp || 0;
    return Math.min(hp / 50, 25);
  };

  // 랜덤 매칭
  const startMatching = async () => {
    if (!selectedItem || !getRandomOpponents) return;

    setIsMatching(true);
    setMatchedOpponent(null);

    // 매칭 애니메이션 시간
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const opponents = await getRandomOpponents(5);
      if (opponents.length > 0) {
        // 랜덤 선택
        const randomIndex = Math.floor(Math.random() * opponents.length);
        setMatchedOpponent(opponents[randomIndex]);
      } else {
        alert('매칭 가능한 상대가 없습니다. 나중에 다시 시도해주세요!');
      }
    } catch (error) {
      console.error('매칭 실패:', error);
    }

    setIsMatching(false);
  };

  // 배틀 시뮬레이션 (아이템 스탯 기반)
  const simulateBattle = async () => {
    if (!selectedItem || !matchedOpponent) return;

    setIsBattling(true);
    setBattleResult(null);
    setBattleLog([]);

    const myItem = selectedItem;
    const opponentItem = matchedOpponent.battleItem;

    let myHp = calculateMaxHp(myItem);
    let opponentHp = calculateMaxHp(opponentItem);
    const maxMyHp = myHp;
    const maxOpponentHp = opponentHp;

    const myAttack = calculateAttack(myItem);
    const opponentAttack = calculateAttack(opponentItem);

    const logs = [];
    let round = 0;

    // 암호학적 난수 생성
    const secureRandom = () => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 4294967295;
    };

    while (myHp > 0 && opponentHp > 0 && round < 20) {
      round++;

      // 내 턴
      const opponentDodgeRoll = secureRandom() * 100;
      const myCritRoll = secureRandom() * 100;
      const opponentDodge = getDodgeChance(opponentItem);

      if (opponentDodgeRoll < opponentDodge) {
        logs.push({ round, attacker: 'me', action: 'dodged', damage: 0 });
      } else {
        let damage = Math.floor(myAttack * (0.8 + secureRandom() * 0.4));
        const isCrit = myCritRoll < getCritChance(myItem.level);
        if (isCrit) {
          damage = Math.floor(damage * 1.5);
          logs.push({ round, attacker: 'me', action: 'critical', damage });
        } else {
          logs.push({ round, attacker: 'me', action: 'attack', damage });
        }
        opponentHp -= damage;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setBattleLog([...logs]);

      if (opponentHp <= 0) break;

      // 상대 턴
      const myDodgeRoll = secureRandom() * 100;
      const oppCritRoll = secureRandom() * 100;
      const myDodge = getDodgeChance(myItem);

      if (myDodgeRoll < myDodge) {
        logs.push({ round, attacker: 'opponent', action: 'dodged', damage: 0 });
      } else {
        let damage = Math.floor(opponentAttack * (0.8 + secureRandom() * 0.4));
        const isCrit = oppCritRoll < getCritChance(opponentItem.level);
        if (isCrit) {
          damage = Math.floor(damage * 1.5);
          logs.push({ round, attacker: 'opponent', action: 'critical', damage });
        } else {
          logs.push({ round, attacker: 'opponent', action: 'attack', damage });
        }
        myHp -= damage;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setBattleLog([...logs]);
    }

    const won = myHp > opponentHp;
    const reward = won ? Math.floor(1000 + opponentItem.level * 500 + secureRandom() * 1000) : 0;

    const result = {
      won,
      myLevel: myItem.level,
      myAttack: myItem.attack,
      myHp: myItem.hp,
      opponentLevel: opponentItem.level,
      opponentName: matchedOpponent.nickname,
      opponentId: matchedOpponent.id,
      reward,
      finalMyHp: Math.max(0, myHp),
      finalOpponentHp: Math.max(0, opponentHp),
      maxMyHp,
      maxOpponentHp,
      rounds: round
    };

    setBattleResult(result);
    saveBattleToHistory(result);

    // 상대에게 배틀 알림 저장
    if (saveBattleNotification) {
      await saveBattleNotification(matchedOpponent.id, result);
    }

    if (onBattle) {
      onBattle(result);
    }

    setIsBattling(false);
  };

  const resetBattle = () => {
    setBattleResult(null);
    setBattleLog([]);
    setMatchedOpponent(null);
  };

  const rematch = async () => {
    setBattleResult(null);
    setBattleLog([]);
    await startMatching();
  };

  if (!isOpen) return null;

  // 배틀 가능한 아이템 목록 (현재 강화중 + 인벤토리)
  const battleItems = [
    ...(currentItem && currentItem.level > 0 ? [{
      id: 'current',
      level: currentItem.level,
      attack: currentItem.attack,
      hp: currentItem.hp,
      isCurrent: true
    }] : []),
    ...inventory.filter(item => item.level > 0).map((item, idx) => ({
      ...item,
      id: `inv-${idx}`
    }))
  ];

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
            <h2 style={styles.title}>⚔️ 랜덤 배틀</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          <div style={styles.tabs}>
            <button
              onClick={() => setTab('battle')}
              style={{
                ...styles.tab,
                backgroundColor: tab === 'battle' ? 'rgba(255,215,0,0.3)' : 'transparent'
              }}
            >
              대전
            </button>
            <button
              onClick={() => setTab('history')}
              style={{
                ...styles.tab,
                backgroundColor: tab === 'history' ? 'rgba(255,215,0,0.3)' : 'transparent'
              }}
            >
              전적
            </button>
          </div>

          {tab === 'battle' ? (
            <>
              {battleResult ? (
                <div style={styles.resultContainer}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      ...styles.resultBanner,
                      backgroundColor: battleResult.won ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)',
                      borderColor: battleResult.won ? '#4CAF50' : '#F44336'
                    }}
                  >
                    <div style={{ fontSize: 48 }}>{battleResult.won ? '🎉' : '😢'}</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: battleResult.won ? '#4CAF50' : '#F44336' }}>
                      {battleResult.won ? '승리!' : '패배...'}
                    </div>
                    {battleResult.won && (
                      <div style={{ color: '#FFD700', fontSize: 16 }}>
                        +{formatGold(battleResult.reward)}G 획득!
                      </div>
                    )}
                  </motion.div>

                  <div style={styles.battleStats}>
                    <div style={styles.statRow}>
                      <span>나 (+{battleResult.myLevel})</span>
                      <div style={styles.hpBar}>
                        <div style={{
                          ...styles.hpFill,
                          width: `${(battleResult.finalMyHp / battleResult.maxMyHp) * 100}%`,
                          backgroundColor: '#4CAF50'
                        }} />
                      </div>
                      <span>{battleResult.finalMyHp}/{battleResult.maxMyHp}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span>{battleResult.opponentName} (+{battleResult.opponentLevel})</span>
                      <div style={styles.hpBar}>
                        <div style={{
                          ...styles.hpFill,
                          width: `${(battleResult.finalOpponentHp / battleResult.maxOpponentHp) * 100}%`,
                          backgroundColor: '#F44336'
                        }} />
                      </div>
                      <span>{battleResult.finalOpponentHp}/{battleResult.maxOpponentHp}</span>
                    </div>
                  </div>

                  <div style={styles.resultButtons}>
                    <motion.button
                      onClick={rematch}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.actionBtn}
                    >
                      🔄 재매칭
                    </motion.button>
                    <motion.button
                      onClick={resetBattle}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.actionBtn}
                    >
                      🔙 돌아가기
                    </motion.button>
                  </div>
                </div>
              ) : isBattling ? (
                <div style={styles.battleScene}>
                  <div style={styles.fighters}>
                    <div style={styles.fighter}>
                      <img src={getItemImage(selectedItem?.level || 0)} alt="" style={styles.fighterImg} />
                      <div style={{ color: getLevelColor(selectedItem?.level || 0) }}>
                        +{selectedItem?.level} {getLevelTier(selectedItem?.level)}
                      </div>
                      <div style={styles.itemStatsSmall}>
                        ⚔️{selectedItem?.attack} ❤️{selectedItem?.hp}
                      </div>
                    </div>
                    <div style={styles.vs}>VS</div>
                    <div style={styles.fighter}>
                      <div style={styles.opponentIcon}>👤</div>
                      <div style={{ color: getLevelColor(matchedOpponent?.battleItem?.level || 0) }}>
                        +{matchedOpponent?.battleItem?.level || 0}
                      </div>
                      <div style={styles.itemStatsSmall}>
                        ⚔️{matchedOpponent?.battleItem?.attack} ❤️{matchedOpponent?.battleItem?.hp}
                      </div>
                    </div>
                  </div>

                  <div style={styles.battleLog}>
                    {battleLog.slice(-5).map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          ...styles.logEntry,
                          color: log.attacker === 'me' ? '#4CAF50' : '#F44336'
                        }}
                      >
                        {log.attacker === 'me' ? '나' : matchedOpponent?.nickname}
                        {log.action === 'dodged' && ' 회피!'}
                        {log.action === 'attack' && ` 공격! -${log.damage}`}
                        {log.action === 'critical' && ` 크리티컬! -${log.damage}`}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : isMatching ? (
                <div style={styles.matchingScene}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={styles.matchingSpinner}
                  >
                    🎲
                  </motion.div>
                  <div style={styles.matchingText}>상대를 찾는 중...</div>
                </div>
              ) : matchedOpponent ? (
                <div style={styles.matchedScene}>
                  <div style={styles.matchedTitle}>🎯 상대 발견!</div>

                  <div style={styles.matchedVersus}>
                    <div style={styles.matchedCard}>
                      <img src={getItemImage(selectedItem?.level || 0)} alt="" style={styles.matchedItemImg} />
                      <div style={{ color: getLevelColor(selectedItem?.level || 0), fontSize: 14, fontWeight: 'bold' }}>
                        +{selectedItem?.level} {getLevelTier(selectedItem?.level)}
                      </div>
                      <div style={styles.matchedStats}>
                        <span>⚔️ {selectedItem?.attack}</span>
                        <span>❤️ {selectedItem?.hp}</span>
                      </div>
                      <div style={styles.matchedPower}>
                        전투력: {calculatePower(selectedItem)}
                      </div>
                    </div>

                    <div style={styles.matchedVsText}>VS</div>

                    <div style={styles.matchedCard}>
                      <img
                        src={matchedOpponent.profileImage || '/default-avatar.png'}
                        alt=""
                        style={styles.matchedAvatar}
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{matchedOpponent.nickname}</div>
                      <div style={{ color: getLevelColor(matchedOpponent.battleItem?.level || 0), fontSize: 14 }}>
                        +{matchedOpponent.battleItem?.level || 0}
                      </div>
                      <div style={styles.matchedStats}>
                        <span>⚔️ {matchedOpponent.battleItem?.attack}</span>
                        <span>❤️ {matchedOpponent.battleItem?.hp}</span>
                      </div>
                      <div style={styles.matchedPower}>
                        전투력: {calculatePower(matchedOpponent.battleItem)}
                      </div>
                    </div>
                  </div>

                  <div style={styles.matchedButtons}>
                    <motion.button
                      onClick={simulateBattle}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.battleBtn}
                    >
                      ⚔️ 배틀 시작!
                    </motion.button>
                    <motion.button
                      onClick={startMatching}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.rematchBtn}
                    >
                      🔄 다른 상대
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>내 아이템 선택</div>
                    {battleItems.length === 0 ? (
                      <div style={styles.empty}>강화된 아이템이 없습니다. 먼저 아이템을 강화하세요!</div>
                    ) : (
                      <div style={styles.itemGrid}>
                        {battleItems.map((item) => (
                          <motion.div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              ...styles.itemCard,
                              borderColor: selectedItem?.id === item.id ? '#FFD700' : '#333',
                              backgroundColor: selectedItem?.id === item.id ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            {item.isCurrent && <div style={styles.currentBadge}>장착중</div>}
                            <img src={getItemImage(item.level)} alt="" style={styles.itemImg} />
                            <div style={{ color: getLevelColor(item.level), fontSize: 12, fontWeight: 'bold' }}>
                              +{item.level}
                            </div>
                            <div style={{ fontSize: 9, color: '#888' }}>
                              ⚔️{item.attack} ❤️{item.hp}
                            </div>
                            <div style={{ fontSize: 10, color: '#aaa' }}>
                              전투력: {calculatePower(item)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedItem && (
                    <motion.button
                      onClick={startMatching}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.matchBtn}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      🎲 랜덤 매칭 시작
                    </motion.button>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={styles.historyList}>
              {battleHistory.length === 0 ? (
                <div style={styles.empty}>전적이 없습니다</div>
              ) : (
                battleHistory.map((battle, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.historyItem,
                      borderLeftColor: battle.won ? '#4CAF50' : '#F44336'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: battle.won ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                        {battle.won ? '승리' : '패배'}
                      </span>
                      <span style={{ color: '#666', fontSize: 11 }}>
                        {new Date(battle.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
                      vs {battle.opponentName} (+{battle.opponentLevel})
                    </div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                      내 아이템: +{battle.myLevel} (⚔️{battle.myAttack || '-'} ❤️{battle.myHp || '-'}) | {battle.rounds}라운드
                      {battle.won && <span style={{ color: '#FFD700' }}> | +{formatGold(battle.reward)}G</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div style={styles.statsInfo}>
            <div style={styles.statItem}>
              <span style={{ color: '#888' }}>총 배틀</span>
              <span style={{ color: '#fff' }}>{userStats?.battles || 0}회</span>
            </div>
            <div style={styles.statItem}>
              <span style={{ color: '#888' }}>승률</span>
              <span style={{ color: '#4CAF50' }}>
                {userStats?.battles > 0
                  ? Math.round((userStats?.wins / userStats?.battles) * 100)
                  : 0}%
              </span>
            </div>
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
    border: '2px solid #FF6B6B',
    boxShadow: '0 0 40px rgba(255,107,107,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { margin: 0, color: '#FF6B6B', fontSize: 20 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 24,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: '1px solid #444',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontSize: 13,
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  itemCard: {
    padding: 8,
    borderRadius: 10,
    border: '2px solid',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 8,
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 'bold',
  },
  itemImg: {
    width: 40,
    height: 40,
    objectFit: 'contain',
  },
  matchBtn: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FF6B6B',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  matchingScene: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  matchingSpinner: {
    fontSize: 60,
    marginBottom: 16,
  },
  matchingText: {
    color: '#fff',
    fontSize: 18,
  },
  matchedScene: {
    padding: 10,
  },
  matchedTitle: {
    textAlign: 'center',
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  matchedVersus: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchedCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    minWidth: 100,
  },
  matchedItemImg: {
    width: 50,
    height: 50,
    objectFit: 'contain',
    marginBottom: 8,
  },
  matchedAvatar: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#333',
    marginBottom: 8,
  },
  matchedStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  matchedPower: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
  },
  matchedVsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  matchedButtons: {
    display: 'flex',
    gap: 10,
  },
  battleBtn: {
    flex: 2,
    padding: 14,
    backgroundColor: '#FF6B6B',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  rematchBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 12,
    fontSize: 14,
    cursor: 'pointer',
  },
  battleScene: {
    padding: 20,
  },
  fighters: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  fighter: {
    textAlign: 'center',
  },
  fighterImg: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  opponentIcon: {
    fontSize: 50,
    marginBottom: 5,
  },
  itemStatsSmall: {
    fontSize: 10,
    color: '#888',
  },
  vs: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  battleLog: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultContainer: {
    textAlign: 'center',
  },
  resultBanner: {
    padding: 24,
    borderRadius: 16,
    border: '2px solid',
    marginBottom: 16,
  },
  resultButtons: {
    display: 'flex',
    gap: 10,
  },
  battleStats: {
    marginBottom: 16,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    color: '#fff',
    fontSize: 12,
  },
  hpBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 12,
    fontSize: 14,
    cursor: 'pointer',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 300,
    overflowY: 'auto',
  },
  historyItem: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderLeft: '3px solid',
  },
  statsInfo: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
  },
};

export default BattlePanel;
