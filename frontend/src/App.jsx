import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoryCards from './components/CategoryCards';
import AiPlatform from './components/AiPlatform';
import LiveFeed from './components/LiveFeed';
import BrowseHub from './components/BrowseHub';
import SectorsGrid from './components/SectorsGrid';
import WhyUs from './components/WhyUs';
import Testimonials from './components/Testimonials';
import ServicesGrid from './components/ServicesGrid';
import Footer from './components/Footer';
import DemoModal from './components/DemoModal';
import LoginModal from './components/LoginModal';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import UserDashboard from './components/UserDashboard';
import AuthorityDashboard from './components/AuthorityDashboard';
import Toast from './components/Toast';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { WalletProvider } from './context/WalletContext';
import './styles.css';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('vendor') || path.includes('dashboard') || path.includes('setting')) {
      return 'dashboard';
    }
    if (path.includes('authority') || path.includes('gov')) {
      return 'authority-dashboard';
    }
    return localStorage.getItem('zk_current_view') || 'home';
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('zk_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [demoOpen, setDemoOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('Competitive Bid Analysis');
  const [searchParams, setSearchParams] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem('zk_current_view', currentView);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('zk_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('zk_user');
      localStorage.removeItem('zk_last_activity');
    }
  }, [user]);

  const addToast = (message, type = 'success') => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const handleAutoLogout = useCallback(() => {
    setUser(null);
    setCurrentView('home');
    localStorage.removeItem('zk_user');
    localStorage.removeItem('zk_current_view');
    localStorage.removeItem('zk_active_tab');
    localStorage.removeItem('zk_gov_active_tab');
    localStorage.removeItem('zk_last_activity');
    addToast('Session expired due to 15 minutes of inactivity. You have been automatically logged out.', 'warning');
  }, []);

  // Enforce 15-minute inactivity session timeout
  useSessionTimeout(user, handleAutoLogout);

  const handleOpenDemo = (serviceName) => {
    if (serviceName) setSelectedService(serviceName);
    setDemoOpen(true);
  };

  const handleLoginSuccess = (userObj, message) => {
    const userRole = (userObj && userObj.role) ? String(userObj.role).toUpperCase() : '';
    const userEmail = (userObj && userObj.email) ? String(userObj.email).toLowerCase() : '';
    const isAuthority = userRole === 'AUTHORITY' || userEmail.includes('officer') || userEmail.includes('gov.in');
    
    const finalUser = {
      ...userObj,
      role: isAuthority ? 'AUTHORITY' : (userObj.role || 'VENDOR'),
      organizationId: isAuthority ? (userObj.organizationId || 'GOV001') : (userObj.organizationId || 'ORG001')
    };

    const targetView = isAuthority ? 'authority-dashboard' : 'dashboard';
    setUser(finalUser);
    setCurrentView(targetView);
    localStorage.setItem('zk_user', JSON.stringify(finalUser));
    localStorage.setItem('zk_current_view', targetView);
    localStorage.setItem('zk_last_activity', Date.now().toString());
    setLoginModalOpen(false);
    addToast(message || `Welcome to your portal, ${finalUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    localStorage.removeItem('zk_user');
    localStorage.removeItem('zk_current_view');
    localStorage.removeItem('zk_active_tab');
    localStorage.removeItem('zk_gov_active_tab');
    localStorage.removeItem('zk_last_activity');
    addToast('Signed out of account.', 'info');
  };

  const renderViewContent = () => {
    if (currentView === 'authority-dashboard') {
      return (
        <AuthorityDashboard 
          currentUser={user} 
          onLogout={handleLogout} 
          onToast={(msg, type) => addToast(msg, type)}
        />
      );
    }

    if (currentView === 'dashboard') {
      return (
        <UserDashboard 
          currentUser={user} 
          onLogout={handleLogout} 
          onToast={(msg, type) => addToast(msg, type)}
        />
      );
    }

    if (currentView === 'login') {
      return (
        <>
          <Navbar 
            user={user} 
            onOpenLogin={() => setCurrentView('login')} 
            onLogout={handleLogout} 
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
          <LoginPage 
            onBack={() => setCurrentView('home')} 
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setCurrentView('forgot_password')}
          />
          <Footer onOpenDemo={handleOpenDemo} />
        </>
      );
    }

    if (currentView === 'forgot_password') {
      return (
        <>
          <Navbar 
            user={user} 
            onOpenLogin={() => setCurrentView('login')} 
            onLogout={handleLogout} 
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
          <ForgotPasswordPage 
            onBackToLogin={() => setCurrentView('login')} 
            onToast={(msg, type) => addToast(msg, type)} 
          />
          <Footer onOpenDemo={handleOpenDemo} />
        </>
      );
    }

    return (
      <>
        <Navbar 
          user={user} 
          onOpenLogin={() => setCurrentView('login')} 
          onLogout={handleLogout} 
          onOpenDashboard={() => setCurrentView('dashboard')}
        />
        <Hero onSearch={(params) => setSearchParams(params)} />
        <CategoryCards />
        <LiveFeed searchParams={searchParams} onOpenDemo={handleOpenDemo} />
        <AiPlatform onOpenDemo={handleOpenDemo} />
        <SectorsGrid />
        <WhyUs />
        <Testimonials />
        <ServicesGrid onOpenDemo={handleOpenDemo} />
        <Footer onOpenDemo={handleOpenDemo} />
        <DemoModal 
          isOpen={demoOpen} 
          onClose={() => setDemoOpen(false)} 
          initialService={selectedService}
          onSubmitSuccess={(msg) => addToast(msg, 'success')}
        />
        <LoginModal 
          isOpen={loginModalOpen} 
          onClose={() => setLoginModalOpen(false)} 
          onSubmitSuccess={(msg) => addToast(msg, 'success')}
          onOpenRegister={(serviceName) => handleOpenDemo(serviceName)}
        />
      </>
    );
  };

  return (
    <WalletProvider user={user} onToast={(msg, type) => addToast(msg, type)}>
      <div className="app">
        {renderViewContent()}
        <Toast toasts={toasts} />
      </div>
    </WalletProvider>
  );
}
