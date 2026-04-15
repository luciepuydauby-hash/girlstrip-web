import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/planning', icon: Calendar, label: 'Planning' },
    { path: '/home', icon: Home, label: 'Accueil' },
    { path: '/compte', icon: User, label: 'Compte' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      backgroundColor: '#FFF5F0',
      maxWidth: '430px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderTop: '1.5px solid #FFE8D6',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                gap: '4px',
              }}
            >
              <Icon
                size={24}
                color={isActive ? '#FF4D8D' : '#C4A0B5'}
                fill={isActive ? '#FF4D8D' : 'none'}
              />
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#FF4D8D' : '#C4A0B5',
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}