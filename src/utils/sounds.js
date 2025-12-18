// Web Audio API 기반 사운드 시스템
let audioContext = null;
let isMuted = localStorage.getItem('soundMuted') === 'true';

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// 음소거 토글
export const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem('soundMuted', isMuted.toString());
  return isMuted;
};

export const getMuteStatus = () => isMuted;

export const setMute = (muted) => {
  isMuted = muted;
  localStorage.setItem('soundMuted', isMuted.toString());
};

// 기본 사운드 생성 함수
const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
  if (isMuted) return; // 음소거 시 재생 안함
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio not supported');
  }
};

// 강화 시작 사운드 (긴장감 있는 상승음)
export const playEnhanceStart = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // 상승하는 톤
  [300, 400, 500, 600].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 100);
  });
};

// 강화 중 반복 사운드
export const playEnhancing = (level) => {
  const baseFreq = 200 + level * 20;
  playTone(baseFreq, 0.1, 'sine', 0.1);
};

// 성공 사운드 (밝고 상승하는 화음)
export const playSuccess = (level) => {
  const baseFreq = 400 + level * 10;

  // 화려한 성공음
  playTone(baseFreq, 0.3, 'sine', 0.3);
  setTimeout(() => playTone(baseFreq * 1.25, 0.3, 'sine', 0.3), 100);
  setTimeout(() => playTone(baseFreq * 1.5, 0.4, 'sine', 0.3), 200);
  setTimeout(() => playTone(baseFreq * 2, 0.5, 'triangle', 0.2), 300);

  // 고레벨 성공시 추가 효과
  if (level >= 15) {
    setTimeout(() => {
      playTone(baseFreq * 2.5, 0.3, 'sine', 0.2);
      playTone(baseFreq * 3, 0.4, 'sine', 0.15);
    }, 400);
  }
};

// 실패 사운드 (하강하는 음)
export const playFail = () => {
  playTone(400, 0.2, 'sawtooth', 0.2);
  setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.2), 100);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.15), 200);
};

// 파괴 사운드 (불협화음 + 하강)
export const playDestroyed = () => {
  // 충격적인 파괴음
  playTone(150, 0.5, 'sawtooth', 0.4);
  playTone(155, 0.5, 'sawtooth', 0.4);

  setTimeout(() => {
    playTone(100, 0.4, 'square', 0.3);
    playTone(105, 0.4, 'square', 0.3);
  }, 200);

  setTimeout(() => playTone(60, 0.6, 'sawtooth', 0.2), 400);
};

// 판매 사운드 (코인 소리)
export const playSell = () => {
  playTone(800, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(1000, 0.1, 'sine', 0.3), 50);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.25), 100);
};

// 버튼 클릭 사운드
export const playClick = () => {
  playTone(600, 0.05, 'sine', 0.15);
};

// 사운드 초기화 (사용자 인터랙션 후 호출 필요)
export const initSound = () => {
  getAudioContext();
};
