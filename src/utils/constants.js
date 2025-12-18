// 강화 확률 테이블 (0~20강) - RPG 스타일
export const SUCCESS_RATES = {
  0: 100, 1: 100, 2: 100, 3: 95, 4: 90,
  5: 85, 6: 80, 7: 75, 8: 65, 9: 55,
  10: 45, 11: 35, 12: 30, 13: 25, 14: 20,
  15: 15, 16: 10, 17: 7, 18: 5, 19: 3, 20: 1
};

// 실패 시 하락 확률 (5강부터 시작)
export const DOWNGRADE_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 30, 6: 40, 7: 50, 8: 60, 9: 70,
  10: 80, 11: 85, 12: 90, 13: 95, 14: 100,
  15: 100, 16: 100, 17: 100, 18: 100, 19: 100, 20: 100
};

// 파괴 확률 (8강부터 시작)
export const DESTROY_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 0, 6: 0, 7: 0, 8: 1, 9: 2,
  10: 3, 11: 5, 12: 7, 13: 10, 14: 14,
  15: 18, 16: 23, 17: 30, 18: 40, 19: 50, 20: 60
};

// 강화 비용 (골드) - 적정량으로 조정
export const ENHANCE_COST = {
  0: 100, 1: 200, 2: 300, 3: 500, 4: 800,
  5: 1200, 6: 2000, 7: 3500, 8: 6000, 9: 10000,
  10: 18000, 11: 30000, 12: 50000, 13: 80000, 14: 130000,
  15: 200000, 16: 350000, 17: 600000, 18: 1000000, 19: 1800000, 20: 3000000
};

// 판매 가격 (레벨별 최소~최대 범위) - 적정량으로 조정
export const SELL_PRICE = {
  0: { min: 50, max: 100 },
  1: { min: 150, max: 250 },
  2: { min: 350, max: 500 },
  3: { min: 700, max: 1000 },
  4: { min: 1500, max: 2200 },
  5: { min: 3000, max: 4500 },
  6: { min: 6000, max: 9000 },
  7: { min: 12000, max: 18000 },
  8: { min: 25000, max: 38000 },
  9: { min: 50000, max: 75000 },
  10: { min: 100000, max: 150000 },
  11: { min: 180000, max: 270000 },
  12: { min: 320000, max: 480000 },
  13: { min: 550000, max: 820000 },
  14: { min: 900000, max: 1350000 },
  15: { min: 1600000, max: 2400000 },
  16: { min: 3000000, max: 4500000 },
  17: { min: 5500000, max: 8200000 },
  18: { min: 10000000, max: 15000000 },
  19: { min: 20000000, max: 30000000 },
  20: { min: 50000000, max: 75000000 }
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

// 레벨별 이름
export const LEVEL_NAMES = {
  0: '노말진기', 1: '진미', 2: '진모', 3: '진루', 4: '진드라',
  5: '진르반', 6: '진렌', 7: '진리', 8: '진리스', 9: '진리오',
  10: '진리츠크랭크', 11: '진라가스', 12: '진네', 13: '진스오', 14: '진웨이',
  15: '베진', 16: '진스포츈', 17: '럭진', 18: '진서스', 19: '자진', 20: '진들스틱'
};

export const getLevelTier = (level) => {
  return LEVEL_NAMES[level] || '노말진기';
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
  const base = import.meta.env.BASE_URL || '/';
  return `${base}images/items/${level}.png`;
};
