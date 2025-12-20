import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Terms = () => {
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
        <h1 style={styles.title}>이용약관</h1>
      </div>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제1조 (목적)</h2>
          <p style={styles.text}>
            이 약관은 '강화 시뮬레이터'(이하 '서비스')가 제공하는 모든 서비스의 이용조건 및 절차,
            이용자와 서비스의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제2조 (용어의 정의)</h2>
          <ul style={styles.list}>
            <li>"서비스"란 강화 시뮬레이터가 제공하는 웹 기반 게임 서비스를 말합니다.</li>
            <li>"이용자"란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
            <li>"회원"이란 서비스에 회원등록을 한 자로서, 서비스를 이용하는 자를 말합니다.</li>
            <li>"게임 데이터"란 이용자가 서비스를 이용하며 생성되는 모든 데이터를 말합니다.</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제3조 (약관의 효력과 변경)</h2>
          <p style={styles.text}>
            1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.<br />
            2. 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지함으로써 효력이 발생합니다.<br />
            3. 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제4조 (서비스의 제공)</h2>
          <p style={styles.text}>서비스는 다음과 같은 서비스를 제공합니다.</p>
          <ul style={styles.list}>
            <li>강화 시뮬레이션 게임</li>
            <li>배틀 시스템</li>
            <li>실시간 강화 피드</li>
            <li>랭킹 시스템</li>
            <li>채팅 기능</li>
            <li>기타 서비스가 정하는 서비스</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제5조 (서비스 이용)</h2>
          <p style={styles.text}>
            1. 서비스는 무료로 제공됩니다.<br />
            2. 서비스 내의 게임 머니, 아이템 등은 실제 재화 가치가 없으며, 현금으로 환전할 수 없습니다.<br />
            3. 서비스는 광고를 포함할 수 있으며, 이용자는 서비스 이용 시 노출되는 광고에 동의합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제6조 (이용자의 의무)</h2>
          <p style={styles.text}>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul style={styles.list}>
            <li>타인의 정보를 도용하는 행위</li>
            <li>서비스의 운영을 고의로 방해하는 행위</li>
            <li>서비스를 이용하여 법령 또는 이 약관이 금지하는 행위</li>
            <li>허위 정보를 등록하는 행위</li>
            <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
            <li>음란물이나 불법 정보를 게시하는 행위</li>
            <li>서비스의 안정적 운영을 방해하는 행위</li>
            <li>비정상적인 방법으로 서비스를 이용하거나 시스템에 접근하는 행위</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제7조 (서비스의 중단)</h2>
          <p style={styles.text}>
            1. 서비스는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우
               서비스의 제공을 일시적으로 중단할 수 있습니다.<br />
            2. 서비스는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며,
               정기점검시간은 서비스 화면에 공지합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제8조 (게임 데이터)</h2>
          <p style={styles.text}>
            1. 게임 데이터는 서비스 내에서만 유효하며, 서비스 외부로 이전할 수 없습니다.<br />
            2. 서비스는 운영상, 기술상 필요에 따라 게임 데이터를 변경하거나 삭제할 수 있습니다.<br />
            3. 이용자가 서비스 탈퇴 시 게임 데이터는 삭제될 수 있습니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제9조 (면책조항)</h2>
          <p style={styles.text}>
            1. 서비스는 무료로 제공되는 서비스로서, 서비스 이용과 관련하여 발생한 손해에 대해
               책임을 지지 않습니다.<br />
            2. 서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.<br />
            3. 서비스는 이용자가 서비스를 이용하여 얻은 정보 등으로 인해 발생한 손해에 대하여
               책임을 지지 않습니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>제10조 (분쟁해결)</h2>
          <p style={styles.text}>
            서비스와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법원을 관할 법원으로 합니다.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>부칙</h2>
          <p style={styles.text}>
            이 약관은 2024년 12월 21일부터 시행됩니다.
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

export default Terms;
