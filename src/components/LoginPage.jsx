import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LoginPage = () => {
  const { user, loginWithKakao, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleKakaoLogin = async () => {
    try {
      await loginWithKakao();
      navigate('/');
    } catch (err) {
      console.error('카카오 로그인 실패:', err);
      alert('로그인에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgGlow} />
      
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.card}
      >
        <h1 style={styles.title}>⚔️ 강화 시뮬레이터</h1>
        <p style={styles.subtitle}>로그인하고 강화를 시작하세요!</p>

        <motion.button
          onClick={handleKakaoLogin}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={styles.kakaoBtn}
        >
          <img 
            src='https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_small.png' 
            alt='kakao' 
            style={styles.kakaoIcon}
          />
          카카오 로그인
        </motion.button>

        <div style={styles.features}>
          <div style={styles.feature}>🎮 무료 강화 시뮬레이션</div>
          <div style={styles.feature}>💰 골드 시스템</div>
          <div style={styles.feature}>📊 기록 저장</div>
          <div style={styles.feature}>🏆 랭킹 시스템 (예정)</div>
        </div>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'Noto Sans KR, sans-serif',
    position: 'relative',
  },
  bgGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(80,80,150,0.3) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: 'rgba(20,20,40,0.95)',
    borderRadius: 20,
    padding: '40px 50px',
    textAlign: 'center',
    border: '1px solid #333',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    marginBottom: 10,
    textShadow: '0 0 30px rgba(255,215,0,0.5)',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 30,
  },
  kakaoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#FEE500',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 30,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    textAlign: 'left',
  },
  feature: {
    color: '#888',
    fontSize: 14,
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  loading: {
    color: '#fff',
    fontSize: 18,
  },
};

export default LoginPage;
