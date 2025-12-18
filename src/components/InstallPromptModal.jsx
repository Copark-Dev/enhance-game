import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPromptModal = ({ isOpen, onClose }) => {
  const [deviceType, setDeviceType] = useState('unknown'); // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const iosSteps = [
    { icon: '1️⃣', text: '하단의 공유 버튼을 탭하세요', subtext: '(네모에서 화살표 나오는 아이콘)' },
    { icon: '2️⃣', text: '아래로 스크롤하세요' },
    { icon: '3️⃣', text: '"홈 화면에 추가"를 탭하세요' },
    { icon: '4️⃣', text: '"추가"를 탭하면 완료!' },
  ];

  const androidSteps = [
    { icon: '1️⃣', text: '브라우저 메뉴(⋮)를 탭하세요', subtext: '(주소창 오른쪽)' },
    { icon: '2️⃣', text: '"홈 화면에 추가" 또는 "앱 설치"를 탭하세요' },
    { icon: '3️⃣', text: '"설치" 또는 "추가"를 탭하면 완료!' },
  ];

  const steps = deviceType === 'ios' ? iosSteps : androidSteps;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={styles.overlay}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={styles.modal}
        >
          <div style={styles.header}>
            <div style={styles.iconWrapper}>
              <img
                src="/images/items/10.png"
                alt="앱 아이콘"
                style={styles.appIcon}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h2 style={styles.title}>홈 화면에 추가하세요!</h2>
            <p style={styles.subtitle}>
              웹앱을 홈 화면에 추가해야<br/>
              <strong style={{ color: '#FFD700' }}>푸시 알림</strong>을 받을 수 있어요!
            </p>
          </div>

          <div style={styles.benefits}>
            <div style={styles.benefitItem}>
              <span>🔔</span>
              <span>친구 강화 알림</span>
            </div>
            <div style={styles.benefitItem}>
              <span>⚔️</span>
              <span>배틀 도전 알림</span>
            </div>
            <div style={styles.benefitItem}>
              <span>🚀</span>
              <span>빠른 실행</span>
            </div>
          </div>

          <div style={styles.stepsContainer}>
            <div style={styles.deviceLabel}>
              {deviceType === 'ios' ? '🍎 iOS (Safari)' : '🤖 Android (Chrome)'}
            </div>
            {steps.map((step, index) => (
              <div key={index} style={styles.step}>
                <span style={styles.stepIcon}>{step.icon}</span>
                <div style={styles.stepContent}>
                  <span style={styles.stepText}>{step.text}</span>
                  {step.subtext && (
                    <span style={styles.stepSubtext}>{step.subtext}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {deviceType === 'ios' && (
            <div style={styles.iosShareIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2">
                <path d="M12 3v12M12 3l4 4M12 3L8 7" />
                <path d="M4 13v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
              </svg>
              <span style={{ color: '#007AFF', fontSize: 12, marginTop: 4 }}>이 버튼!</span>
            </div>
          )}

          <div style={styles.buttons}>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.laterBtn}
            >
              나중에
            </motion.button>
            <motion.button
              onClick={() => {
                localStorage.setItem('installPromptDismissed', 'true');
                onClose();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.dontShowBtn}
            >
              다시 보지 않기
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// PWA로 실행 중인지 확인
export const isRunningAsPWA = () => {
  // iOS standalone 모드
  if (window.navigator.standalone === true) return true;
  // Android/Desktop PWA
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
};

// 설치 프롬프트 표시 여부 확인
export const shouldShowInstallPrompt = () => {
  // 이미 PWA로 실행 중이면 표시 안함
  if (isRunningAsPWA()) return false;
  // 사용자가 "다시 보지 않기" 선택했으면 표시 안함
  if (localStorage.getItem('installPromptDismissed') === 'true') return false;
  // 데스크톱은 표시 안함
  const userAgent = navigator.userAgent.toLowerCase();
  if (!/iphone|ipad|ipod|android/.test(userAgent)) return false;
  return true;
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'rgba(25,25,50,0.98)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '2px solid #FFD700',
    boxShadow: '0 0 60px rgba(255,215,0,0.4)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    margin: '0 auto 16px',
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #FFD700',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  title: {
    margin: 0,
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#aaa',
    fontSize: 14,
  },
  benefits: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: '12px 0',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
  },
  benefitItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#fff',
  },
  stepsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  deviceLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepText: {
    color: '#fff',
    fontSize: 14,
  },
  stepSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  iosShareIcon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 12,
  },
  buttons: {
    display: 'flex',
    gap: 10,
  },
  laterBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  dontShowBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#333',
    color: '#888',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    cursor: 'pointer',
  },
};

export default InstallPromptModal;
