import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={styles.backBtn}
        >
          ← 뒤로
        </motion.button>
        <h1 style={styles.title}>개인정보처리방침</h1>
      </div>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. 개인정보의 처리 목적</h2>
          <p style={styles.text}>
            '강화 시뮬레이터'(이하 '서비스')는 다음의 목적을 위하여 개인정보를 처리합니다.
            처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
            이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul style={styles.list}>
            <li>회원 가입 및 관리: 회원 가입의사 확인, 서비스 제공에 따른 본인 식별·인증,
                회원자격 유지·관리 등을 목적으로 개인정보를 처리합니다.</li>
            <li>서비스 제공: 게임 데이터 저장, 랭킹 시스템 운영, 실시간 피드 제공 등
                서비스 제공과 관련한 목적으로 개인정보를 처리합니다.</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. 수집하는 개인정보의 항목</h2>
          <p style={styles.text}>서비스는 다음의 개인정보 항목을 수집합니다.</p>
          <ul style={styles.list}>
            <li>카카오 로그인 시: 카카오 계정 ID, 닉네임, 프로필 이미지</li>
            <li>서비스 이용 시: 게임 플레이 기록, 강화 기록, 배틀 기록</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. 개인정보의 처리 및 보유 기간</h2>
          <p style={styles.text}>
            서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
            개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul style={styles.list}>
            <li>회원 정보: 회원 탈퇴 시까지</li>
            <li>게임 기록: 회원 탈퇴 시까지</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. 개인정보의 제3자 제공</h2>
          <p style={styles.text}>
            서비스는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 정보주체의 동의가 있거나 법령의 규정에 의한 경우에는 예외로 합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. 개인정보의 파기</h2>
          <p style={styles.text}>
            서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
            지체없이 해당 개인정보를 파기합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. 쿠키 및 광고</h2>
          <p style={styles.text}>
            서비스는 Google AdSense를 통해 광고를 게재하고 있습니다.
            Google은 사용자의 관심사에 기반한 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
            사용자는 Google 광고 설정에서 맞춤 광고를 비활성화할 수 있습니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. 정보주체의 권리·의무 및 행사방법</h2>
          <p style={styles.text}>
            정보주체는 서비스에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
          </p>
          <ul style={styles.list}>
            <li>개인정보 열람요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제요구</li>
            <li>처리정지 요구</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. 개인정보 보호책임자</h2>
          <p style={styles.text}>
            서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
            개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
            아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <p style={styles.text}>
            담당자: 운영팀<br />
            이메일: copark.dev@gmail.com
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>9. 개인정보처리방침 변경</h2>
          <p style={styles.text}>
            이 개인정보처리방침은 2024년 12월 21일부터 적용됩니다.
          </p>
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a1a',
    color: '#fff',
    padding: '20px',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #333',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #666',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
    margin: 0,
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: 1.8,
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '12px',
  },
  text: {
    color: '#ccc',
    fontSize: '14px',
    marginBottom: '12px',
  },
  list: {
    color: '#ccc',
    fontSize: '14px',
    paddingLeft: '20px',
    margin: '8px 0',
  },
};

export default PrivacyPolicy;
