import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { supabase } from '../utils/supabase';
import { Copy, Plus, LogIn, Users, Calendar, X } from 'lucide-react';

export default function Compte() {
  const navigate = useNavigate();
  const { user, currentTrip, trips, loadTrips, createTrip, joinTrip, setCurrentTrip, updateTripDate } = useAppStore();

  const [members, setMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);
  const [newTripDate, setNewTripDate] = useState(currentTrip?.start_date || '');

  useEffect(() => {
    if (user) loadTrips();
  }, [user]);

  useEffect(() => {
    if (currentTrip) {
      loadMembers();
      setNewTripDate(currentTrip.start_date);
    }
  }, [currentTrip]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('trip_members')
      .select('user_id, users(*)')
      .eq('trip_id', currentTrip.id);
    if (data) setMembers(data.map((d) => d.users));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTrip?.code);
    alert(`Code copié : ${currentTrip?.code}`);
  };

  const handleUpdateDate = async () => {
    if (!newTripDate) return;
    await updateTripDate(currentTrip.id, newTripDate);
    setShowDatePicker(false);
  };

  const handleCreateTrip = async () => {
    if (!tripName.trim() || !tripDate.trim()) return;
    setLoading(true);
    try {
      const trip = await createTrip(tripName.trim(), tripDate.trim());
      setCreatedCode(trip.code);
      setTripName('');
      setTripDate('');
      await loadTrips();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      await joinTrip(joinCode.trim());
      await loadTrips();
      setShowJoinModal(false);
      setJoinCode('');
    } catch (error) {
      alert(error.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTrip = async (trip) => {
    if (!confirm(`Quitter "${trip.name}" ?`)) return;
    await supabase.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', user.id);
    await loadTrips();
    if (currentTrip?.id === trip.id) {
      const remaining = trips.filter((t) => t.id !== trip.id);
      setCurrentTrip(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length === 0) navigate('/trips');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#FFF5F0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', padding: '16px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        borderBottom: '1.5px solid #FFE8D6', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFB3D1', top: '-80px', right: '-60px', opacity: 0.2 }} />
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FF4D8D' }}>Compte</h1>
        <p style={{ fontSize: '14px', color: '#8B6B7A', marginTop: '2px' }}>Bonjour {user?.name} 👋</p>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {/* Voyage actuel */}
        {currentTrip && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>Voyage actuel</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1.5px solid #FFE8D6' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#2D1B2E', marginBottom: '16px' }}>{currentTrip.name}</h3>

              {/* Date */}
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#C4A0B5', letterSpacing: '1px', marginBottom: '8px' }}>DATE DE DÉPART</p>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  backgroundColor: '#FFF5F0', border: `1.5px solid ${showDatePicker ? '#FF4D8D' : '#FFE8D6'}`,
                  borderRadius: '12px', padding: '14px', cursor: 'pointer', marginBottom: '16px',
                }}
              >
                <Calendar size={18} color="#FF4D8D" />
                <span style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: '#2D1B2E', textAlign: 'left' }}>
                  {formatDate(currentTrip.start_date)}
                </span>
                <span style={{ fontSize: '12px', color: '#C4A0B5' }}>Modifier</span>
              </button>

              {showDatePicker && (
                <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6' }}>
                  <input
                    type="date"
                    value={newTripDate}
                    onChange={(e) => setNewTripDate(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', backgroundColor: 'white',
                      border: '1.5px solid #FFE8D6', borderRadius: '10px',
                      fontSize: '15px', color: '#2D1B2E', marginBottom: '12px',
                    }}
                  />
                  <button
                    onClick={handleUpdateDate}
                    style={{
                      width: '100%', padding: '12px', backgroundColor: '#FF4D8D',
                      border: 'none', borderRadius: '10px', color: 'white',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Confirmer la date
                  </button>
                </div>
              )}

              {/* Code */}
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#C4A0B5', letterSpacing: '1px', marginBottom: '8px' }}>CODE DU VOYAGE</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF4D8D', letterSpacing: '6px' }}>{currentTrip.code}</span>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      backgroundColor: '#FF4D8D', border: 'none', borderRadius: '10px',
                      padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Copy size={18} color="white" />
                  </button>
                </div>
              </div>

              {/* Membres */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Users size={16} color="#C4A0B5" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#C4A0B5' }}>
                  {members.length} membre{members.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map((member) => (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: '#FFF5F0', padding: '12px', borderRadius: '10px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '18px',
                      backgroundColor: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '15px', color: '#2D1B2E', fontWeight: '500' }}>{member.name}</span>
                    {member.id === user.id && (
                      <span style={{
                        marginLeft: 'auto', backgroundColor: '#FFE8D6',
                        padding: '3px 8px', borderRadius: '10px',
                        fontSize: '11px', color: '#8B6B7A', fontWeight: '600',
                      }}>MOI</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mes voyages */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>Mes voyages</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trips.map((trip) => (
              <div key={trip.id} style={{
                backgroundColor: 'white', borderRadius: '14px', padding: '16px',
                border: currentTrip?.id === trip.id ? '2px solid #FF4D8D' : '1.5px solid #FFE8D6',
                display: 'flex', alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#2D1B2E', marginBottom: '2px' }}>{trip.name}</p>
                  <p style={{ fontSize: '13px', color: '#8B6B7A' }}>
                    {new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {currentTrip?.id !== trip.id && (
                    <button
                      onClick={() => setCurrentTrip(trip)}
                      style={{
                        backgroundColor: '#FF4D8D', border: 'none', borderRadius: '8px',
                        padding: '6px 12px', color: 'white', fontSize: '12px',
                        fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      Switcher
                    </button>
                  )}
                  <button
                    onClick={() => handleLeaveTrip(trip)}
                    style={{
                      backgroundColor: '#FEE2E2', border: 'none', borderRadius: '8px',
                      padding: '6px 12px', color: '#DC2626', fontSize: '12px',
                      fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Quitter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '16px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '14px',
              color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
            }}
          >
            <Plus size={18} /> Créer un nouveau voyage
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '16px', backgroundColor: 'white', border: '1.5px solid #FFE8D6',
              borderRadius: '14px', color: '#FF4D8D', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            <LogIn size={18} /> Rejoindre un voyage
          </button>
        </div>
      </div>

      {/* Modal Créer */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => { setShowCreateModal(false); setCreatedCode(null); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)', width: '100%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}>
            {createdCode ? (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '8px' }}>Voyage créé ! 🎉</h2>
                <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>Partage ce code à tes amies :</p>
                <div style={{ backgroundColor: '#FFF5F0', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px', border: '1.5px solid #FFE8D6' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: '#FF4D8D', letterSpacing: '8px' }}>{createdCode}</span>
                </div>
                <button onClick={() => { setShowCreateModal(false); setCreatedCode(null); }}
                  style={{ width: '100%', padding: '18px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                  Fermer
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E' }}>Créer un voyage</h2>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} color="#C4A0B5" />
                  </button>
                </div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom du voyage</label>
                <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Ex: Barcelona Girls Trip"
                  style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '16px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date de départ</label>
                <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)}
                  style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '24px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
                <button onClick={handleCreateTrip} style={{ width: '100%', padding: '18px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
                  {loading ? 'Création...' : 'Créer le voyage'}
                </button>
                <button onClick={() => setShowCreateModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#8B6B7A', fontSize: '15px', cursor: 'pointer' }}>
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Rejoindre */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowJoinModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)', width: '100%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '8px' }}>Rejoindre un voyage</h2>
            <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '24px' }}>Entre le code partagé par l'organisatrice</p>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123"
              style={{ width: '100%', padding: '14px', marginBottom: '24px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '24px', color: '#2D1B2E', textAlign: 'center', letterSpacing: '8px', fontWeight: '700' }} />
            <button onClick={handleJoinTrip} style={{ width: '100%', padding: '18px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
              {loading ? 'Recherche...' : 'Rejoindre'}
            </button>
            <button onClick={() => setShowJoinModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#8B6B7A', fontSize: '15px', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}