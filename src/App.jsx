import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ImageProvider } from './context/ImageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import EnhanceGame from './components/EnhanceGame';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import AdRewardPage from './components/AdRewardPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
        로딩 중...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to='/login' />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/' element={<ProtectedRoute><EnhanceGame /></ProtectedRoute>} />
      <Route path='/admin' element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path='/ad-reward' element={<ProtectedRoute><AdRewardPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ImageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ImageProvider>
    </AuthProvider>
  );
}

export default App;
