import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { ChevronDown, ChevronRight, DollarSign, Calendar } from 'lucide-react';

export default function Budget() {
  const navigate = useNavigate();
  const { loadEvents, loadTripMembers, user, currentTrip } = useAppStore();

  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvents([]);
    setMembers([]);
    fetchData();
  }, [currentTrip?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, membersData] = await Promise.all([loadEvents(), loadTripMembers()]);
      setEvents(eventsData?.filter((e) => e.budget) || []);
      setMembers(membersData || []);
      if (!selectedUserId && membersData?.length > 0) {
        const me = membersData.find((m) => m.id === user?.id);
        setSelectedUserId(me?.id || membersData[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = members.find((m) => m.id === selectedUserId);

  const eventTypeColors = {
    transport: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', label: 'Transport' },
    accommodation: { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC', label: 'Hébergement' },
    activity: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'Activité' },
    specific_event: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', label: 'Événement' },
  };

  const calculateUserShare = (event) => {
    if (!event.budget) return 0;
    const participants = event.participants || [];
    if (participants.length === 0) return event.budget;
    if (!participants.includes(selectedUserId)) return 0;
    return event.budget / participants.length;
  };

  const userEvents = events.filter((event) => {
    const participants = event.participants || [];
    return participants.length === 0 || participants.includes(selectedUserId);
  });

  const totalCost = userEvents.reduce((sum, event) => sum + calculateUserShare(event), 0);

  const eventsByType = userEvents.reduce((acc, event) => {
    if (!acc[event.type]) acc[event.type] = [];
    acc[event.type].push(event);
    return acc;
  }, {});

  const formatCurrency = (amount) => `${amount.toFixed(2)}€`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: '#C4A0B5' }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#FFF5F0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', padding: '16px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        borderBottom: '1.5px solid #FFE8D6', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFB3D1', top: '-80px', right: '-60px', opacity: 0.2 }} />
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FF4D8D', marginBottom: '12px' }}>Budget</h1>

        {/* Sélecteur */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#C4A0B5', letterSpacing: '1px', marginBottom: '8px' }}>VUE PERSONNELLE</p>
        <button
          onClick={() => setShowUserPicker(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '14px',
            padding: '12px', cursor: 'pointer',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>{selectedUser?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: '#2D1B2E', textAlign: 'left' }}>{selectedUser?.name}</span>
          <ChevronDown size={18} color="#FF4D8D" />
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {/* Total */}
        <div style={{
          backgroundColor: 'white', borderRadius: '20px', padding: '24px',
          textAlign: 'center', border: '1.5px solid #FFE8D6', marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(255,77,141,0.1)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '28px', backgroundColor: '#FFF0F5',
            border: '1.5px solid #FFD6E8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <DollarSign size={28} color="#FF4D8D" />
          </div>
          <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '8px', fontWeight: '500' }}>
            Coût total pour {selectedUser?.name}
          </p>
          <p style={{ fontSize: '52px', fontWeight: '800', color: '#FF4D8D', lineHeight: '1' }}>
            {formatCurrency(totalCost)}
          </p>
          <p style={{ fontSize: '13px', color: '#C4A0B5', marginTop: '8px' }}>
            {userEvents.length} événement{userEvents.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Détails */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E' }}>Détails des coûts</h2>
            <button onClick={() => navigate('/planning')} style={{ background: 'none', border: 'none', color: '#FF4D8D', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Voir le planning
            </button>
          </div>

          {userEvents.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1.5px solid #FFE8D6' }}>
              <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Aucun événement avec budget</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).map((event) => {
                const colors = eventTypeColors[event.type] || { bg: '#FFF5F0', text: '#FF4D8D', border: '#FFB3D1', label: 'Autre' };
                const userShare = calculateUserShare(event);
                const participantCount = event.participants?.length || 1;

                return (
                  <div key={event.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1.5px solid #FFE8D6' }}>
                    <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', backgroundColor: colors.bg, border: `1.5px solid ${colors.border}`, marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: colors.text }}>{colors.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1B2E', marginBottom: '6px' }}>{event.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#FFB347" />
                          <span style={{ fontSize: '13px', color: '#8B6B7A' }}>{formatDate(event.start_date)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '24px', fontWeight: '800', color: '#FF4D8D' }}>{formatCurrency(userShare)}</p>
                        <p style={{ fontSize: '11px', color: '#C4A0B5' }}>votre part</p>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#FFF5F0', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#8B6B7A' }}>Budget total</span>
                        <span style={{ fontSize: '13px', color: '#2D1B2E', fontWeight: '600' }}>{formatCurrency(event.budget)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#8B6B7A' }}>Partagé entre {participantCount} personne{participantCount > 1 ? 's' : ''}</span>
                        <span style={{ fontSize: '13px', color: '#8B6B7A' }}>÷ {participantCount}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#FF4D8D', fontWeight: '600' }}>Voir dans le planning</span>
                      <ChevronRight size={15} color="#FF4D8D" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Résumé par catégorie */}
        {userEvents.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>Résumé par catégorie</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(eventTypeColors).map(([type, colors]) => {
                const typeEvents = eventsByType[type] || [];
                const typeCost = typeEvents.reduce((sum, event) => sum + calculateUserShare(event), 0);
                if (typeEvents.length === 0) return null;
                return (
                  <div key={type} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid #FFE8D6' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '5px', backgroundColor: colors.border }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#2D1B2E' }}>{colors.label}</p>
                      <p style={{ fontSize: '12px', color: '#C4A0B5' }}>{typeEvents.length} événement{typeEvents.length > 1 ? 's' : ''}</p>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E' }}>{formatCurrency(typeCost)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal sélecteur */}
      {showUserPicker && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowUserPicker(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '28px 28px 0 0',
            padding: '24px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
            width: '100%', maxWidth: '500px',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#FFD6E8', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#2D1B2E', marginBottom: '16px' }}>Choisir un participant</h2>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => { setSelectedUserId(member.id); setShowUserPicker(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  backgroundColor: selectedUserId === member.id ? '#FFE8F4' : '#FFF5F0',
                  marginBottom: '8px',
                  outline: selectedUserId === member.id ? '1.5px solid #FFD6E8' : 'none',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '19px',
                  backgroundColor: selectedUserId === member.id ? '#FF4D8D' : '#FFE8D6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: selectedUserId === member.id ? 'white' : '#8B6B7A' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: selectedUserId === member.id ? '#FF4D8D' : '#2D1B2E', textAlign: 'left' }}>
                  {member.name} {member.id === user?.id ? '(moi)' : ''}
                </span>
                {selectedUserId === member.id && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}