import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { Plus, LogIn, Calendar } from 'lucide-react';

export default function Trips() {
  const navigate = useNavigate();
  const { user, trips, currentTrip, loadTrips, createTrip, joinTrip, setCurrentTrip } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadTrips();
  }, [user]);

  const handleCreateTrip = async () => {
    if (!tripName.trim() || !tripDate.trim()) {
      setError('Remplis tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const trip = await createTrip(tripName.trim(), tripDate.trim());
      setCreatedCode(trip.code);
      setTripName('');
      setTripDate('');
    } catch (err) {
      setError('Impossible de créer le voyage');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinTrip(joinCode.trim());
      await loadTrips();
      setShowJoinModal(false);
      setJoinCode('');
    } catch (err) {
      setError(err.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setCurrentTrip(trip);
    navigate('/home');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#FFF5F0',
      padding: '24px',
      paddingTop: 'calc(env(safe-area-inset-top) + 40px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Décoration */}
      <div style={{
        position: 'absolute', width: '350px', height: '350px',
        borderRadius: '50%', backgroundColor: '#FFB3D1',
        top: '-100px', right: '-100px', opacity: 0.3,
      }} />
      <div style={{
        position: 'absolute', width: '250px', height: '250px',
        borderRadius: '50%', backgroundColor: '#FFD6A5',
        bottom: '80px', left: '-80px', opacity: 0.25,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#2D1B2E', marginBottom: '4px' }}>
          Mes voyages
        </h1>
        <p style={{ fontSize: '16px', color: '#8B6B7A', marginBottom: '28px' }}>
          Bonjour {user?.name} 👋
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '16px', backgroundColor: '#FF4D8D',
              border: 'none', borderRadius: '16px', color: 'white',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
            }}
          >
            <Plus size={18} /> Créer
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '16px', backgroundColor: 'white',
              border: '1.5px solid #FFD6E8', borderRadius: '16px',
              color: '#FF4D8D', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            <LogIn size={18} /> Rejoindre
          </button>
        </div>

        {/* Liste des voyages */}
        {trips.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '24px', padding: '40px',
            textAlign: 'center', border: '1.5px solid #FFE8D6',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧳</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E', marginBottom: '8px' }}>
              Aucun voyage
            </h3>
            <p style={{ fontSize: '14px', color: '#8B6B7A' }}>
              Crée ou rejoins un voyage pour commencer !
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trips.map((trip) => {
              const isActive = currentTrip?.id === trip.id;
              return (
                <button
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  style={{
                    backgroundColor: 'white', borderRadius: '20px', padding: '20px',
                    border: isActive ? '2px solid #FF4D8D' : '1.5px solid #FFE8D6',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: isActive ? '0 4px 16px rgba(255,77,141,0.15)' : 'none',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E', marginBottom: '6px' }}>
                      {trip.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Calendar size={13} color="#FFB347" />
                      <span style={{ fontSize: '13px', color: '#8B6B7A' }}>
                        {new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#C4A0B5' }}>Code : {trip.code}</span>
                  </div>
                  {isActive && (
                    <span style={{
                      backgroundColor: '#FF4D8D', color: 'white',
                      padding: '4px 12px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '700',
                    }}>ACTIF</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Créer */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
        }} onClick={() => { setShowCreateModal(false); setCreatedCode(null); }}>
          <div
            style={{
              backgroundColor: 'white', borderRadius: '28px 28px 0 0',
              padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
              width: '100%', maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {createdCode ? (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '8px' }}>
                  Voyage créé ! 🎉
                </h2>
                <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>
                  Partage ce code à tes amies :
                </p>
                <div style={{
                  backgroundColor: '#FFF5F0', borderRadius: '16px', padding: '24px',
                  textAlign: 'center', marginBottom: '24px', border: '1.5px solid #FFE8D6',
                }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: '#FF4D8D', letterSpacing: '8px' }}>
                    {createdCode}
                  </span>
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); setCreatedCode(null); loadTrips(); }}
                  style={{
                    width: '100%', padding: '18px', backgroundColor: '#FF4D8D',
                    border: 'none', borderRadius: '14px', color: 'white',
                    fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  Accéder au voyage
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '24px' }}>
                  Créer un voyage
                </h2>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nom du voyage
                </label>
                <input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="Ex: Barcelona Girls Trip"
                  style={{
                    width: '100%', padding: '14px', marginTop: '8px', marginBottom: '16px',
                    backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6',
                    borderRadius: '12px', fontSize: '16px', color: '#2D1B2E',
                  }}
                />
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Date de départ
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  style={{
                    width: '100%', padding: '14px', marginTop: '8px', marginBottom: '24px',
                    backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6',
                    borderRadius: '12px', fontSize: '16px', color: '#2D1B2E',
                  }}
                />
                {error && <p style={{ color: '#FF4D8D', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
                <button
                  onClick={handleCreateTrip}
                  style={{
                    width: '100%', padding: '18px', backgroundColor: '#FF4D8D',
                    border: 'none', borderRadius: '14px', color: 'white',
                    fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px',
                  }}
                >
                  {loading ? 'Création...' : 'Créer le voyage'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    width: '100%', padding: '12px', backgroundColor: 'transparent',
                    border: 'none', color: '#8B6B7A', fontSize: '15px', cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Rejoindre */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowJoinModal(false)}>
          <div
            style={{
              backgroundColor: 'white', borderRadius: '28px 28px 0 0',
              padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
              width: '100%', maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '8px' }}>
              Rejoindre un voyage
            </h2>
            <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>
              Entre le code partagé par l'organisatrice
            </p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              style={{
                width: '100%', padding: '14px', marginBottom: '24px',
                backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6',
                borderRadius: '12px', fontSize: '24px', color: '#2D1B2E',
                textAlign: 'center', letterSpacing: '8px', fontWeight: '700',
              }}
            />
            {error && <p style={{ color: '#FF4D8D', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <button
              onClick={handleJoinTrip}
              style={{
                width: '100%', padding: '18px', backgroundColor: '#FF4D8D',
                border: 'none', borderRadius: '14px', color: 'white',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px',
              }}
            >
              {loading ? 'Recherche...' : 'Rejoindre'}
            </button>
            <button
              onClick={() => setShowJoinModal(false)}
              style={{
                width: '100%', padding: '12px', backgroundColor: 'transparent',
                border: 'none', color: '#8B6B7A', fontSize: '15px', cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}