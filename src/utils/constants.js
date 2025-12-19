// 강화 확률 테이블 (0~20강) - 극한 하드모드
export const SUCCESS_RATES = {
  0: 90, 1: 85, 2: 80, 3: 70, 4: 60,
  5: 50, 6: 40, 7: 35, 8: 30, 9: 25,
  10: 20, 11: 15, 12: 10, 13: 7, 14: 5,
  15: 3, 16: 1.5, 17: 0.7, 18: 0.3, 19: 0.1, 20: 0.05
};

// 실패 시 하락 확률 (5강부터 시작)
export const DOWNGRADE_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 30, 6: 35, 7: 40, 8: 45, 9: 50,
  10: 55, 11: 60, 12: 65, 13: 70, 14: 75,
  15: 80, 16: 85, 17: 90, 18: 92, 19: 95, 20: 98
};

// 파괴 확률 (8강부터 시작)
export const DESTROY_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 0, 6: 0, 7: 0, 8: 3, 9: 5,
  10: 8, 11: 12, 12: 18, 13: 25, 14: 35,
  15: 45, 16: 55, 17: 65, 18: 75, 19: 85, 20: 95
};

// 강화 비용 (골드) - 초반 완화, 후반 유지
export const ENHANCE_COST = {
  0: 50, 1: 100, 2: 150, 3: 250, 4: 400,
  5: 700, 6: 1200, 7: 2000, 8: 4000, 9: 7000,
  10: 12000, 11: 22000, 12: 40000, 13: 70000, 14: 120000,
  15: 200000, 16: 350000, 17: 600000, 18: 1000000, 19: 1800000, 20: 3000000
};

// 판매 가격 (레벨별 최소~최대 범위) - 전체 상향
export const SELL_PRICE = {
  0: { min: 100, max: 200 },
  1: { min: 300, max: 500 },
  2: { min: 700, max: 1000 },
  3: { min: 1200, max: 1800 },
  4: { min: 2000, max: 3000 },
  5: { min: 4000, max: 6000 },
  6: { min: 7000, max: 10000 },
  7: { min: 12000, max: 18000 },
  8: { min: 22000, max: 32000 },
  9: { min: 40000, max: 55000 },
  10: { min: 80000, max: 110000 },
  11: { min: 150000, max: 200000 },
  12: { min: 280000, max: 380000 },
  13: { min: 500000, max: 700000 },
  14: { min: 900000, max: 1200000 },
  15: { min: 1600000, max: 2200000 },
  16: { min: 3000000, max: 4000000 },
  17: { min: 5500000, max: 7500000 },
  18: { min: 10000000, max: 14000000 },
  19: { min: 20000000, max: 28000000 },
  20: { min: 50000000, max: 70000000 }
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
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000000000000) return sign + (absAmount / 10000000000000000).toFixed(1) + '경';
  if (absAmount >= 1000000000000) return sign + (absAmount / 1000000000000).toFixed(1) + '조';
  if (absAmount >= 100000000) return sign + (absAmount / 100000000).toFixed(1) + '억';
  if (absAmount >= 10000000) return sign + (absAmount / 10000).toFixed(0) + '만';
  if (absAmount >= 10000) return sign + (absAmount / 10000).toFixed(1) + '만';
  return sign + absAmount.toLocaleString();
};

export const MAX_LEVEL = 20;

// 레벨별 아이템 이미지 (public/images/items/ 폴더에 저장)
// 파일명: 0.png, 1.png, 2.png, ... 20.png
export const getItemImage = (level) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}images/items/${level}.png`;
};
