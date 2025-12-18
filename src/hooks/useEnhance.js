import { useState, useCallback } from 'react';
import { SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST, getSellPrice, MAX_LEVEL } from '../utils/constants';
import { playEnhanceStart, playSuccess, playFail, playDestroyed, playSell } from '../utils/sounds';

export const useEnhance = (initialLevel = 0, initialGold = 50000) => {
  const [level, setLevel] = useState(initialLevel);
  const [gold, setGold] = useState(initialGold);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [stats, setStats] = useState({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 });
  const [inventory, setInventory] = useState([]); // 최대 5개 보관

  const successRate = SUCCESS_RATES[level] || 1;
  const downgradeRate = DOWNGRADE_RATES[level] || 0;
  const destroyRate = DESTROY_RATES[level] || 0;
  const enhanceCost = ENHANCE_COST[level] || 100;
  const canEnhance = !isEnhancing && !isDestroyed && gold >= enhanceCost && level < MAX_LEVEL;

  const getEnhanceTime = (lvl) => {
    if (lvl >= 19) return 5000;
    if (lvl >= 15) return 3000;
    if (lvl >= 10) return 2000;
    if (lvl >= 6) return 1500;
    return 1000;
  };

  const enhance = useCallback(async () => {
    if (!canEnhance) return null;
    setIsEnhancing(true);
    setResult(null);
    setIsNewRecord(false);
    setGold((g) => g - enhanceCost);
    setStats((s) => ({ ...s, totalSpent: s.totalSpent + enhanceCost }));

    // 강화 시작 사운드
    playEnhanceStart();

    const enhanceTime = getEnhanceTime(level);
    await new Promise((r) => setTimeout(r, enhanceTime));

    const roll = Math.random() * 100;
    const isSuccess = roll < successRate;

    if (isSuccess) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setStats((s) => {
        const isRecord = newLevel > s.maxLevel;
        if (isRecord) setIsNewRecord(true);
        return { ...s, attempts: s.attempts + 1, successes: s.successes + 1, maxLevel: Math.max(s.maxLevel, newLevel) };
      });
      setResult('success');
      playSuccess(newLevel);
    } else {
      const destroyRoll = Math.random() * 100;
      if (destroyRoll < destroyRate) {
        setIsDestroyed(true);
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('destroyed');
        playDestroyed();
      } else {
        const downgradeRoll = Math.random() * 100;
        if (downgradeRoll < downgradeRate) {
          setLevel((l) => Math.max(0, l - 1));
        }
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('fail');
        playFail();
      }
    }
    setTimeout(() => setIsEnhancing(false), 500);
  }, [canEnhance, level, successRate, downgradeRate, destroyRate, enhanceCost]);

  const sell = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return;
    const price = getSellPrice(level);
    setGold((g) => g + price);
    setLastSellPrice(price);
    setStats((s) => ({ ...s, totalEarned: s.totalEarned + price }));
    setLevel(0);
    setResult('sold');
    playSell();
    setTimeout(() => setResult(null), 1500);
  }, [level, isEnhancing, isDestroyed]);

  const reset = useCallback(() => {
    setLevel(0);
    setIsDestroyed(false);
    setResult(null);
    setLastSellPrice(null);
  }, []);

  const addGold = useCallback((amount) => setGold((g) => g + amount), []);

  // 보관함에 아이템 저장 (최대 5개)
  const storeItem = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return false;
    if (inventory.length >= 5) return false;
    setInventory((inv) => [...inv, level]);
    setLevel(0);
    return true;
  }, [level, isEnhancing, isDestroyed, inventory.length]);

  // 보관함에서 아이템 꺼내기 (현재 아이템과 교체)
  const takeItem = useCallback((index) => {
    if (isEnhancing || isDestroyed) return false;
    if (index < 0 || index >= inventory.length) return false;
    const storedLevel = inventory[index];
    setInventory((inv) => {
      const newInv = [...inv];
      if (level > 0) {
        // 현재 아이템과 교체
        newInv[index] = level;
      } else {
        // 현재 아이템이 없으면 그냥 꺼내기
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
    canEnhance, enhance, sell, reset, addGold, setResult,
    setGold, setStats, setLevel, setInventory, storeItem, takeItem
  };
};
