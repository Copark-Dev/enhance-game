import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatGold, getLevelColor, getItemImage } from '../utils/constants';

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
  const [matchedOpponent, setMatchedOpponent] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [isBattling, setIsBattling] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [tab, setTab] = useState('battle'); // 'battle' | 'history'
  const [battleHistory, setBattleHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  // 순차 전투용 상태
  const [myTeam, setMyTeam] = useState([]);
  const [opponentTeam, setOpponentTeam] = useState([]);
  const [currentFighters, setCurrentFighters] = useState({ my: null, opponent: null });
  const [currentHp, setCurrentHp] = useState({ my: 0, opponent: 0, maxMy: 0, maxOpponent: 0 });
  const [defeatedCount, setDefeatedCount] = useState({ my: 0, opponent: 0 });

  // 내 팀 구성 (현재 영웅 + 보관함)
  const getMyTeam = () => {
    const team = [];
    if (currentItem && currentItem.level > 0) {
      team.push({
        id: 'current',
        level: currentItem.level,
        attack: currentItem.attack || 0,
        hp: currentItem.hp || 0,
        speed: currentItem.speed || 0,
        isCurrent: true
      });
    }
    inventory.forEach((item, idx) => {
      if (item && (item.level || item) > 0) {
        team.push({
          id: `inv-${idx}`,
          level: item.level || item,
          attack: item.attack || 0,
          hp: item.hp || 0,
          speed: item.speed || 0
        });
      }
    });
    // 레벨 높은 순으로 정렬
    return team.sort((a, b) => b.level - a.level);
  };

  useEffect(() => {
    if (isOpen) {
      const history = JSON.parse(localStorage.getItem('battleHistory') || '[]');
      setBattleHistory(history.slice(0, 20));
      setMyTeam(getMyTeam());
    }
  }, [isOpen, currentItem, inventory]);


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

  // 아이템 스탯 기반 HP 계산 (밸런스 조정)
  const calculateMaxHp = (item) => {
    const baseHp = 300;
    const itemHp = (item?.hp || 0) * 3;
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



  // 랜덤 매칭
  const startMatching = async () => {
    if (myTeam.length === 0 || !getRandomOpponents) return;

    setIsMatching(true);
    setMatchedOpponent(null);
    setOpponentTeam([]);
    setDefeatedCount({ my: 0, opponent: 0 });

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const opponents = await getRandomOpponents(5);
      if (opponents.length > 0) {
        const randomIndex = Math.floor(Math.random() * opponents.length);
        const opponent = opponents[randomIndex];
        setMatchedOpponent(opponent);

        // 상대의 실제 팀 사용
        if (opponent.team && opponent.team.length > 0) {
          setOpponentTeam(opponent.team);
        } else {
          alert('상대에게 배틀 가능한 영웅이 없습니다!');
          setIsMatching(false);
          return;
        }
      } else {
        alert('매칭 가능한 상대가 없습니다!');
      }
    } catch (error) {
      console.error('매칭 실패:', error);
    }

    setIsMatching(false);
  };

  // 순차 팀 배틀 시뮬레이션
  const simulateBattle = async () => {
    if (myTeam.length === 0 || opponentTeam.length === 0) return;

    setIsBattling(true);
    setBattleResult(null);
    setBattleLog([]);
    setDefeatedCount({ my: 0, opponent: 0 });

    // 팀 복사 (HP 추적용)
    const myFighters = myTeam.map(h => ({
      ...h,
      currentHp: calculateMaxHp(h),
      maxHp: calculateMaxHp(h),
      alive: true
    }));
    const oppFighters = opponentTeam.map(h => ({
      ...h,
      currentHp: calculateMaxHp(h),
      maxHp: calculateMaxHp(h),
      alive: true
    }));

    let myIdx = 0;
    let oppIdx = 0;
    const logs = [];
    let totalRounds = 0;
    let myDefeated = 0;
    let oppDefeated = 0;

    const secureRandom = () => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 4294967295;
    };

    // 현재 전투 중인 영웅 설정
    setCurrentFighters({ my: myFighters[0], opponent: oppFighters[0] });
    setCurrentHp({
      my: myFighters[0].currentHp,
      opponent: oppFighters[0].currentHp,
      maxMy: myFighters[0].maxHp,
      maxOpponent: oppFighters[0].maxHp
    });

    // 새 영웅 등장 알림
    logs.push({ type: 'enter', side: 'my', hero: myFighters[0] });
    logs.push({ type: 'enter', side: 'opponent', hero: oppFighters[0] });
    setBattleLog([...logs]);
    await new Promise(r => setTimeout(r, 800));

    // 배틀 루프
    while (myIdx < myFighters.length && oppIdx < oppFighters.length) {
      const myHero = myFighters[myIdx];
      const oppHero = oppFighters[oppIdx];
      let round = 0;

      // 1:1 전투
      while (myHero.currentHp > 0 && oppHero.currentHp > 0 && round < 30) {
        round++;
        totalRounds++;

        // 내 공격
        const myDmg = Math.floor(calculateAttack(myHero) * (0.8 + secureRandom() * 0.4));
        const myCrit = secureRandom() < getCritChance(myHero.level) / 100;
        const finalMyDmg = myCrit ? Math.floor(myDmg * 1.5) : myDmg;

        oppHero.currentHp -= finalMyDmg;
        logs.push({
          type: 'attack',
          attacker: 'me',
          damage: finalMyDmg,
          critical: myCrit,
          heroLevel: myHero.level
        });

        setBattleLog([...logs]);
        setCurrentHp({
          my: Math.max(0, myHero.currentHp),
          opponent: Math.max(0, oppHero.currentHp),
          maxMy: myHero.maxHp,
          maxOpponent: oppHero.maxHp
        });
        await new Promise(r => setTimeout(r, 500));

        if (oppHero.currentHp <= 0) {
          oppHero.alive = false;
          oppDefeated++;
          setDefeatedCount({ my: myDefeated, opponent: oppDefeated });
          logs.push({ type: 'defeat', side: 'opponent', hero: oppHero, killedBy: myHero });
          setBattleLog([...logs]);
          await new Promise(r => setTimeout(r, 600));

          oppIdx++;
          if (oppIdx < oppFighters.length) {
            logs.push({ type: 'enter', side: 'opponent', hero: oppFighters[oppIdx] });
            setCurrentFighters({ my: myHero, opponent: oppFighters[oppIdx] });
            setCurrentHp({
              my: myHero.currentHp,
              opponent: oppFighters[oppIdx].currentHp,
              maxMy: myHero.maxHp,
              maxOpponent: oppFighters[oppIdx].maxHp
            });
            setBattleLog([...logs]);
            await new Promise(r => setTimeout(r, 500));
          }
          break;
        }

        // 상대 공격
        const oppDmg = Math.floor(calculateAttack(oppHero) * (0.8 + secureRandom() * 0.4));
        const oppCrit = secureRandom() < getCritChance(oppHero.level) / 100;
        const finalOppDmg = oppCrit ? Math.floor(oppDmg * 1.5) : oppDmg;

        myHero.currentHp -= finalOppDmg;
        logs.push({
          type: 'attack',
          attacker: 'opponent',
          damage: finalOppDmg,
          critical: oppCrit,
          heroLevel: oppHero.level
        });

        setBattleLog([...logs]);
        setCurrentHp({
          my: Math.max(0, myHero.currentHp),
          opponent: Math.max(0, oppHero.currentHp),
          maxMy: myHero.maxHp,
          maxOpponent: oppHero.maxHp
        });
        await new Promise(r => setTimeout(r, 500));

        if (myHero.currentHp <= 0) {
          myHero.alive = false;
          myDefeated++;
          setDefeatedCount({ my: myDefeated, opponent: oppDefeated });
          logs.push({ type: 'defeat', side: 'my', hero: myHero, killedBy: oppHero });
          setBattleLog([...logs]);
          await new Promise(r => setTimeout(r, 600));

          myIdx++;
          if (myIdx < myFighters.length) {
            logs.push({ type: 'enter', side: 'my', hero: myFighters[myIdx] });
            setCurrentFighters({ my: myFighters[myIdx], opponent: oppHero });
            setCurrentHp({
              my: myFighters[myIdx].currentHp,
              opponent: oppHero.currentHp,
              maxMy: myFighters[myIdx].maxHp,
              maxOpponent: oppHero.maxHp
            });
            setBattleLog([...logs]);
            await new Promise(r => setTimeout(r, 500));
          }
          break;
        }
      }
    }

    const won = oppIdx >= oppFighters.length;
    const totalOppLevel = opponentTeam.reduce((sum, h) => sum + h.level, 0);
    const totalMyLevel = myTeam.reduce((sum, h) => sum + h.level, 0);
    // 보상 대폭 상향: 기본 5000G + 상대팀 레벨당 500G + 내팀 레벨당 200G + 랜덤 5000G
    const reward = won ? Math.floor(5000 + totalOppLevel * 500 + totalMyLevel * 200 + secureRandom() * 5000) : 0;

    const result = {
      won,
      myTeamSize: myTeam.length,
      oppTeamSize: opponentTeam.length,
      myDefeated,
      oppDefeated,
      opponentName: matchedOpponent.nickname,
      opponentId: matchedOpponent.id,
      opponentProfileImage: matchedOpponent.profileImage,
      reward,
      rounds: totalRounds,
      // 상세정보용 팀 데이터
      myTeamLevels: myTeam.map(h => h.level),
      oppTeamLevels: opponentTeam.map(h => h.level),
      myTotalPower: getTeamPower(myTeam),
      oppTotalPower: getTeamPower(opponentTeam)
    };

    setBattleResult(result);
    saveBattleToHistory(result);

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

  // 팀 전투력 계산
  const getTeamPower = (team) => team.reduce((sum, h) => sum + calculatePower(h), 0);

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
                    <div style={styles.teamResult}>
                      <span style={{ color: '#4CAF50' }}>내 팀</span>
                      <span>{battleResult.myTeamSize - battleResult.myDefeated} / {battleResult.myTeamSize} 생존</span>
                    </div>
                    <div style={styles.teamResult}>
                      <span style={{ color: '#F44336' }}>{battleResult.opponentName}</span>
                      <span>{battleResult.oppTeamSize - battleResult.oppDefeated} / {battleResult.oppTeamSize} 생존</span>
                    </div>
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 12, marginTop: 8 }}>
                      총 {battleResult.rounds} 라운드
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
                  {/* 팀 현황 */}
                  <div style={styles.teamStatus}>
                    <div style={styles.teamStatusSide}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>내 팀</span>
                      <span>{myTeam.length - defeatedCount.my} / {myTeam.length}</span>
                    </div>
                    <div style={styles.teamStatusSide}>
                      <span style={{ color: '#F44336', fontWeight: 'bold' }}>상대</span>
                      <span>{opponentTeam.length - defeatedCount.opponent} / {opponentTeam.length}</span>
                    </div>
                  </div>

                  {/* 배틀 아레나 */}
                  <div style={styles.battleArena}>
                    {/* 내 캐릭터 */}
                    <motion.div
                      style={styles.fighterCard}
                      animate={{
                        x: battleLog.length > 0 && battleLog[battleLog.length-1]?.attacker === 'me' ? [0, 30, -5, 0] : 0,
                        scale: battleLog.length > 0 && battleLog[battleLog.length-1]?.attacker === 'opponent' ? [1, 0.85, 1.05, 1] : 1,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <div style={styles.fighterHpWrapper}>
                        <motion.div
                          style={{
                            ...styles.fighterHpBar,
                            background: currentHp.maxMy > 0 && currentHp.my / currentHp.maxMy > 0.3
                              ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                              : 'linear-gradient(90deg, #FF5722, #FF9800)'
                          }}
                          animate={{ width: `${currentHp.maxMy > 0 ? (currentHp.my / currentHp.maxMy) * 100 : 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div style={styles.fighterHpText}>{currentHp.my}/{currentHp.maxMy}</div>
                      <motion.img
                        src={getItemImage(currentFighters.my?.level || 0)}
                        alt=""
                        style={styles.fighterImgLarge}
                      />
                      <div style={{ color: getLevelColor(currentFighters.my?.level || 0), fontWeight: 'bold', fontSize: 13 }}>
                        +{currentFighters.my?.level || 0}
                      </div>
                      <div style={{ color: '#4CAF50', fontSize: 11 }}>나</div>
                    </motion.div>

                    {/* VS 이펙트 */}
                    <motion.div
                      style={styles.vsEffect}
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ⚔️
                    </motion.div>

                    {/* 상대 캐릭터 */}
                    <motion.div
                      style={styles.fighterCard}
                      animate={{
                        x: battleLog.length > 0 && battleLog[battleLog.length-1]?.attacker === 'opponent' ? [0, -30, 5, 0] : 0,
                        scale: battleLog.length > 0 && battleLog[battleLog.length-1]?.attacker === 'me' ? [1, 0.85, 1.05, 1] : 1,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <div style={styles.fighterHpWrapper}>
                        <motion.div
                          style={{
                            ...styles.fighterHpBar,
                            background: currentHp.maxOpponent > 0 && currentHp.opponent / currentHp.maxOpponent > 0.3
                              ? 'linear-gradient(90deg, #F44336, #E91E63)'
                              : 'linear-gradient(90deg, #FF5722, #FF9800)'
                          }}
                          animate={{ width: `${currentHp.maxOpponent > 0 ? (currentHp.opponent / currentHp.maxOpponent) * 100 : 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div style={styles.fighterHpText}>{currentHp.opponent}/{currentHp.maxOpponent}</div>
                      <motion.img
                        src={getItemImage(currentFighters.opponent?.level || 0)}
                        alt=""
                        style={styles.fighterImgLarge}
                      />
                      <div style={{ color: getLevelColor(currentFighters.opponent?.level || 0), fontWeight: 'bold', fontSize: 13 }}>
                        +{currentFighters.opponent?.level || 0}
                      </div>
                      <div style={{ color: '#F44336', fontSize: 11 }}>{matchedOpponent?.nickname}</div>
                    </motion.div>
                  </div>

                  {/* 배틀 로그 */}
                  <div style={styles.battleLogBox}>
                    {battleLog.slice(-5).map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          ...styles.logEntry,
                          textAlign: log.type === 'enter' || log.type === 'defeat' ? 'center' : log.attacker === 'me' ? 'left' : 'right',
                          background: log.type === 'enter' ? 'rgba(255,215,0,0.2)' :
                            log.type === 'defeat' ? 'rgba(128,128,128,0.3)' :
                            log.attacker === 'me' ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                        }}
                      >
                        {log.type === 'enter' && (
                          <span style={{ color: '#FFD700' }}>
                            ⚡ +{log.hero.level} {log.side === 'my' ? '출전!' : '등장!'}
                          </span>
                        )}
                        {log.type === 'defeat' && (
                          <span style={{ color: '#888' }}>
                            💀 +{log.hero.level} 쓰러짐! (+{log.killedBy.level}이 처치)
                          </span>
                        )}
                        {log.type === 'attack' && (
                          <span style={{ color: log.attacker === 'me' ? '#4CAF50' : '#F44336' }}>
                            {log.critical ? '💥 크리티컬! ' : '⚔️ '}
                            -{log.damage}
                          </span>
                        )}
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

                  <div style={styles.teamVersus}>
                    {/* 내 팀 */}
                    <div style={styles.teamColumn}>
                      <div style={styles.teamHeader}>
                        <span style={{ color: '#4CAF50' }}>내 팀</span>
                        <span style={{ color: '#888', fontSize: 11 }}>{myTeam.length}명</span>
                      </div>
                      <div style={styles.teamLineup}>
                        {myTeam.slice(0, 4).map((hero, i) => (
                          <div key={hero.id} style={styles.heroMini}>
                            <img src={getItemImage(hero.level)} alt="" style={styles.heroMiniImg} />
                            <span style={{ color: getLevelColor(hero.level), fontSize: 10 }}>+{hero.level}</span>
                          </div>
                        ))}
                        {myTeam.length > 4 && <span style={{ color: '#888', fontSize: 11 }}>+{myTeam.length - 4}</span>}
                      </div>
                      <div style={styles.teamPower}>
                        전투력: {getTeamPower(myTeam)}
                      </div>
                    </div>

                    <div style={styles.matchedVsText}>VS</div>

                    {/* 상대 팀 */}
                    <div style={styles.teamColumn}>
                      <div style={styles.teamHeader}>
                        <span style={{ color: '#F44336' }}>{matchedOpponent.nickname}</span>
                        <span style={{ color: '#888', fontSize: 11 }}>{opponentTeam.length}명</span>
                      </div>
                      <div style={styles.teamLineup}>
                        {opponentTeam.slice(0, 4).map((hero, i) => (
                          <div key={hero.id} style={styles.heroMini}>
                            <img src={getItemImage(hero.level)} alt="" style={styles.heroMiniImg} />
                            <span style={{ color: getLevelColor(hero.level), fontSize: 10 }}>+{hero.level}</span>
                          </div>
                        ))}
                        {opponentTeam.length > 4 && <span style={{ color: '#888', fontSize: 11 }}>+{opponentTeam.length - 4}</span>}
                      </div>
                      <div style={styles.teamPower}>
                        전투력: {getTeamPower(opponentTeam)}
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
                      ⚔️ 팀 배틀 시작!
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
                  {/* 내 팀 라인업 */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>내 팀 라인업 ({myTeam.length}명)</div>
                    {myTeam.length === 0 ? (
                      <div style={styles.empty}>강화된 영웅이 없습니다. 먼저 영웅을 강화하세요!</div>
                    ) : (
                      <div style={styles.itemGrid}>
                        {myTeam.map((hero) => (
                          <div
                            key={hero.id}
                            style={{
                              ...styles.itemCard,
                              borderColor: getLevelColor(hero.level),
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }}
                          >
                            {hero.isCurrent && <div style={styles.currentBadge}>현재</div>}
                            <img src={getItemImage(hero.level)} alt="" style={styles.itemImg} />
                            <div style={{ color: getLevelColor(hero.level), fontSize: 12, fontWeight: 'bold' }}>
                              +{hero.level}
                            </div>
                            <div style={{ fontSize: 9, color: '#888' }}>
                              ⚔️{hero.attack}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {myTeam.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold' }}>
                        팀 전투력: {getTeamPower(myTeam)}
                      </div>
                    </div>
                  )}

                  {myTeam.length > 0 && (
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
          ) : selectedHistory ? (
            // 전적 상세 정보
            <div style={styles.historyDetail}>
              <div style={styles.historyDetailHeader}>
                <button onClick={() => setSelectedHistory(null)} style={styles.backBtn}>
                  ← 뒤로
                </button>
                <span style={{ color: selectedHistory.won ? '#4CAF50' : '#F44336', fontSize: 20, fontWeight: 'bold' }}>
                  {selectedHistory.won ? '🎉 승리' : '😢 패배'}
                </span>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>상대</div>
                <div style={styles.detailOpponent}>
                  {selectedHistory.opponentProfileImage && (
                    <img src={selectedHistory.opponentProfileImage} alt="" style={styles.detailAvatar} />
                  )}
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedHistory.opponentName}</span>
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>전투 결과</div>
                <div style={styles.detailGrid}>
                  <div style={styles.detailCard}>
                    <div style={{ color: '#4CAF50', fontSize: 13 }}>내 팀</div>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                      {selectedHistory.myTeamSize - selectedHistory.myDefeated} / {selectedHistory.myTeamSize}
                    </div>
                    <div style={{ color: '#888', fontSize: 11 }}>생존</div>
                  </div>
                  <div style={styles.detailCard}>
                    <div style={{ color: '#F44336', fontSize: 13 }}>상대 팀</div>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                      {selectedHistory.oppTeamSize - selectedHistory.oppDefeated} / {selectedHistory.oppTeamSize}
                    </div>
                    <div style={{ color: '#888', fontSize: 11 }}>생존</div>
                  </div>
                </div>
              </div>

              {selectedHistory.myTeamLevels && selectedHistory.oppTeamLevels && (
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>팀 구성</div>
                  <div style={styles.teamLevelsRow}>
                    <div style={styles.teamLevelsBox}>
                      <div style={{ color: '#4CAF50', fontSize: 11, marginBottom: 4 }}>내 팀</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {selectedHistory.myTeamLevels.map((lvl, i) => (
                          <span key={i} style={{ ...styles.levelBadge, color: getLevelColor(lvl) }}>+{lvl}</span>
                        ))}
                      </div>
                      <div style={{ color: '#FFD700', fontSize: 10, marginTop: 4 }}>
                        전투력: {selectedHistory.myTotalPower || '-'}
                      </div>
                    </div>
                    <div style={styles.teamLevelsBox}>
                      <div style={{ color: '#F44336', fontSize: 11, marginBottom: 4 }}>상대 팀</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {selectedHistory.oppTeamLevels.map((lvl, i) => (
                          <span key={i} style={{ ...styles.levelBadge, color: getLevelColor(lvl) }}>+{lvl}</span>
                        ))}
                      </div>
                      <div style={{ color: '#FFD700', fontSize: 10, marginTop: 4 }}>
                        전투력: {selectedHistory.oppTotalPower || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>전투 정보</div>
                <div style={styles.detailInfoGrid}>
                  <div style={styles.detailInfoItem}>
                    <span style={{ color: '#888' }}>총 라운드</span>
                    <span style={{ color: '#fff' }}>{selectedHistory.rounds}회</span>
                  </div>
                  <div style={styles.detailInfoItem}>
                    <span style={{ color: '#888' }}>획득 골드</span>
                    <span style={{ color: '#FFD700' }}>
                      {selectedHistory.won ? `+${formatGold(selectedHistory.reward)}G` : '-'}
                    </span>
                  </div>
                  <div style={styles.detailInfoItem}>
                    <span style={{ color: '#888' }}>일시</span>
                    <span style={{ color: '#fff' }}>{new Date(selectedHistory.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.historyList}>
              {battleHistory.length === 0 ? (
                <div style={styles.empty}>전적이 없습니다</div>
              ) : (
                battleHistory.map((battle, i) => (
                  <motion.div
                    key={i}
                    onClick={() => setSelectedHistory(battle)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      ...styles.historyItem,
                      borderLeftColor: battle.won ? '#4CAF50' : '#F44336',
                      cursor: 'pointer'
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
                      vs {battle.opponentName}
                    </div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                      {battle.myTeamSize ? (
                        <>
                          내 팀: {battle.myTeamSize - battle.myDefeated}/{battle.myTeamSize} 생존 | {battle.rounds}라운드
                          {battle.won && <span style={{ color: '#FFD700' }}> | +{formatGold(battle.reward)}G</span>}
                        </>
                      ) : (
                        <>
                          내 영웅: +{battle.myLevel} | {battle.rounds}라운드
                          {battle.won && <span style={{ color: '#FFD700' }}> | +{formatGold(battle.reward)}G</span>}
                        </>
                      )}
                    </div>
                    <div style={{ color: '#555', fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                      탭하여 상세보기 →
                    </div>
                  </motion.div>
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
    padding: 10,
  },
  battleArena: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 10px',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(30,30,60,0.8) 100%)',
    borderRadius: 16,
    marginBottom: 12,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  fighterCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
  },
  fighterHpWrapper: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  fighterHpBar: {
    height: '100%',
    borderRadius: 4,
  },
  fighterHpText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  fighterImgLarge: {
    width: 70,
    height: 70,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  },
  vsEffect: {
    fontSize: 32,
    filter: 'drop-shadow(0 0 10px rgba(255,107,107,0.8))',
  },
  battleLogBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 10,
    minHeight: 80,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  logEntry: {
    fontSize: 13,
    padding: '6px 10px',
    borderRadius: 6,
    fontWeight: 'bold',
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
  historyDetail: {
    padding: 10,
  },
  historyDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailOpponent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  detailAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #444',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  detailCard: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    textAlign: 'center',
  },
  teamLevelsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  teamLevelsBox: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    textAlign: 'center',
  },
  levelBadge: {
    padding: '2px 6px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailInfoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  detailInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    fontSize: 13,
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
  teamResult: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13,
    color: '#fff',
  },
  teamStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  teamStatusSide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontSize: 12,
    color: '#fff',
  },
  teamVersus: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  teamColumn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  teamLineup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroMini: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  heroMiniImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #444',
  },
  teamPower: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: 'bold',
  },
};

export default BattlePanel;
