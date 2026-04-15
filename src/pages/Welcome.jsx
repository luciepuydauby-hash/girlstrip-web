import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';

export default function Welcome() {
  const navigate = useNavigate();
  const { getUserByEmail, createUser, setUser } = useAppStore();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('girlstrip_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleContinue = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('girlstrip_email', email.trim().toLowerCase());
      const existingUser = await getUserByEmail(email.trim().toLowerCase());
      if (existingUser) {
        navigate('/trips');
      } else {
        setStep('prenom');
      }
    } catch (err) {
      setStep('prenom');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!prenom.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createUser(prenom.trim(), email.trim().toLowerCase());
      navigate('/trips');
    } catch (err) {
      setError('Impossible de créer le compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#FFF5F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Décoration fond */}
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%', backgroundColor: '#FFB3D1',
        top: '-150px', right: '-100px', opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        borderRadius: '50%', backgroundColor: '#FF85B3',
        top: '50px', left: '-120px', opacity: 0.2,
      }} />
      <div style={{
        position: 'absolute', width: '350px', height: '350px',
        borderRadius: '50%', backgroundColor: '#FFD6A5',
        bottom: '-100px', right: '-80px', opacity: 0.3,
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🌸</div>
          <h1 style={{
            fontSize: '42px', fontWeight: '800',
            color: '#FF4D8D', marginBottom: '8px',
            letterSpacing: '-1px',
          }}>
            GirlsTrip
          </h1>
          <p style={{ fontSize: '15px', color: '#8B6B7A', lineHeight: '22px' }}>
            {step === 'email'
              ? "Pour les filles qui disent 'on verra' mais qui veulent tout planifier 📋"
              : "Encore une petite chose... 💕"}
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '28px',
          padding: '28px',
          boxShadow: '0 8px 32px rgba(255,77,141,0.15)',
          marginBottom: '24px',
        }}>
          {step === 'email' ? (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2D1B2E', marginBottom: '6px' }}>
                Bienvenue ! 👋
              </h2>
              <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>
                Entre ton email pour continuer
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                placeholder="exemple@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '16px',
                  backgroundColor: '#FFF5F0',
                  border: '1.5px solid #FFE8D6',
                  borderRadius: '14px',
                  fontSize: '16px', color: '#2D1B2E',
                  marginBottom: '16px',
                }}
              />
              {error && <p style={{ color: '#FF4D8D', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <button
                onClick={handleContinue}
                disabled={loading || !email.trim()}
                style={{
                  width: '100%', padding: '18px',
                  backgroundColor: !email.trim() || loading ? '#FFB3D1' : '#FF4D8D',
                  border: 'none', borderRadius: '14px',
                  color: 'white', fontSize: '17px', fontWeight: '700',
                  cursor: !email.trim() || loading ? 'not-allowed' : 'pointer',
                  boxShadow: !email.trim() || loading ? 'none' : '0 4px 16px rgba(255,77,141,0.4)',
                }}
              >
                {loading ? 'Chargement...' : 'Continuer →'}
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2D1B2E', marginBottom: '6px' }}>
                Ton prénom 🌸
              </h2>
              <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>{email}</p>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                placeholder="Ex: Emma"
                autoFocus
                style={{
                  width: '100%', padding: '16px',
                  backgroundColor: '#FFF5F0',
                  border: '1.5px solid #FFE8D6',
                  borderRadius: '14px',
                  fontSize: '16px', color: '#2D1B2E',
                  marginBottom: '16px',
                }}
              />
              {error && <p style={{ color: '#FF4D8D', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <button
                onClick={handleCreateAccount}
                disabled={loading || !prenom.trim()}
                style={{
                  width: '100%', padding: '18px',
                  backgroundColor: !prenom.trim() || loading ? '#FFB3D1' : '#FF4D8D',
                  border: 'none', borderRadius: '14px',
                  color: 'white', fontSize: '17px', fontWeight: '700',
                  cursor: !prenom.trim() || loading ? 'not-allowed' : 'pointer',
                  boxShadow: !prenom.trim() || loading ? 'none' : '0 4px 16px rgba(255,77,141,0.4)',
                  marginBottom: '12px',
                }}
              >
                {loading ? 'Création...' : "C'est parti ! 🎉"}
              </button>
              <button
                onClick={() => setStep('email')}
                style={{
                  width: '100%', padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none', color: '#8B6B7A',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                ← Changer d'email
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#C4A0B5' }}>
          Lulu a codé, vous n'avez plus d'excuse pour être désorganisées 💅
        </p>
      </div>
    </div>
  );
}