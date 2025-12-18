import { useState, useCallback } from 'react';
import { SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST, getSellPrice, MAX_LEVEL } from '../utils/constants';

export const useEnhance = (initialLevel = 0, initialGold = 50000) => {
  const [level, setLevel] = useState(initialLevel);
  const [gold, setGold] = useState(initialGold);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [stats, setStats] = useState({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 });

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
    setGold((g) => g - enhanceCost);
    setStats((s) => ({ ...s, totalSpent: s.totalSpent + enhanceCost }));
    
    const enhanceTime = getEnhanceTime(level);
    await new Promise((r) => setTimeout(r, enhanceTime));

    const roll = Math.random() * 100;
    const isSuccess = roll < successRate;

    if (isSuccess) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setStats((s) => ({ ...s, attempts: s.attempts + 1, successes: s.successes + 1, maxLevel: Math.max(s.maxLevel, newLevel) }));
      setResult('success');
    } else {
      const destroyRoll = Math.random() * 100;
      if (destroyRoll < destroyRate) {
        setIsDestroyed(true);
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('destroyed');
      } else {
        const downgradeRoll = Math.random() * 100;
        if (downgradeRoll < downgradeRate) {
          setLevel((l) => Math.max(0, l - 1));
        }
        setStats((s) => ({ ...s, attempts: s.attempts + 1, failures: s.failures + 1 }));
        setResult('fail');
      }
    }
    setTimeout(() => setIsEnhancing(false), 500);
  }, [canEnhance, level, successRate, downgradeRate, destroyRate, enhanceCost]);

  const sell = useCallback(() => {
    if (isEnhancing || isDestroyed) return;
    const price = getSellPrice(level);
    setGold((g) => g + price);
    setLastSellPrice(price);
    setStats((s) => ({ ...s, totalEarned: s.totalEarned + price }));
    setLevel(0);
    setResult('sold');
    setTimeout(() => setResult(null), 1500);
  }, [level, isEnhancing, isDestroyed]);

  const reset = useCallback(() => {
    setLevel(0);
    setIsDestroyed(false);
    setResult(null);
    setLastSellPrice(null);
  }, []);

  const addGold = useCallback((amount) => setGold((g) => g + amount), []);

  return {
    level, gold, isEnhancing, result, isDestroyed, stats, lastSellPrice,
    successRate, downgradeRate, destroyRate, enhanceCost,
    canEnhance, enhance, sell, reset, addGold, setResult,
    setGold, setStats
  };
};
