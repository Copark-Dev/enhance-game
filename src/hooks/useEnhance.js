import { useState, useCallback, useEffect } from 'react';
import { SUCCESS_RATES, DOWNGRADE_RATES, DESTROY_RATES, ENHANCE_COST, getSellPrice, MAX_LEVEL } from '../utils/constants';
import { playEnhanceStart, playSuccess, playFail, playDestroyed, playSell } from '../utils/sounds';
import { db, secureEnhance, secureSell } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

// 강화 시간 계산 (애니메이션용)
const getEnhanceTime = (lvl) => {
  if (lvl >= 19) return 5000;
  if (lvl >= 15) return 3000;
  if (lvl >= 10) return 2000;
  if (lvl >= 6) return 1500;
  return 1000;
};

export const useEnhance = (initialLevel = 0, initialGold = 50000) => {
  const [level, setLevel] = useState(initialLevel);
  const [itemStats, setItemStats] = useState({ attack: 0, hp: 0, speed: 0 });
  const [gold, setGold] = useState(initialGold);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [stats, setStats] = useState({ attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 });
  const [inventory, setInventory] = useState([]);

  const [buffs, setBuffs] = useState({
    shield: false,
    freeEnhance: false,
    passion: false,
    blessing: false,
  });
  const [failStreak, setFailStreak] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventMultiplier, setEventMultiplier] = useState(1);

  const [settings, setSettings] = useState({
    successRates: SUCCESS_RATES,
    downgradeRates: DOWNGRADE_RATES,
    destroyRates: DESTROY_RATES,
    enhanceCosts: ENHANCE_COST,
  });

  // Firebase에서 설정 불러오기
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

  const baseSuccessRate = settings.successRates[level] || 1;
  const successRate = buffs.passion ? Math.min(baseSuccessRate * 2, 100) : baseSuccessRate;
  const downgradeRate = settings.downgradeRates[level] || 0;
  const destroyRate = settings.destroyRates[level] || 0;
  const enhanceCost = buffs.freeEnhance ? 0 : (settings.enhanceCosts[level] || 100);
  const canEnhance = !isEnhancing && !isDestroyed && gold >= enhanceCost && level < MAX_LEVEL;

  const triggerEvent = (eventName, duration = 2500) => {
    setActiveEvent(eventName);
    setTimeout(() => setActiveEvent(null), duration);
  };

  // 🔒 서버 기반 강화 (Cloud Function 호출)
  const enhance = useCallback(async () => {
    if (!canEnhance) return null;
    setIsEnhancing(true);
    setResult(null);
    setIsNewRecord(false);

    playEnhanceStart();
    const enhanceTime = getEnhanceTime(level);

    try {
      // 서버에 강화 요청 (애니메이션과 병렬 실행)
      const [serverResult] = await Promise.all([
        secureEnhance({}),
        new Promise((r) => setTimeout(r, enhanceTime))
      ]);

      const data = serverResult.data;

      // 골드, 스탯, 버프는 즉시 업데이트 (이미지에 영향 없음)
      setGold(data.gold);
      setStats(data.stats);
      setBuffs(data.buffs);
      setLastRoll(data.roll);

      if (data.isNewRecord) {
        setIsNewRecord(true);
      }

      // 결과에 따른 사운드 및 이벤트
      if (data.result === 'success' || data.result === 'lucky') {
        if (data.result === 'lucky') {
          triggerEvent('lucky');
        }
        setResult('success');
        playSuccess(data.level);

        // 성공 후 잠시 대기 후 레벨/이미지 업데이트 (스포일러 방지)
        setTimeout(() => {
          setLevel(data.level);
          setItemStats(data.itemStats);
        }, 300);

        // 축복 획득 체크
        if (data.buffs.blessing && !buffs.blessing) {
          setTimeout(() => triggerEvent('blessing'), 500);
        }
        setFailStreak(0);
      } else if (data.result === 'destroyed') {
        setResult('destroyed');
        playDestroyed();

        // 파괴 후 잠시 대기 후 상태 업데이트
        setTimeout(() => {
          setIsDestroyed(true);
          setLevel(data.level);
          setItemStats(data.itemStats);
        }, 300);

        // 보호막 획득 체크
        if (data.buffs.shield && !buffs.shield) {
          setTimeout(() => triggerEvent('shieldGain'), 1000);
        }
      } else if (data.result === 'shieldUsed') {
        triggerEvent('shieldUsed');
        setResult('fail');
        playFail();
        // 레벨 변화 없음
      } else if (data.result === 'blessingUsed') {
        triggerEvent('blessingUsed');
        setResult('fail');
        playFail();
        // 레벨 변화 없음
      } else if (data.result === 'downgrade') {
        setResult('fail');
        playFail();

        // 하락 후 잠시 대기 후 레벨 업데이트
        setTimeout(() => {
          setLevel(data.level);
          setItemStats(data.itemStats);
        }, 300);

        // 열정 모드 체크
        if (data.buffs.passion && !buffs.passion) {
          setTimeout(() => triggerEvent('passion'), 500);
        }
      } else {
        // 단순 실패 (레벨 변화 없음)
        setResult('fail');
        playFail();

        if (data.buffs.passion && !buffs.passion) {
          setTimeout(() => triggerEvent('passion'), 500);
        }
      }

      setTimeout(() => setIsEnhancing(false), 500);
      return data;

    } catch (error) {
      console.error('강화 실패:', error);
      setIsEnhancing(false);

      // 에러 처리
      if (error.code === 'functions/resource-exhausted') {
        alert('너무 빠른 강화 시도입니다. 잠시 후 다시 시도해주세요.');
      } else if (error.code === 'functions/unauthenticated') {
        alert('로그인이 필요합니다.');
      } else {
        alert(error.message || '강화 중 오류가 발생했습니다.');
      }
      return null;
    }
  }, [canEnhance, level, buffs]);

  // 🔒 서버 기반 판매 (Cloud Function 호출)
  const sell = useCallback(async () => {
    if (isEnhancing || isDestroyed || level === 0) return;

    try {
      const serverResult = await secureSell({});
      const data = serverResult.data;

      // 황금 찬스 이벤트
      if (data.goldenChance) {
        setEventMultiplier(data.multiplier);
        triggerEvent('goldenChance');
      }

      // 무료 강화권 획득
      if (data.freeEnhanceGained) {
        setTimeout(() => triggerEvent('freeEnhance'), 1500);
      }

      // 상태 업데이트
      setGold(data.newGold);
      setLastSellPrice(data.price);
      setLevel(0);
      setItemStats({ attack: 0, hp: 0, speed: 0 });
      setStats(s => ({ ...s, totalEarned: s.totalEarned + data.price }));

      if (data.freeEnhanceGained) {
        setBuffs(b => ({ ...b, freeEnhance: true }));
      }

      setResult('sold');
      playSell();

      setTimeout(() => setResult(null), 1500);

    } catch (error) {
      console.error('판매 실패:', error);
      alert(error.message || '판매 중 오류가 발생했습니다.');
    }
  }, [level, isEnhancing, isDestroyed]);

  const reset = useCallback(() => {
    setLevel(0);
    setItemStats({ attack: 0, hp: 0, speed: 0 });
    setIsDestroyed(false);
    setResult(null);
    setLastSellPrice(null);
  }, []);

  const addGold = useCallback((amount) => {
    setGold((g) => g + amount);
  }, []);

  const storeItem = useCallback(() => {
    if (isEnhancing || isDestroyed || level === 0) return false;
    if (inventory.length >= 5) return false;
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
        newInv[index] = { level, attack: itemStats.attack, hp: itemStats.hp, speed: itemStats.speed || 0 };
      } else {
        newInv.splice(index, 1);
      }
      return newInv;
    });
    setLevel(storedItem.level || storedItem);
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
    itemStats,
    canEnhance, enhance, sell, reset, addGold, setResult,
    setGold, setStats, setLevel, setInventory, setBuffs, setItemStats, setIsDestroyed, storeItem, takeItem
  };
};
