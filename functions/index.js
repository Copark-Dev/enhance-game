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

// 강화 확률 테이블 (서버에서만 관리)
const SUCCESS_RATES = {
  0: 95, 1: 90, 2: 85, 3: 80, 4: 75, 5: 70,
  6: 65, 7: 60, 8: 55, 9: 50, 10: 45, 11: 40,
  12: 35, 13: 30, 14: 25, 15: 20, 16: 15, 17: 10,
  18: 7, 19: 5, 20: 3
};

const DOWNGRADE_RATES = {
  0: 0, 1: 0, 2: 15, 3: 20, 4: 25, 5: 30,
  6: 40, 7: 50, 8: 60, 9: 70, 10: 80, 11: 85,
  12: 90, 13: 95, 14: 100, 15: 100, 16: 100, 17: 100,
  18: 100, 19: 100, 20: 100
};

const DESTROY_RATES = {
  0: 0, 1: 0, 2: 0, 3: 0.5, 4: 1, 5: 1.5,
  6: 2, 7: 3, 8: 4, 9: 5, 10: 7, 11: 10,
  12: 14, 13: 18, 14: 22, 15: 28, 16: 35, 17: 42,
  18: 50, 19: 60, 20: 70
};

const ENHANCE_COST = {
  0: 100, 1: 200, 2: 400, 3: 800, 4: 1500, 5: 3000,
  6: 6000, 7: 12000, 8: 25000, 9: 50000, 10: 100000,
  11: 200000, 12: 400000, 13: 800000, 14: 1500000,
  15: 3000000, 16: 5000000, 17: 8000000, 18: 12000000,
  19: 18000000, 20: 25000000
};

const SELL_PRICE = {
  0: { min: 0, max: 0 },
  1: { min: 50, max: 150 },
  2: { min: 150, max: 400 },
  3: { min: 400, max: 1000 },
  4: { min: 1000, max: 2500 },
  5: { min: 2500, max: 6000 },
  6: { min: 6000, max: 15000 },
  7: { min: 15000, max: 35000 },
  8: { min: 35000, max: 80000 },
  9: { min: 80000, max: 180000 },
  10: { min: 180000, max: 400000 },
  11: { min: 400000, max: 900000 },
  12: { min: 900000, max: 2000000 },
  13: { min: 2000000, max: 4500000 },
  14: { min: 4500000, max: 10000000 },
  15: { min: 10000000, max: 22000000 },
  16: { min: 22000000, max: 48000000 },
  17: { min: 48000000, max: 100000000 },
  18: { min: 100000000, max: 200000000 },
  19: { min: 200000000, max: 400000000 },
  20: { min: 400000000, max: 800000000 }
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

      // 비용 계산
      const enhanceCost = buffs.freeEnhance ? 0 : (ENHANCE_COST[currentLevel] || 100);

      // 골드 체크
      if (currentGold < enhanceCost) {
        throw new HttpsError('failed-precondition', '골드가 부족합니다.');
      }

      // 강화 로직 실행
      const roll = secureRandom();
      const baseSuccessRate = SUCCESS_RATES[currentLevel] || 1;
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
        const destroyRate = DESTROY_RATES[currentLevel] || 0;

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
          const downgradeRate = DOWNGRADE_RATES[currentLevel] || 0;

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

      // 판매가 계산
      const priceRange = SELL_PRICE[currentLevel] || { min: 0, max: 0 };
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
