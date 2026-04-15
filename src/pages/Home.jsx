import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { MessageSquare, DollarSign, ClipboardList, CheckSquare, Square, ChevronRight, Plus, Trash2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { currentTrip, loadAllEventChecklists, toggleEventChecklistItem, loadTripChecklist, addTripChecklistItem, toggleTripChecklistItem, deleteTripChecklistItem } = useAppStore();

  const [eventChecklists, setEventChecklists] = useState([]);
  const [tripChecklist, setTripChecklist] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  useEffect(() => {
    if (currentTrip) {
      fetchChecklists();
      fetchTripChecklist();
    }
  }, [currentTrip?.id]);

  const fetchChecklists = async () => {
    try {
      const data = await loadAllEventChecklists();
      setEventChecklists(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTripChecklist = async () => {
    try {
      const data = await loadTripChecklist();
      setTripChecklist(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleEventItem = async (itemId, completed) => {
    await toggleEventChecklistItem(itemId, !completed);
    setEventChecklists((prev) =>
      prev.map((event) => ({
        ...event,
        checklist: event.checklist.map((item) =>
          item.id === itemId ? { ...item, completed: !completed } : item
        ),
      }))
    );
  };

  const handleToggleTripItem = async (itemId, completed) => {
    await toggleTripChecklistItem(itemId, !completed);
    setTripChecklist((prev) =>
      prev.map((item) => item.id === itemId ? { ...item, completed: !completed } : item)
    );
  };

  const handleDeleteTripItem = async (itemId) => {
    await deleteTripChecklistItem(itemId);
    setTripChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    const newItem = await addTripChecklistItem(newItemTitle.trim());
    setTripChecklist((prev) => [newItem, ...prev]);
    setNewItemTitle('');
    setShowAddModal(false);
  };

  const getDaysUntil = () => {
    if (!currentTrip?.start_date) return 0;
    const today = new Date();
    const tripDate = new Date(currentTrip.start_date);
    const diffTime = tripDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalTasks = [...eventChecklists.flatMap((e) => e.checklist), ...tripChecklist].length;
  const completedTasks = [...eventChecklists.flatMap((e) => e.checklist.filter((i) => i.completed)), ...tripChecklist.filter((i) => i.completed)].length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#FFF5F0', position: 'relative', overflow: 'hidden' }}>
      {/* Décoration */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: '#FFB3D1', top: '-80px', right: '-80px', opacity: 0.3 }} />
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFD6A5', bottom: '100px', left: '-60px', opacity: 0.25 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#FF4D8D', marginBottom: '16px', lineHeight: '38px' }}>
            {currentTrip?.name || 'Aucun voyage'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: '4px',
              backgroundColor: 'white', padding: '8px 14px',
              borderRadius: '20px', border: '1.5px solid #FFE8D6',
            }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FF4D8D' }}>{getDaysUntil()}</span>
              <span style={{ fontSize: '14px', color: '#8B6B7A', fontWeight: '500' }}> jours</span>
            </div>
            {currentTrip?.start_date && (
              <span style={{ fontSize: '13px', color: '#C4A0B5' }}>
                {new Date(currentTrip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[
            { path: '/discussion', icon: MessageSquare, color: '#FF4D8D', bg: '#FFE8F4', label: 'Discussion', sub: 'Mises à jour' },
            { path: '/budget', icon: DollarSign, color: '#FFB347', bg: '#FFF3E8', label: 'Budget', sub: 'Dépenses' },
            { path: '/organisation', icon: ClipboardList, color: '#FF6B6B', bg: '#FFE8F4', label: 'Organisation', sub: 'Idées et valise' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  flex: 1, backgroundColor: 'white', borderRadius: '20px',
                  padding: '14px', border: '1.5px solid #FFE8D6',
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 2px 8px rgba(255,77,141,0.08)',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  backgroundColor: item.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                }}>
                  <Icon size={22} color={item.color} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#2D1B2E', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: '#8B6B7A' }}>{item.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Checklists */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E' }}>Checklists</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {totalTasks > 0 && (
                <span style={{ fontSize: '14px', color: '#FF4D8D', fontWeight: '700' }}>{completedTasks}/{totalTasks}</span>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  width: '28px', height: '28px', borderRadius: '14px',
                  backgroundColor: '#FF4D8D', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} color="white" />
              </button>
            </div>
          </div>

          {totalTasks > 0 && (
            <div style={{ height: '5px', backgroundColor: '#FFE8D6', borderRadius: '3px', marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#FF4D8D', borderRadius: '3px', width: `${progress * 100}%`, transition: 'width 0.3s' }} />
            </div>
          )}

          {/* Tâches libres */}
          {tripChecklist.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '14px', marginBottom: '8px', border: '1.5px solid #FFE8D6' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#2D1B2E', marginBottom: '8px' }}>À faire</div>
              {tripChecklist.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                  <button onClick={() => handleToggleTripItem(item.id, item.completed)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {item.completed ? <CheckSquare size={18} color="#FF4D8D" /> : <Square size={18} color="#C4A0B5" />}
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', color: item.completed ? '#C4A0B5' : '#2D1B2E', textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.title}
                  </span>
                  <button onClick={() => handleDeleteTripItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Trash2 size={16} color="#FFB3D1" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checklists événements */}
          {eventChecklists.map((event) => (
            <div key={event.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '14px', marginBottom: '8px', border: '1.5px solid #FFE8D6' }}>
              <button
                onClick={() => navigate('/planning')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #FFE8D6' }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D1B2E' }}>{event.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#FF4D8D', fontWeight: '600' }}>
                    {event.checklist.filter((i) => i.completed).length}/{event.checklist.length}
                  </span>
                  <ChevronRight size={16} color="#C4A0B5" />
                </div>
              </button>
              {event.checklist.slice(0, 2).map((item) => (
                <button key={item.id} onClick={() => handleToggleEventItem(item.id, item.completed)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {item.completed ? <CheckSquare size={18} color="#FF4D8D" /> : <Square size={18} color="#C4A0B5" />}
                  <span style={{ fontSize: '13px', color: item.completed ? '#C4A0B5' : '#2D1B2E', textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.title}
                  </span>
                </button>
              ))}
              {event.checklist.length > 2 && (
                <button onClick={() => navigate('/planning')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#FF4D8D', fontWeight: '600', paddingLeft: '26px', marginTop: '4px' }}>
                  + {event.checklist.length - 2} autres
                </button>
              )}
            </div>
          ))}

          {totalTasks === 0 && tripChecklist.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', textAlign: 'center', border: '1.5px solid #FFE8D6' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D1B2E', marginBottom: '4px' }}>Aucune tâche</p>
              <p style={{ fontSize: '12px', color: '#C4A0B5' }}>Appuie sur + pour en ajouter une !</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajouter tâche */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowAddModal(false)}>
          <div
            style={{
              backgroundColor: 'white', borderRadius: '28px 28px 0 0',
              padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
              width: '100%', maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E', marginBottom: '20px' }}>
              Ajouter une tâche
            </h2>
            <input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Ex: Réserver le train"
              autoFocus
              style={{
                width: '100%', padding: '16px', marginBottom: '16px',
                backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6',
                borderRadius: '14px', fontSize: '16px', color: '#2D1B2E',
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemTitle.trim()}
              style={{
                width: '100%', padding: '18px',
                backgroundColor: !newItemTitle.trim() ? '#FFB3D1' : '#FF4D8D',
                border: 'none', borderRadius: '14px', color: 'white',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px',
              }}
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#8B6B7A', fontSize: '15px', cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}