// 강화 확률 테이블 (0~20강)
export const SUCCESS_RATES = {
  0: 95, 1: 90, 2: 85, 3: 80, 4: 75,
  5: 70, 6: 65, 7: 60, 8: 55, 9: 50,
  10: 45, 11: 40, 12: 35, 13: 30, 14: 25,
  15: 20, 16: 15, 17: 10, 18: 7, 19: 5, 20: 3
};

// 실패 시 하락 확률 (1강부터 시작)
export const DOWNGRADE_RATES = {
  0: 0,
  1: 10, 2: 15, 3: 20, 4: 25,
  5: 30, 6: 40, 7: 50, 8: 60, 9: 70,
  10: 80, 11: 85, 12: 90, 13: 95, 14: 100,
  15: 100, 16: 100, 17: 100, 18: 100, 19: 100, 20: 100
};

// 파괴 확률 (3강부터 시작)
export const DESTROY_RATES = {
  0: 0, 1: 0, 2: 0,
  3: 0.5, 4: 1, 5: 1.5, 6: 2, 7: 3, 8: 4, 9: 5,
  10: 7, 11: 10, 12: 13, 13: 17, 14: 22,
  15: 28, 16: 35, 17: 42, 18: 50, 19: 60, 20: 70
};

// 강화 비용 (골드)
export const ENHANCE_COST = {
  0: 100, 1: 200, 2: 400, 3: 800, 4: 1500,
  5: 3000, 6: 5000, 7: 8000, 8: 12000, 9: 18000,
  10: 30000, 11: 50000, 12: 80000, 13: 120000, 14: 180000,
  15: 300000, 16: 500000, 17: 800000, 18: 1500000, 19: 3000000, 20: 5000000
};

// 판매 가격 (레벨별 최소~최대 범위)
export const SELL_PRICE = {
  0: { min: 50, max: 100 },
  1: { min: 150, max: 300 },
  2: { min: 400, max: 700 },
  3: { min: 1000, max: 1800 },
  4: { min: 2500, max: 4000 },
  5: { min: 5000, max: 8000 },
  6: { min: 10000, max: 16000 },
  7: { min: 20000, max: 32000 },
  8: { min: 40000, max: 60000 },
  9: { min: 70000, max: 100000 },
  10: { min: 120000, max: 180000 },
  11: { min: 200000, max: 300000 },
  12: { min: 350000, max: 500000 },
  13: { min: 600000, max: 900000 },
  14: { min: 1000000, max: 1500000 },
  15: { min: 2000000, max: 3000000 },
  16: { min: 4000000, max: 6000000 },
  17: { min: 8000000, max: 12000000 },
  18: { min: 18000000, max: 25000000 },
  19: { min: 40000000, max: 60000000 },
  20: { min: 100000000, max: 150000000 }
};

export const getSellPrice = (level) => {
  const range = SELL_PRICE[level] || { min: 0, max: 0 };
  return Math.floor(range.min + Math.random() * (range.max - range.min));
};

export const LEVEL_COLORS = {
  normal: '#AAAAAA',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
  mythic: '#F44336',
  transcendent: '#E91E63'
};

export const getLevelColor = (level) => {
  if (level >= 18) return LEVEL_COLORS.transcendent;
  if (level >= 15) return LEVEL_COLORS.mythic;
  if (level >= 12) return LEVEL_COLORS.legendary;
  if (level >= 9) return LEVEL_COLORS.epic;
  if (level >= 6) return LEVEL_COLORS.rare;
  if (level >= 3) return LEVEL_COLORS.uncommon;
  return LEVEL_COLORS.normal;
};

export const getLevelTier = (level) => {
  if (level >= 18) return '초월';
  if (level >= 15) return '신화';
  if (level >= 12) return '전설';
  if (level >= 9) return '영웅';
  if (level >= 6) return '희귀';
  if (level >= 3) return '고급';
  return '일반';
};

export const getEffectIntensity = (level) => {
  if (level >= 18) return 5;
  if (level >= 15) return 4;
  if (level >= 12) return 3;
  if (level >= 9) return 2;
  if (level >= 6) return 1;
  return 0;
};

export const formatGold = (amount) => {
  if (amount >= 100000000) return (amount / 100000000).toFixed(1) + '억';
  if (amount >= 10000000) return (amount / 10000).toFixed(0) + '만';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '만';
  return amount.toLocaleString();
};

export const MAX_LEVEL = 20;

// 레벨별 아이템 이미지 (public/images/items/ 폴더에 저장)
// 파일명: 0.png, 1.png, 2.png, ... 20.png
export const getItemImage = (level) => {
  return `/images/items/${level}.png`;
};
