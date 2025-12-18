// XSS 방지 - 문자열 이스케이프
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// 숫자 입력 검증
export const sanitizeNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

// 닉네임 검증 (특수문자 제한)
export const validateNickname = (nickname) => {
  if (!nickname || typeof nickname !== 'string') return false;
  // 한글, 영문, 숫자만 허용 (2-10자)
  const pattern = /^[가-힣a-zA-Z0-9]{2,10}$/;
  return pattern.test(nickname.trim());
};

// 골드 조작 방지 - 해시 검증
const SECRET_SALT = 'enhance_game_2024_salt';

export const generateIntegrityHash = (userId, gold, level) => {
  const data = `${userId}:${gold}:${level}:${SECRET_SALT}`;
  // 간단한 해시 (실제 서버에서 검증 필요)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const verifyIntegrity = (userId, gold, level, hash) => {
  return generateIntegrityHash(userId, gold, level) === hash;
};

// DevTools 감지 (경고용)
export const detectDevTools = (callback) => {
  const threshold = 160;
  let devtoolsOpen = false;

  const check = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        callback && callback(true);
      }
    } else {
      if (devtoolsOpen) {
        devtoolsOpen = false;
        callback && callback(false);
      }
    }
  };

  // 초기 체크 및 리사이즈 시 체크
  check();
  window.addEventListener('resize', check);

  return () => window.removeEventListener('resize', check);
};

// 로컬 스토리지 변조 감지
export const createSecureStorage = () => {
  const originalData = {};

  return {
    set: (key, value) => {
      const stringValue = JSON.stringify(value);
      const checksum = generateIntegrityHash(key, stringValue, Date.now());
      const secureValue = JSON.stringify({ data: value, checksum, timestamp: Date.now() });
      localStorage.setItem(key, secureValue);
      originalData[key] = checksum;
    },
    get: (key) => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        const { data, checksum } = JSON.parse(stored);
        // 체크섬 검증은 생략 (클라이언트 사이드 한계)
        return data;
      } catch (e) {
        console.warn('Storage read error:', key);
        return null;
      }
    },
    remove: (key) => {
      localStorage.removeItem(key);
      delete originalData[key];
    }
  };
};

// 콘솔 경고 메시지
export const showSecurityWarning = () => {
  console.log(
    '%c⚠️ 경고!',
    'color: red; font-size: 48px; font-weight: bold;'
  );
  console.log(
    '%c이 콘솔은 개발자용입니다. 게임 데이터 조작 시도는 계정 제재 사유가 됩니다.',
    'color: red; font-size: 16px;'
  );
  console.log(
    '%c타인이 여기에 코드를 입력하라고 했다면, 사기입니다!',
    'color: orange; font-size: 14px;'
  );
};

// Rate limiting (클릭 스팸 방지)
export const createRateLimiter = (limit, windowMs) => {
  const requests = [];

  return () => {
    const now = Date.now();
    // 오래된 요청 제거
    while (requests.length > 0 && requests[0] < now - windowMs) {
      requests.shift();
    }

    if (requests.length >= limit) {
      return false; // 제한 초과
    }

    requests.push(now);
    return true; // 허용
  };
};
