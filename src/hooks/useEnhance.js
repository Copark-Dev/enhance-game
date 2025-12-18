import { useState, useCallback } from 'react';
import { SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST, getSellPrice, MAX_LEVEL } from '../utils/constants';
import { playEnhanceStart, playSuccess, playFail, playDestroyed, playSell } from '../utils/sounds';

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

export const useEnhance = (initialLevel = 0, initialGold = 50000) => {
  const [level, setLevel] = useState(initialLevel);
  const [gold, setGold] = useState(initialGold);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [lastRoll, setLastRoll] = useState(null); // 마지막 주사위 값 (투명성)
  const [stats, setStats] = useState({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 });
  const [inventory, setInventory] = useState([]);

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

  const baseSuccessRate = SUCCESS_RATES[level] || 1;
  const successRate = buffs.passion ? Math.min(baseSuccessRate * 2, 100) : baseSuccessRate;
  const downgradeRate = DOWNGRADE_RATES[level] || 0;
  const destroyRate = DESTROY_RATES[level] || 0;
  const enhanceCost = buffs.freeEnhance ? 0 : (ENHANCE_COST[level] || 100);
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
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
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
          if (downgradeRoll < downgradeRate) {
            setLevel((l) => Math.max(0, l - 1));
          }
        }
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('fail');
        playFail();
      }
    }
    setTimeout(() => setIsEnhancing(false), 500);
  }, [canEnhance, level, baseSuccessRate, downgradeRate, destroyRate, enhanceCost, buffs, failStreak]);

  const sell = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return;
    let price = getSellPrice(level);
    let multiplier = 1;

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
    setResult('sold');
    playSell();

    // 🎁 무료 강화권 (15% 확률)
    if (secureRandom01() < 0.15) {
      setBuffs(b => ({ ...b, freeEnhance: true }));
      setTimeout(() => triggerEvent('freeEnhance'), 1500);
    }

    setTimeout(() => setResult(null), 1500);
  }, [level, isEnhancing, isDestroyed]);

  const reset = useCallback(() => {
    setLevel(0);
    setIsDestroyed(false);
    setResult(null);
    setLastSellPrice(null);
  }, []);

  // 💎 잭팟 추가된 addGold
  const addGold = useCallback((amount) => {
    // 0.1% 확률로 잭팟
    if (secureRandom01() < 0.001) {
      setGold((g) => g + 10000);
      triggerEvent('jackpot');
    } else {
      setGold((g) => g + amount);
    }
  }, []);

  const storeItem = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return false;
    if (inventory.length >= 5) return false;
    setInventory((inv) => [...inv, level]);
    setLevel(0);
    return true;
  }, [level, isEnhancing, isDestroyed, inventory.length]);

  const takeItem = useCallback((index) => {
    if (isEnhancing || isDestroyed) return false;
    if (index < 0 || index >= inventory.length) return false;
    const storedLevel = inventory[index];
    setInventory((inv) => {
      const newInv = [...inv];
      if (level > 0) {
        newInv[index] = level;
      } else {
        newInv.splice(index, 1);
      }
      return newInv;
    });
    setLevel(storedLevel);
    return true;
  }, [level, isEnhancing, isDestroyed, inventory]);

  return {
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice, isNewRecord,
    successRate, downgradeRate, destroyRate, enhanceCost, inventory,
    buffs, activeEvent, eventMultiplier, failStreak, lastRoll,
    canEnhance, enhance, sell, reset, addGold, setResult,
    setGold, setStats, setLevel, setInventory, setBuffs, storeItem, takeItem
  };
};
