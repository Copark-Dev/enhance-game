import { useState, useCallback, useEffect } from 'react';
import { SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST, getSellPrice, MAX_LEVEL } from '../utils/constants';
import { playEnhanceStart, playSuccess, playFail, playDestroyed, playSell } from '../utils/sounds';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

// 암호학적으로 안전한 난수 생성 (0~100 사이 소수점 2자리)
const secureRandom = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] / 4294967295) * 100; // 0 ~ 100
};

// 0~1 사이 난수
const secureRandom01 = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967295;
};

// Rate limiter (연속 클릭 방지)
const createRateLimiter = (minIntervalMs) => {
  let lastAction = 0;
  return () => {
    const now = Date.now();
    if (now - lastAction < minIntervalMs) {
      return false; // 너무 빠른 연속 클릭
    }
    lastAction = now;
    return true;
  };
};

// Rate limiter 인스턴스 (노가다 버튼용 - 100ms 간격)
const grindLimiter = createRateLimiter(100);

// 레벨별 스탯 배율 (고강일수록 급격히 증가)
const getStatMultiplier = (level) => {
  if (level >= 18) return 5.0;   // 초월
  if (level >= 15) return 3.5;   // 신화
  if (level >= 12) return 2.5;   // 전설
  if (level >= 9) return 1.8;    // 에픽
  if (level >= 6) return 1.3;    // 레어
  if (level >= 3) return 1.1;    // 언커먼
  return 1.0;                    // 노말
};

// 아이템 스탯 생성 (레벨 기반 + 랜덤) - 고강 스케일링 강화
const generateItemStats = (level, previousStats = null) => {
  const multiplier = getStatMultiplier(level);

  // 레벨별 기본 스탯 (배율 적용)
  const baseAttack = Math.floor(level * 40 * multiplier);
  const baseHp = Math.floor(level * 80 * multiplier);
  const baseSpeed = Math.floor(level * 12 * multiplier);

  // 랜덤 변동폭 (배율 적용)
  const attackVariation = Math.floor(level * 15 * multiplier);
  const hpVariation = Math.floor(level * 25 * multiplier);
  const speedVariation = Math.floor(level * 10 * multiplier);

  // 기존 스탯이 있으면 보존하고 추가 (강화 시)
  if (previousStats) {
    // 강화 시 증가량도 배율 적용
    const levelMultiplier = getStatMultiplier(level);
    const attackBonus = Math.floor((40 + secureRandom01() * 30) * levelMultiplier);
    const hpBonus = Math.floor((80 + secureRandom01() * 50) * levelMultiplier);
    const speedBonus = Math.floor((12 + secureRandom01() * 15) * levelMultiplier);
    return {
      attack: previousStats.attack + attackBonus,
      hp: previousStats.hp + hpBonus,
      speed: (previousStats.speed || 0) + speedBonus
    };
  }

  // 신규 아이템 스탯 (0강에서 시작)
  return {
    attack: Math.max(0, baseAttack + Math.floor(secureRandom01() * attackVariation * 2) - attackVariation),
    hp: Math.max(0, baseHp + Math.floor(secureRandom01() * hpVariation * 2) - hpVariation),
    speed: Math.max(0, baseSpeed + Math.floor(secureRandom01() * speedVariation * 2) - speedVariation)
  };
};

export const useEnhance = (initialLevel = 0, initialGold = 50000) => {
  const [level, setLevel] = useState(initialLevel);
  const [itemStats, setItemStats] = useState({ attack: 0, hp: 0, speed: 0 }); // 현재 아이템 스탯
  const [gold, setGold] = useState(initialGold);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [lastRoll, setLastRoll] = useState(null); // 마지막 주사위 값 (투명성)
  const [stats, setStats] = useState({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 });
  const [inventory, setInventory] = useState([]); // 이제 { level, attack, hp } 객체 저장

  // 이벤트 버프 상태
  const [buffs, setBuffs] = useState({
    shield: false,      // 🛡️ 파괴 방지
    freeEnhance: false, // 🎁 무료 강화
    passion: false,     // 🔥 열정 모드 (성공률 2배)
    blessing: false,    // 🌟 축복 (하락 방지)
  });
  const [failStreak, setFailStreak] = useState(0); // 연속 실패 횟수
  const [activeEvent, setActiveEvent] = useState(null); // 현재 발동된 이벤트
  const [eventMultiplier, setEventMultiplier] = useState(1); // 황금찬스 배율

  // 🔥 Firebase에서 불러온 설정
  const [settings, setSettings] = useState({
    successRates: SUCCESS_RATES,
    downgradeRates: DOWNGRADE_RATES,
    destroyRates: DESTROY_RATES,
    enhanceCosts: ENHANCE_COST,
  });

  // 🔥 Firebase에서 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'enhance');
        const snapshot = await getDoc(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({
            successRates: data.successRates || SUCCESS_RATES,
            downgradeRates: data.downgradeRates || DOWNGRADE_RATES,
            destroyRates: data.destroyRates || DESTROY_RATES,
            enhanceCosts: data.enhanceCosts || ENHANCE_COST,
          });
        }
      } catch (err) {
        console.error('설정 불러오기 실패:', err);
      }
    };
    fetchSettings();
  }, []);

  // 🔥 Firebase settings 사용
  const baseSuccessRate = settings.successRates[level] || 1;
  const successRate = buffs.passion ? Math.min(baseSuccessRate * 2, 100) : baseSuccessRate;
  const downgradeRate = settings.downgradeRates[level] || 0;
  const destroyRate = settings.destroyRates[level] || 0;
  const enhanceCost = buffs.freeEnhance ? 0 : (settings.enhanceCosts[level] || 100);
  const canEnhance = !isEnhancing && !isDestroyed && gold >= enhanceCost && level < MAX_LEVEL;

  const getEnhanceTime = (lvl) => {
    if (lvl >= 19) return 5000;
    if (lvl >= 15) return 3000;
    if (lvl >= 10) return 2000;
    if (lvl >= 6) return 1500;
    return 1000;
  };

  const triggerEvent = (eventName, duration = 2500) => {
    setActiveEvent(eventName);
    setTimeout(() => setActiveEvent(null), duration);
  };

  const enhance = useCallback(async () => {
    if (!canEnhance) return null;
    setIsEnhancing(true);
    setResult(null);
    setIsNewRecord(false);

    // 무료 강화 버프 사용
    const wasFree = buffs.freeEnhance;
    if (wasFree) {
      setBuffs(b => ({ ...b, freeEnhance: false }));
    } else {
      setGold((g) => g - enhanceCost);
      setStats((s) => ({ ...s, totalSpent: s.totalSpent + enhanceCost }));
    }

    playEnhanceStart();
    const enhanceTime = getEnhanceTime(level);
    await new Promise((r) => setTimeout(r, enhanceTime));

    const roll = secureRandom();
    setLastRoll(roll.toFixed(2)); // 투명성을 위해 저장
    const currentSuccessRate = buffs.passion ? Math.min(baseSuccessRate * 2, 100) : baseSuccessRate;
    const isSuccess = roll < currentSuccessRate;

    // 열정 모드 사용 후 해제
    if (buffs.passion) {
      setBuffs(b => ({ ...b, passion: false }));
    }

    if (isSuccess) {
      // ⚡ 럭키 강화 체크 (5% 확률로 +2)
      const isLucky = secureRandom01() < 0.05;
      const levelGain = isLucky ? 2 : 1;
      const newLevel = Math.min(level + levelGain, MAX_LEVEL);

      if (isLucky) {
        triggerEvent('lucky');
      }

      // 스탯 업그레이드 (기존 스탯 보존 + 추가)
      const newStats = generateItemStats(newLevel, level > 0 ? itemStats : null);
      // 럭키 강화 시 추가 스탯 보너스
      if (isLucky && levelGain > 1) {
        newStats.attack += Math.floor(newStats.attack * 0.1);
        newStats.hp += Math.floor(newStats.hp * 0.1);
      }
      setItemStats(newStats);

      setLevel(newLevel);
      setFailStreak(0);
      setStats((s) => {
        const isRecord = newLevel > s.maxLevel;
        if (isRecord) setIsNewRecord(true);
        return { ...s, attempts: s.attempts + 1, successes: s.successes + 1, maxLevel: Math.max(s.maxLevel, newLevel) };
      });
      setResult('success');
      playSuccess(newLevel);

      // 🌟 축복 체크 (성공 시 5% 확률)
      if (secureRandom01() < 0.05) {
        setBuffs(b => ({ ...b, blessing: true }));
        setTimeout(() => triggerEvent('blessing'), 500);
      }
    } else {
      // 실패 처리
      setFailStreak(prev => prev + 1);
      const newFailStreak = failStreak + 1;

      // 🔥 열정 모드 체크 (연속 3회 실패)
      if (newFailStreak >= 3) {
        setBuffs(b => ({ ...b, passion: true }));
        setFailStreak(0);
        setTimeout(() => triggerEvent('passion'), 500);
      }

      const destroyRoll = secureRandom();
      const shouldDestroy = destroyRoll < destroyRate;

      // 🛡️ 보호막 체크
      if (shouldDestroy && buffs.shield) {
        setBuffs(b => ({ ...b, shield: false }));
        triggerEvent('shieldUsed');
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('fail');
        playFail();
      } else if (shouldDestroy) {
        setIsDestroyed(true);
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1, destroys: (s.destroys || 0) + 1 }));
        setResult('destroyed');
        playDestroyed();

        // 🛡️ 파괴 후 20% 확률로 보호막 획득
        if (secureRandom01() < 0.2) {
          setBuffs(b => ({ ...b, shield: true }));
          setTimeout(() => triggerEvent('shieldGain'), 1000);
        }
      } else {
        // 🌟 축복 체크 (하락 방지)
        if (buffs.blessing) {
          setBuffs(b => ({ ...b, blessing: false }));
          triggerEvent('blessingUsed');
        } else {
          const downgradeRoll = secureRandom();
          if (downgradeRoll < downgradeRate && level > 0) {
            const newLevel = Math.max(0, level - 1);
            // 레벨 하락 시 스탯도 비례 감소
            if (newLevel > 0) {
              const ratio = newLevel / level;
              setItemStats(prev => ({
                attack: Math.floor(prev.attack * ratio),
                hp: Math.floor(prev.hp * ratio),
                speed: Math.floor((prev.speed || 0) * ratio)
              }));
            } else {
              setItemStats({ attack: 0, hp: 0, speed: 0 });
            }
            setLevel(newLevel);
          }
        }
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('fail');
        playFail();
      }
    }
    setTimeout(() => setIsEnhancing(false), 500);
  }, [canEnhance, level, baseSuccessRate, downgradeRate, destroyRate, enhanceCost, buffs, failStreak, itemStats, settings]);

  const sell = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return;
    let price = getSellPrice(level);
    let multiplier = 1;

    // 스탯 보너스 (좋은 스탯일수록 판매가 증가)
    const expectedAttack = level * 50;
    const expectedHp = level * 100;
    const statBonus = 1 + ((itemStats.attack - expectedAttack) / expectedAttack * 0.1) + ((itemStats.hp - expectedHp) / expectedHp * 0.1);
    price = Math.floor(price * Math.max(0.9, statBonus));

    // 💰 황금 찬스 (10% 확률로 2~5배)
    if (secureRandom01() < 0.1) {
      multiplier = 2 + Math.floor(secureRandom01() * 4); // 2, 3, 4, 5
      setEventMultiplier(multiplier);
      triggerEvent('goldenChance');
    }

    const finalPrice = price * multiplier;
    setGold((g) => g + finalPrice);
    setLastSellPrice(finalPrice);
    setStats((s) => ({ ...s, totalEarned: s.totalEarned + finalPrice }));
    setLevel(0);
    setItemStats({ attack: 0, hp: 0, speed: 0 }); // 스탯 초기화
    setResult('sold');
    playSell();

    // 🎁 무료 강화권 (15% 확률)
    if (secureRandom01() < 0.15) {
      setBuffs(b => ({ ...b, freeEnhance: true }));
      setTimeout(() => triggerEvent('freeEnhance'), 1500);
    }

    setTimeout(() => setResult(null), 1500);
  }, [level, isEnhancing, isDestroyed, itemStats]);

  const reset = useCallback(() => {
    setLevel(0);
    setItemStats({ attack: 0, hp: 0, speed: 0 }); // 스탯 초기화
    setIsDestroyed(false);
    setResult(null);
    setLastSellPrice(null);
  }, []);

  // 💎 잭팟 추가된 addGold (Rate limited)
  const addGold = useCallback((amount) => {
    // Rate limit 체크 (너무 빠른 클릭 방지)
    if (!grindLimiter()) return;

    // 0.1% 확률로 잭팟 (10만G)
    if (secureRandom01() < 0.001) {
      setGold((g) => g + 100000);
      triggerEvent('jackpot');
    } else {
      setGold((g) => g + amount);
    }
  }, []);

  const storeItem = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return false;
    if (inventory.length >= 5) return false;
    // 레벨과 스탯을 함께 저장 (속도 포함)
    setInventory((inv) => [...inv, { level, attack: itemStats.attack, hp: itemStats.hp, speed: itemStats.speed || 0 }]);
    setLevel(0);
    setItemStats({ attack: 0, hp: 0, speed: 0 });
    return true;
  }, [level, itemStats, isEnhancing, isDestroyed, inventory.length]);

  const takeItem = useCallback((index) => {
    if (isEnhancing || isDestroyed) return false;
    if (index < 0 || index >= inventory.length) return false;
    const storedItem = inventory[index];
    setInventory((inv) => {
      const newInv = [...inv];
      if (level > 0) {
        // 현재 아이템을 보관함에 저장
        newInv[index] = { level, attack: itemStats.attack, hp: itemStats.hp, speed: itemStats.speed || 0 };
      } else {
        newInv.splice(index, 1);
      }
      return newInv;
    });
    // 보관된 아이템 꺼내기
    setLevel(storedItem.level || storedItem); // 이전 형식 호환
    setItemStats({
      attack: storedItem.attack || 0,
      hp: storedItem.hp || 0,
      speed: storedItem.speed || 0
    });
    return true;
  }, [level, itemStats, isEnhancing, isDestroyed, inventory]);

  return {
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice, isNewRecord,
    successRate, downgradeRate, destroyRate, enhanceCost, inventory,
    buffs, activeEvent, eventMultiplier, failStreak, lastRoll,
    itemStats, // 현재 아이템 스탯
    canEnhance, enhance, sell, reset, addGold, setResult,
    setGold, setStats, setLevel, setInventory, setBuffs, setItemStats, storeItem, takeItem
  };
};
