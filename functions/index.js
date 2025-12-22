const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const https = require('https');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();
const region = 'asia-northeast3';

// ============================================
// 카카오 토큰 검증 및 Firebase Custom Token 발급
// ============================================
exports.verifyKakaoToken = onCall({ region }, async (request) => {
  const { accessToken } = request.data;

  if (!accessToken) {
    throw new HttpsError('invalid-argument', '액세스 토큰이 필요합니다.');
  }

  try {
    // 카카오 API로 토큰 검증
    const kakaoUser = await verifyKakaoAccessToken(accessToken);

    if (!kakaoUser || !kakaoUser.id) {
      throw new HttpsError('unauthenticated', '카카오 인증 실패');
    }

    const kakaoUserId = kakaoUser.id.toString();
    const nickname = kakaoUser.properties?.nickname || '사용자';
    const profileImage = kakaoUser.properties?.profile_image || null;
    const email = kakaoUser.kakao_account?.email || null;

    // Firebase Custom Token 생성
    const customToken = await admin.auth().createCustomToken(kakaoUserId, {
      provider: 'kakao',
      nickname: nickname
    });

    // Firestore에 사용자 정보 저장/업데이트
    const userRef = db.collection('users').doc(kakaoUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // 신규 사용자
      await userRef.set({
        id: kakaoUserId,
        nickname: nickname,
        profileImage: profileImage,
        email: email,
        gold: 50000,
        level: 0,
        itemStats: { attack: 0, hp: 0, speed: 0 },
        stats: { attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 },
        buffs: {},
        inventory: [],
        isDestroyed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 기존 사용자 - 로그인 정보만 업데이트
      await userRef.update({
        nickname: nickname,
        profileImage: profileImage,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      customToken: customToken,
      user: {
        id: kakaoUserId,
        nickname: nickname,
        profileImage: profileImage,
        email: email
      }
    };
  } catch (error) {
    console.error('카카오 인증 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '인증 처리 중 오류가 발생했습니다.');
  }
});

// 카카오 액세스 토큰 검증 함수
function verifyKakaoAccessToken(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kapi.kakao.com',
      path: '/v2/user/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(parsed);
          } else {
            reject(new Error(`Kakao API error: ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ============================================
// 보안 상수 정의
// ============================================
const MAX_LEVEL = 20;
const MAX_GOLD = 999999999; // 최대 골드 한도
const MIN_GOLD = 0;
const RATE_LIMIT_MS = 500; // 강화 간 최소 간격 (500ms)

// 기본 강화 확률 테이블 (Firestore 설정이 없을 때 사용)
const DEFAULT_SUCCESS_RATES = {
  0: 100, 1: 85, 2: 80, 3: 70, 4: 60,
  5: 50, 6: 40, 7: 35, 8: 30, 9: 25,
  10: 20, 11: 15, 12: 10, 13: 7, 14: 5,
  15: 3, 16: 1.5, 17: 0.7, 18: 0.3, 19: 0.1, 20: 0.05
};

const DEFAULT_DOWNGRADE_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 30, 6: 35, 7: 40, 8: 45, 9: 50,
  10: 55, 11: 60, 12: 65, 13: 70, 14: 75,
  15: 80, 16: 85, 17: 90, 18: 92, 19: 95, 20: 98
};

const DEFAULT_DESTROY_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
  5: 0, 6: 0, 7: 0, 8: 3, 9: 5,
  10: 8, 11: 12, 12: 18, 13: 25, 14: 35,
  15: 45, 16: 55, 17: 65, 18: 75, 19: 85, 20: 95
};

const DEFAULT_ENHANCE_COST = {
  0: 50, 1: 100, 2: 150, 3: 250, 4: 400,
  5: 700, 6: 1200, 7: 2000, 8: 4000, 9: 7000,
  10: 12000, 11: 22000, 12: 40000, 13: 70000, 14: 120000,
  15: 200000, 16: 350000, 17: 600000, 18: 1000000, 19: 1800000, 20: 3000000
};

const DEFAULT_SELL_PRICE = {
  0: { min: 25, max: 40 },
  1: { min: 60, max: 85 },
  2: { min: 140, max: 200 },
  3: { min: 280, max: 400 },
  4: { min: 500, max: 720 },
  5: { min: 900, max: 1300 },
  6: { min: 1600, max: 2300 },
  7: { min: 2800, max: 4000 },
  8: { min: 5000, max: 7200 },
  9: { min: 10000, max: 14000 },
  10: { min: 20000, max: 28000 },
  11: { min: 45000, max: 65000 },
  12: { min: 120000, max: 170000 },
  13: { min: 250000, max: 350000 },
  14: { min: 480000, max: 680000 },
  15: { min: 900000, max: 1300000 },
  16: { min: 1800000, max: 2500000 },
  17: { min: 3500000, max: 5000000 },
  18: { min: 7000000, max: 10000000 },
  19: { min: 14000000, max: 20000000 },
  20: { min: 35000000, max: 50000000 }
};

// Firestore에서 설정 불러오기
const getEnhanceSettings = async () => {
  try {
    const settingsRef = db.collection('settings').doc('enhance');
    const snapshot = await settingsRef.get();
    if (snapshot.exists) {
      const data = snapshot.data();
      return {
        successRates: data.successRates || DEFAULT_SUCCESS_RATES,
        downgradeRates: data.downgradeRates || DEFAULT_DOWNGRADE_RATES,
        destroyRates: data.destroyRates || DEFAULT_DESTROY_RATES,
        enhanceCosts: data.enhanceCosts || DEFAULT_ENHANCE_COST,
        sellPrices: data.sellPrices || DEFAULT_SELL_PRICE
      };
    }
  } catch (err) {
    console.error('설정 불러오기 실패:', err);
  }
  return {
    successRates: DEFAULT_SUCCESS_RATES,
    downgradeRates: DEFAULT_DOWNGRADE_RATES,
    destroyRates: DEFAULT_DESTROY_RATES,
    enhanceCosts: DEFAULT_ENHANCE_COST,
    sellPrices: DEFAULT_SELL_PRICE
  };
};

// ============================================
// 유틸리티 함수
// ============================================
const secureRandom = () => {
  const array = new Uint32Array(1);
  crypto.randomFillSync(array);
  return (array[0] / 4294967295) * 100;
};

const secureRandom01 = () => {
  const array = new Uint32Array(1);
  crypto.randomFillSync(array);
  return array[0] / 4294967295;
};

const getStatMultiplier = (level) => {
  if (level >= 18) return 5.0;
  if (level >= 15) return 3.5;
  if (level >= 12) return 2.5;
  if (level >= 9) return 1.8;
  if (level >= 6) return 1.3;
  if (level >= 3) return 1.1;
  return 1.0;
};

const generateItemStats = (level, previousStats = null) => {
  const multiplier = getStatMultiplier(level);
  const baseAttack = Math.floor(level * 40 * multiplier);
  const baseHp = Math.floor(level * 80 * multiplier);
  const baseSpeed = Math.floor(level * 12 * multiplier);

  if (previousStats) {
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

  const attackVariation = Math.floor(level * 15 * multiplier);
  const hpVariation = Math.floor(level * 25 * multiplier);
  const speedVariation = Math.floor(level * 10 * multiplier);

  return {
    attack: Math.max(0, baseAttack + Math.floor(secureRandom01() * attackVariation * 2) - attackVariation),
    hp: Math.max(0, baseHp + Math.floor(secureRandom01() * hpVariation * 2) - hpVariation),
    speed: Math.max(0, baseSpeed + Math.floor(secureRandom01() * speedVariation * 2) - speedVariation)
  };
};

// ============================================
// 보안 강화 함수 (Callable)
// ============================================
exports.secureEnhance = onCall({ region }, async (request) => {
  // 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  // 인증된 사용자 ID 사용 (클라이언트 조작 불가)
  const userId = request.auth.uid;
  const userRef = db.collection('users').doc(userId);

  // Firestore에서 설정 불러오기 (트랜잭션 전에)
  const settings = await getEnhanceSettings();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentLevel = userData.level || 0;
      const currentGold = userData.gold || 0;
      const itemStats = userData.itemStats || { attack: 0, hp: 0, speed: 0 };
      const stats = userData.stats || { attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 };
      const buffs = userData.buffs || {};
      const lastEnhanceTime = userData.lastEnhanceTime || 0;

      // 레이트 리밋 체크
      const now = Date.now();
      if (now - lastEnhanceTime < RATE_LIMIT_MS) {
        throw new HttpsError('resource-exhausted', '너무 빠른 강화 시도입니다.');
      }

      // 파괴 상태 체크
      if (userData.isDestroyed) {
        throw new HttpsError('failed-precondition', '아이템이 파괴되었습니다.');
      }

      // 최대 레벨 체크
      if (currentLevel >= MAX_LEVEL) {
        throw new HttpsError('failed-precondition', '최대 레벨입니다.');
      }

      // 비용 계산 (Firestore 설정 사용)
      const enhanceCost = buffs.freeEnhance ? 0 : (settings.enhanceCosts[currentLevel] || 100);

      // 골드 체크
      if (currentGold < enhanceCost) {
        throw new HttpsError('failed-precondition', '골드가 부족합니다.');
      }

      // 강화 로직 실행 (Firestore 설정 사용)
      const roll = secureRandom();
      const baseSuccessRate = settings.successRates[currentLevel] || 1;
      const successRate = buffs.passion ? Math.min(baseSuccessRate * 2, 100) : baseSuccessRate;
      const isSuccess = roll < successRate;

      const updateData = {
        lastEnhanceTime: now,
        gold: currentGold - enhanceCost,
      };

      // 버프 소모
      const newBuffs = { ...buffs };
      if (buffs.freeEnhance) {
        newBuffs.freeEnhance = false;
      }
      if (buffs.passion) {
        newBuffs.passion = false;
      }

      let resultType = '';
      let newLevel = currentLevel;
      let newItemStats = itemStats;
      let isNewRecord = false;
      let newStats = { ...stats, attempts: stats.attempts + 1, totalSpent: stats.totalSpent + enhanceCost };

      if (isSuccess) {
        // 성공
        const isLucky = secureRandom01() < 0.05;
        const levelGain = isLucky ? 2 : 1;
        newLevel = Math.min(currentLevel + levelGain, MAX_LEVEL);
        newItemStats = generateItemStats(newLevel, currentLevel > 0 ? itemStats : null);

        if (isLucky && levelGain > 1) {
          newItemStats.attack += Math.floor(newItemStats.attack * 0.1);
          newItemStats.hp += Math.floor(newItemStats.hp * 0.1);
        }

        newStats.successes = stats.successes + 1;
        if (newLevel > stats.maxLevel) {
          newStats.maxLevel = newLevel;
          isNewRecord = true;
        }

        // 축복 버프 획득 확률
        if (secureRandom01() < 0.05) {
          newBuffs.blessing = true;
        }

        resultType = isLucky ? 'lucky' : 'success';
      } else {
        // 실패
        newStats.failures = stats.failures + 1;
        const destroyRoll = secureRandom();
        const destroyRate = settings.destroyRates[currentLevel] || 0;

        if (destroyRoll < destroyRate) {
          // 파괴
          if (buffs.shield) {
            newBuffs.shield = false;
            resultType = 'shieldUsed';
          } else {
            updateData.isDestroyed = true;
            newStats.destroys = (stats.destroys || 0) + 1;
            resultType = 'destroyed';

            // 파괴 후 보호막 획득 확률
            if (secureRandom01() < 0.2) {
              newBuffs.shield = true;
            }
          }
        } else {
          // 하락 체크
          const downgradeRoll = secureRandom();
          const downgradeRate = settings.downgradeRates[currentLevel] || 0;

          if (downgradeRoll < downgradeRate && currentLevel > 0) {
            if (buffs.blessing) {
              newBuffs.blessing = false;
              resultType = 'blessingUsed';
            } else {
              newLevel = Math.max(0, currentLevel - 1);
              if (newLevel > 0) {
                const ratio = newLevel / currentLevel;
                newItemStats = {
                  attack: Math.floor(itemStats.attack * ratio),
                  hp: Math.floor(itemStats.hp * ratio),
                  speed: Math.floor((itemStats.speed || 0) * ratio)
                };
              } else {
                newItemStats = { attack: 0, hp: 0, speed: 0 };
              }
              resultType = 'downgrade';
            }
          } else {
            resultType = 'fail';
          }
        }

        // 연속 실패 시 열정 모드
        const failStreak = (userData.failStreak || 0) + 1;
        if (failStreak >= 3) {
          newBuffs.passion = true;
          updateData.failStreak = 0;
        } else {
          updateData.failStreak = failStreak;
        }
      }

      // 성공 시 연속 실패 초기화
      if (isSuccess) {
        updateData.failStreak = 0;
      }

      updateData.level = newLevel;
      updateData.itemStats = newItemStats;
      updateData.stats = newStats;
      updateData.buffs = newBuffs;

      transaction.update(userRef, updateData);

      return {
        success: true,
        result: resultType,
        level: newLevel,
        itemStats: newItemStats,
        gold: updateData.gold,
        stats: newStats,
        buffs: newBuffs,
        isNewRecord,
        roll: roll.toFixed(2)
      };
    });

    return result;
  } catch (error) {
    console.error('강화 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '강화 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 보안 판매 함수 (Callable)
// ============================================
exports.secureSell = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  // 인증된 사용자 ID 사용
  const userId = request.auth.uid;
  const userRef = db.collection('users').doc(userId);

  // Firestore에서 설정 불러오기 (트랜잭션 전에)
  const settings = await getEnhanceSettings();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentLevel = userData.level || 0;
      const currentGold = userData.gold || 0;
      const itemStats = userData.itemStats || { attack: 0, hp: 0, speed: 0 };
      const stats = userData.stats || {};
      const buffs = userData.buffs || {};

      if (userData.isDestroyed || currentLevel === 0) {
        throw new HttpsError('failed-precondition', '판매할 아이템이 없습니다.');
      }

      // 판매가 계산 (Firestore 설정 사용)
      const priceRange = settings.sellPrices[currentLevel] || { min: 0, max: 0 };
      let price = priceRange.min + Math.floor(secureRandom01() * (priceRange.max - priceRange.min));

      // 스탯 보너스
      const expectedAttack = currentLevel * 50;
      const expectedHp = currentLevel * 100;
      const statBonus = 1 + ((itemStats.attack - expectedAttack) / expectedAttack * 0.1) + ((itemStats.hp - expectedHp) / expectedHp * 0.1);
      price = Math.floor(price * Math.max(0.9, statBonus));

      // 황금 찬스
      let multiplier = 1;
      let goldenChance = false;
      if (secureRandom01() < 0.1) {
        multiplier = 2 + Math.floor(secureRandom01() * 4);
        goldenChance = true;
      }

      const finalPrice = price * multiplier;
      const newGold = Math.min(currentGold + finalPrice, MAX_GOLD);

      // 무료 강화권 획득 확률
      const newBuffs = { ...buffs };
      let freeEnhanceGained = false;
      if (secureRandom01() < 0.15) {
        newBuffs.freeEnhance = true;
        freeEnhanceGained = true;
      }

      transaction.update(userRef, {
        level: 0,
        itemStats: { attack: 0, hp: 0, speed: 0 },
        gold: newGold,
        buffs: newBuffs,
        'stats.totalEarned': (stats.totalEarned || 0) + finalPrice
      });

      return {
        success: true,
        soldLevel: currentLevel,
        price: finalPrice,
        multiplier,
        goldenChance,
        freeEnhanceGained,
        newGold
      };
    });

    return result;
  } catch (error) {
    console.error('판매 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '판매 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 보안 골드 선물 함수 (Callable)
// ============================================
exports.secureSendGold = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  // 발신자는 인증된 사용자 ID 사용 (조작 불가)
  const senderId = request.auth.uid;
  const { recipientId, amount } = request.data;

  if (!recipientId || !amount) {
    throw new HttpsError('invalid-argument', '필수 정보가 누락되었습니다.');
  }

  if (senderId === recipientId) {
    throw new HttpsError('invalid-argument', '자신에게 선물할 수 없습니다.');
  }

  if (typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
    throw new HttpsError('invalid-argument', '유효하지 않은 금액입니다. (최대 1,000만G)');
  }

  const senderRef = db.collection('users').doc(senderId);
  const recipientRef = db.collection('users').doc(recipientId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const senderDoc = await transaction.get(senderRef);
      const recipientDoc = await transaction.get(recipientRef);

      if (!senderDoc.exists) {
        throw new HttpsError('not-found', '발신자를 찾을 수 없습니다.');
      }
      if (!recipientDoc.exists) {
        throw new HttpsError('not-found', '수신자를 찾을 수 없습니다.');
      }

      const senderData = senderDoc.data();
      const recipientData = recipientDoc.data();

      if ((senderData.gold || 0) < amount) {
        throw new HttpsError('failed-precondition', '골드가 부족합니다.');
      }

      const senderNewGold = senderData.gold - amount;
      const recipientNewGold = Math.min((recipientData.gold || 0) + amount, MAX_GOLD);

      transaction.update(senderRef, { gold: senderNewGold });
      transaction.update(recipientRef, { gold: recipientNewGold });

      // 선물 알림 저장
      const notificationRef = db.collection('giftNotifications').doc();
      transaction.set(notificationRef, {
        recipientId,
        senderId,
        senderNickname: senderData.nickname,
        senderProfileImage: senderData.profileImage,
        amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      return {
        success: true,
        senderNewGold,
        recipientNewGold,
        amount
      };
    });

    return result;
  } catch (error) {
    console.error('골드 선물 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '선물 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 보안 일일 보상 함수 (Callable)
// ============================================
exports.secureClaimDailyReward = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  // 인증된 사용자 ID 사용
  const userId = request.auth.uid;

  const DAILY_REWARDS = [5000, 7000, 10000, 15000, 20000, 30000, 50000]; // 7일 보상

  const userRef = db.collection('users').doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const lastDailyReward = userData.lastDailyReward;
      const currentStreak = userData.dailyStreak || 0;

      // 마지막 수령 시간 체크
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (lastDailyReward) {
        const lastDate = new Date(lastDailyReward);
        const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

        if (lastDay.getTime() === today.getTime()) {
          throw new HttpsError('failed-precondition', '오늘 이미 보상을 수령했습니다.');
        }

        // 연속 출석 체크 (하루 건너뛰면 리셋)
        const dayDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff > 1) {
          // 연속 출석 깨짐 - 리셋
          var newStreak = 1;
        } else {
          var newStreak = Math.min(currentStreak + 1, 7);
        }
      } else {
        var newStreak = 1;
      }

      const reward = DAILY_REWARDS[newStreak - 1] || DAILY_REWARDS[6];
      const newGold = Math.min((userData.gold || 0) + reward, MAX_GOLD);

      transaction.update(userRef, {
        gold: newGold,
        lastDailyReward: now.toISOString(),
        dailyStreak: newStreak
      });

      return {
        success: true,
        reward,
        streak: newStreak,
        newGold
      };
    });

    return result;
  } catch (error) {
    console.error('일일 보상 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '보상 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 광고 보상 함수 (Callable) - 레이트 리밋 포함
// ============================================
exports.secureAdReward = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  // 인증된 사용자 ID 사용
  const userId = request.auth.uid;

  const AD_REWARD = 50000;
  const AD_COOLDOWN_MS = 60 * 1000; // 1분 쿨다운

  const userRef = db.collection('users').doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const lastAdReward = userData.lastAdReward || 0;
      const now = Date.now();

      if (now - lastAdReward < AD_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((AD_COOLDOWN_MS - (now - lastAdReward)) / 1000);
        throw new HttpsError('resource-exhausted', `${remainingSeconds}초 후에 다시 시도하세요.`);
      }

      const newGold = Math.min((userData.gold || 0) + AD_REWARD, MAX_GOLD);

      transaction.update(userRef, {
        gold: newGold,
        lastAdReward: now
      });

      return {
        success: true,
        reward: AD_REWARD,
        newGold
      };
    });

    return result;
  } catch (error) {
    console.error('광고 보상 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '보상 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 보안 업적 보상 함수 (Callable)
// ============================================
const ACHIEVEMENTS = {
  // 강화 시도
  'first_enhance': { condition: (s) => s.attempts >= 1, reward: 500 },
  'enhance_10': { condition: (s) => s.attempts >= 10, reward: 1000 },
  'enhance_50': { condition: (s) => s.attempts >= 50, reward: 2500 },
  'enhance_100': { condition: (s) => s.attempts >= 100, reward: 5000 },
  'enhance_300': { condition: (s) => s.attempts >= 300, reward: 15000 },
  'enhance_500': { condition: (s) => s.attempts >= 500, reward: 25000 },
  'enhance_1000': { condition: (s) => s.attempts >= 1000, reward: 50000 },
  'enhance_5000': { condition: (s) => s.attempts >= 5000, reward: 200000 },
  // 성공 횟수
  'success_5': { condition: (s) => s.successes >= 5, reward: 1000 },
  'success_10': { condition: (s) => s.successes >= 10, reward: 2000 },
  'success_30': { condition: (s) => s.successes >= 30, reward: 5000 },
  'success_50': { condition: (s) => s.successes >= 50, reward: 10000 },
  'success_100': { condition: (s) => s.successes >= 100, reward: 20000 },
  'success_300': { condition: (s) => s.successes >= 300, reward: 60000 },
  'success_500': { condition: (s) => s.successes >= 500, reward: 100000 },
  // 레벨 달성
  'level_1': { condition: (s) => s.maxLevel >= 1, reward: 500 },
  'level_3': { condition: (s) => s.maxLevel >= 3, reward: 1000 },
  'level_5': { condition: (s) => s.maxLevel >= 5, reward: 3000 },
  'level_7': { condition: (s) => s.maxLevel >= 7, reward: 5000 },
  'level_10': { condition: (s) => s.maxLevel >= 10, reward: 10000 },
  'level_12': { condition: (s) => s.maxLevel >= 12, reward: 30000 },
  'level_15': { condition: (s) => s.maxLevel >= 15, reward: 100000 },
  'level_17': { condition: (s) => s.maxLevel >= 17, reward: 300000 },
  'level_19': { condition: (s) => s.maxLevel >= 19, reward: 500000 },
  'level_20': { condition: (s) => s.maxLevel >= 20, reward: 1000000 },
  // 수익 관련
  'earn_10k': { condition: (s) => s.totalEarned >= 10000, reward: 1000 },
  'earn_50k': { condition: (s) => s.totalEarned >= 50000, reward: 3000 },
  'earn_100k': { condition: (s) => s.totalEarned >= 100000, reward: 5000 },
  'earn_500k': { condition: (s) => s.totalEarned >= 500000, reward: 25000 },
  'earn_1m': { condition: (s) => s.totalEarned >= 1000000, reward: 50000 },
  'earn_5m': { condition: (s) => s.totalEarned >= 5000000, reward: 250000 },
  'earn_10m': { condition: (s) => s.totalEarned >= 10000000, reward: 500000 },
  'earn_50m': { condition: (s) => s.totalEarned >= 50000000, reward: 2000000 },
  // 실패/파괴
  'fail_10': { condition: (s) => s.failures >= 10, reward: 1000 },
  'fail_50': { condition: (s) => s.failures >= 50, reward: 3000 },
  'fail_100': { condition: (s) => s.failures >= 100, reward: 8000 },
  'fail_300': { condition: (s) => s.failures >= 300, reward: 25000 },
  'fail_500': { condition: (s) => s.failures >= 500, reward: 50000 },
  'destroy_1': { condition: (s) => (s.destroys || 0) >= 1, reward: 2000 },
  'destroy_10': { condition: (s) => (s.destroys || 0) >= 10, reward: 10000 },
  'destroy_50': { condition: (s) => (s.destroys || 0) >= 50, reward: 50000 },
  // 특수
  'profit_positive': { condition: (s) => s.totalEarned > s.totalSpent, reward: 2000 },
  'profit_100k': { condition: (s) => s.totalEarned - s.totalSpent >= 100000, reward: 10000 },
  'profit_1m': { condition: (s) => s.totalEarned - s.totalSpent >= 1000000, reward: 100000 },
  'success_rate_50': { condition: (s) => s.attempts >= 100 && (s.successes / s.attempts) >= 0.5, reward: 30000 },
  'spend_100k': { condition: (s) => s.totalSpent >= 100000, reward: 5000 },
  'spend_1m': { condition: (s) => s.totalSpent >= 1000000, reward: 50000 },
  'spend_10m': { condition: (s) => s.totalSpent >= 10000000, reward: 500000 },
  'battle_10': { condition: (s) => (s.battles || 0) >= 10, reward: 5000 },
  'battle_win_10': { condition: (s) => (s.wins || 0) >= 10, reward: 10000 },
};

exports.secureClaimAchievement = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const userId = request.auth.uid;
  const { achievementId } = request.data;

  if (!achievementId || !ACHIEVEMENTS[achievementId]) {
    throw new HttpsError('invalid-argument', '유효하지 않은 업적입니다.');
  }

  const achievement = ACHIEVEMENTS[achievementId];
  const userRef = db.collection('users').doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const claimedAchievements = userData.claimedAchievements || [];

      // 이미 수령했는지 체크
      if (claimedAchievements.includes(achievementId)) {
        throw new HttpsError('failed-precondition', '이미 수령한 업적입니다.');
      }

      // 조건 충족 여부 체크 (서버에서 검증)
      const stats = {
        ...(userData.stats || {}),
        ...(userData.battleStats || {})
      };

      if (!achievement.condition(stats)) {
        throw new HttpsError('failed-precondition', '업적 조건을 충족하지 않았습니다.');
      }

      const newGold = Math.min((userData.gold || 0) + achievement.reward, MAX_GOLD);

      transaction.update(userRef, {
        gold: newGold,
        claimedAchievements: [...claimedAchievements, achievementId]
      });

      return {
        success: true,
        achievementId,
        reward: achievement.reward,
        newGold
      };
    });

    return result;
  } catch (error) {
    console.error('업적 보상 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '업적 보상 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 보안 배틀 보상 함수 (Callable)
// ============================================
exports.secureBattleReward = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const userId = request.auth.uid;
  const { opponentId, won, opponentTotalLevel, myTotalLevel } = request.data;

  // 기본 검증
  if (!opponentId || typeof won !== 'boolean' || typeof opponentTotalLevel !== 'number') {
    throw new HttpsError('invalid-argument', '유효하지 않은 배틀 데이터입니다.');
  }

  // 레벨 합 제한 (최대 6명 × 20레벨 = 120)
  if (opponentTotalLevel < 0 || opponentTotalLevel > 120) {
    throw new HttpsError('invalid-argument', '유효하지 않은 상대 레벨입니다.');
  }

  // 내 레벨 검증 (옵션, 0~120)
  const validMyLevel = typeof myTotalLevel === 'number' && myTotalLevel >= 0 && myTotalLevel <= 120
    ? myTotalLevel : 0;

  const BATTLE_COOLDOWN_MS = 10 * 1000; // 10초 쿨다운

  const userRef = db.collection('users').doc(userId);
  const opponentRef = db.collection('users').doc(opponentId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const opponentDoc = await transaction.get(opponentRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', '유저를 찾을 수 없습니다.');
      }

      if (!opponentDoc.exists) {
        throw new HttpsError('not-found', '상대를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const lastBattleTime = userData.lastBattleTime || 0;
      const now = Date.now();

      // 쿨다운 체크
      if (now - lastBattleTime < BATTLE_COOLDOWN_MS) {
        throw new HttpsError('resource-exhausted', '배틀 쿨다운 중입니다.');
      }

      // 자기 자신과 배틀 금지
      if (userId === opponentId) {
        throw new HttpsError('invalid-argument', '자신과 배틀할 수 없습니다.');
      }

      // 배틀 스탯 업데이트
      const battleStats = userData.battleStats || { battles: 0, wins: 0 };
      const newBattleStats = {
        battles: battleStats.battles + 1,
        wins: battleStats.wins + (won ? 1 : 0)
      };

      // 승리 시 보상 계산 (서버에서 계산)
      let reward = 0;
      if (won) {
        // 보상: 기본 2000G + 상대팀 레벨당 200G + 랜덤 2000G
        const randomBonus = secureRandom01() * 2000;
        const baseReward = 2000 + opponentTotalLevel * 200 + randomBonus;

        // 레벨 차이에 따른 보상 배율 계산 (클라이언트와 동일)
        const levelDiff = opponentTotalLevel - validMyLevel;
        let levelMultiplier = 1;
        if (levelDiff > 20) {
          levelMultiplier = 2.0; // 상대가 훨씬 강함
        } else if (levelDiff > 10) {
          levelMultiplier = 1.5; // 상대가 강함
        } else if (levelDiff > 0) {
          levelMultiplier = 1.2; // 상대가 약간 강함
        } else if (levelDiff < -20) {
          levelMultiplier = 0.3; // 내가 훨씬 강함
        } else if (levelDiff < -10) {
          levelMultiplier = 0.5; // 내가 강함
        } else if (levelDiff < 0) {
          levelMultiplier = 0.8; // 내가 약간 강함
        }

        reward = Math.floor(baseReward * levelMultiplier);

        // 최대 보상 제한 (100,000G)
        reward = Math.min(reward, 100000);
      }

      const newGold = Math.min((userData.gold || 0) + reward, MAX_GOLD);

      transaction.update(userRef, {
        gold: newGold,
        battleStats: newBattleStats,
        lastBattleTime: now
      });

      return {
        success: true,
        won,
        reward,
        newGold,
        newBattleStats
      };
    });

    return result;
  } catch (error) {
    console.error('배틀 보상 오류:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '배틀 보상 처리 중 오류가 발생했습니다.');
  }
});

// ============================================
// 기존 함수들 (알림 관련) - v2 스타일
// ============================================

// 랭킹 업데이트 (트리거)
exports.updateRanking = onDocumentUpdated({ document: 'users/{userId}', region }, async (event) => {
  const newData = event.data.after.data();
  const userId = event.params.userId;

  if (newData.stats?.maxLevel > 0) {
    await db.collection('rankings').doc(userId).set({
      nickname: newData.nickname,
      profileImage: newData.profileImage,
      maxLevel: newData.stats.maxLevel,
      totalEarned: newData.stats.totalEarned,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
});

// 10강 이상 달성 알림 전송
exports.sendEnhanceNotification = onDocumentCreated({ document: 'enhanceNotifications/{notifId}', region }, async (event) => {
  const snap = event.data;
  const data = snap.data();

  if (data.processed) return;

  const { senderName, level, tokens } = data;

  if (!tokens || tokens.length === 0) {
    console.log('전송할 토큰이 없습니다');
    return;
  }

  const message = {
    notification: {
      title: '친구의 강화 소식!',
      body: `${senderName}님이 +${level}강에 성공했습니다!`
    },
    data: {
      type: 'enhance_success',
      level: level.toString(),
      senderName: senderName
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`알림 전송 완료: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

    await snap.ref.update({ processed: true, result: {
      successCount: response.successCount,
      failureCount: response.failureCount
    }});
  } catch (err) {
    console.error('푸시 알림 전송 실패:', err);
    await snap.ref.update({ processed: true, error: err.message });
  }
});

// 배틀 알림 푸시 전송
exports.sendBattleNotification = onDocumentCreated({ document: 'battleNotifications/{notifId}', region }, async (event) => {
  const snap = event.data;
  const data = snap.data();

  const recipientRef = db.collection('users').doc(data.recipientId);
  const recipientSnap = await recipientRef.get();

  if (!recipientSnap.exists) return;

  const recipientData = recipientSnap.data();
  const fcmToken = recipientData.fcmToken;

  if (!fcmToken) {
    console.log('상대방의 FCM 토큰이 없습니다');
    return;
  }

  const won = !data.attackerWon;
  const message = {
    notification: {
      title: won ? '배틀 승리!' : '배틀 도전!',
      body: won
        ? `${data.attackerName}님의 도전을 물리쳤습니다!`
        : `${data.attackerName}님에게 패배했습니다...`
    },
    data: {
      type: 'battle',
      attackerId: data.attackerId,
      won: won.toString()
    },
    token: fcmToken
  };

  try {
    await admin.messaging().send(message);
    console.log('배틀 알림 푸시 전송 완료');
  } catch (err) {
    console.error('배틀 푸시 전송 실패:', err);
  }
});

// 오래된 강화 로그 정리
exports.cleanupEnhanceLogs = onSchedule({ schedule: 'every 60 minutes', region }, async (event) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const logsRef = db.collection('enhanceLogs');
    const oldLogs = await logsRef
      .where('timestamp', '<', oneHourAgo)
      .get();

    const batch = db.batch();
    let count = 0;

    oldLogs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`${count}개의 오래된 강화 로그 삭제 완료`);
    }
  } catch (err) {
    console.error('로그 정리 실패:', err);
  }
});
