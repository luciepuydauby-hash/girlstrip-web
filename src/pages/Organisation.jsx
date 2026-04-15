import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { Plus, X, Star, Calendar, DollarSign, Package, User } from 'lucide-react';

export default function Organisation() {
  const navigate = useNavigate();
  const { user, currentTrip, loadActivityIdeas, createActivityIdea, rateActivity, loadChecklistItems, createChecklistItem, claimChecklistItem, unclaimChecklistItem } = useAppStore();

  const [activeTab, setActiveTab] = useState('ideas');
  const [activityIdeas, setActivityIdeas] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [ratingInput, setRatingInput] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, [currentTrip?.id]);

  useEffect(() => {
    if (activeTab === 'checklist') fetchChecklist();
  }, [activeTab]);

  const fetchIdeas = async () => {
    try {
      const data = await loadActivityIdeas();
      setActivityIdeas(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChecklist = async () => {
    try {
      const data = await loadChecklistItems();
      setChecklistItems(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getUserRating = (activity) => activity.activity_rating?.find((r) => r.user_id === user?.id)?.rating || null;
  const getAverageRating = (activity) => {
    if (!activity.activity_rating?.length) return 0;
    return (activity.activity_rating.reduce((acc, r) => acc + r.rating, 0) / activity.activity_rating.length).toFixed(1);
  };
  const hasUserRated = (activity) => activity.activity_rating?.some((r) => r.user_id === user?.id);

  const unratedActivities = activityIdeas.filter((a) => !hasUserRated(a)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const ratedActivities = activityIdeas.filter((a) => hasUserRated(a)).sort((a, b) => parseFloat(getAverageRating(b)) - parseFloat(getAverageRating(a)));

  const handleSubmitProposal = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await createActivityIdea({ title: newTitle.trim(), description: newDescription.trim(), estimated_budget: parseFloat(newBudget) || 0, proposer_name: user?.name });
      await fetchIdeas();
      setNewTitle(''); setNewDescription(''); setNewBudget('');
      setShowProposalModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    const rating = parseFloat(ratingInput);
    if (!rating || rating < 1 || rating > 10) return;
    await rateActivity(selectedActivity.id, rating);
    await fetchIdeas();
    setRatingInput('');
    setShowDetailModal(false);
  };

  const handleAddChecklistItem = async () => {
    if (!newItemTitle.trim()) return;
    setLoading(true);
    try {
      await createChecklistItem(newItemTitle.trim(), newItemDescription.trim() || null);
      await fetchChecklist();
      setNewItemTitle(''); setNewItemDescription('');
      setShowAddItemModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const itemsToTake = checklistItems.filter((item) => !item.assigned_to);
  const myItems = checklistItems.filter((item) => item.assigned_to === user?.id);

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#FFF5F0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', padding: '16px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        borderBottom: '1.5px solid #FFE8D6',
      }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FF4D8D', marginBottom: '16px' }}>Organisation</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#FFF0F5', borderRadius: '12px', padding: '4px' }}>
          {[
            { id: 'ideas', label: "Idées d'activités" },
            { id: 'checklist', label: 'Dans ma valise' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === tab.id ? '#FF4D8D' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#C4A0B5',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(255,77,141,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {activeTab === 'ideas' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowProposalModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                <Plus size={16} /> Proposer
              </button>
            </div>

            {/* À noter */}
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>À noter</h2>
            {unratedActivities.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1.5px solid #FFE8D6', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Aucune activité à noter</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {unratedActivities.map((activity) => (
                  <button key={activity.id} onClick={() => { setSelectedActivity(activity); setShowDetailModal(true); }}
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1.5px solid #FFE8D6', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#2D1B2E', marginBottom: '4px' }}>{activity.title}</p>
                      <p style={{ fontSize: '13px', color: '#8B6B7A' }}>Proposé par {activity.proposer_name}</p>
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#92400E' }}>À NOTER</span>
                  </button>
                ))}
              </div>
            )}

            {/* Déjà notées */}
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>Déjà notées</h2>
            {ratedActivities.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Aucune activité notée</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ratedActivities.map((activity) => (
                  <button key={activity.id} onClick={() => { setSelectedActivity(activity); setShowDetailModal(true); }}
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1.5px solid #FFE8D6', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#2D1B2E', marginBottom: '4px' }}>{activity.title}</p>
                      <p style={{ fontSize: '13px', color: '#8B6B7A' }}>Proposé par {activity.proposer_name}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={18} color="#FFB347" fill="#FFB347" />
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E' }}>{getAverageRating(activity)}</span>
                      <span style={{ fontSize: '13px', color: '#C4A0B5' }}>/10</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowAddItemModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {/* À prendre */}
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>À prendre</h2>
            {itemsToTake.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1.5px solid #FFE8D6', marginBottom: '24px' }}>
                <Package size={40} color="#C4A0B5" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Aucun objet disponible</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {itemsToTake.map((item) => (
                  <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1.5px solid #FFE8D6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#2D1B2E', marginBottom: '4px' }}>{item.title}</p>
                      {item.description && <p style={{ fontSize: '13px', color: '#8B6B7A' }}>{item.description}</p>}
                    </div>
                    <button onClick={() => { claimChecklistItem(item.id); fetchChecklist(); }}
                      style={{ backgroundColor: '#FFE8F4', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#FF4D8D', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Prendre
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Mes objets */}
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#2D1B2E', marginBottom: '12px' }}>Mes objets</h2>
            {myItems.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1.5px solid #FFE8D6' }}>
                <User size={40} color="#C4A0B5" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Vous n'avez pas encore pris d'objets</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myItems.map((item) => (
                  <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '2px solid #FF4D8D', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#2D1B2E', marginBottom: '4px' }}>{item.title}</p>
                      {item.description && <p style={{ fontSize: '13px', color: '#8B6B7A' }}>{item.description}</p>}
                    </div>
                    <button onClick={() => { unclaimChecklistItem(item.id); fetchChecklist(); }}
                      style={{ backgroundColor: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#DC2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Libérer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Proposer */}
      {showProposalModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowProposalModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E' }}>Proposer une activité</h2>
              <button onClick={() => setShowProposalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#C4A0B5" /></button>
            </div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Titre *</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Visite du musée Picasso"
              style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '16px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Description</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Décrivez l'activité..." rows={3}
              style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '16px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E', resize: 'none', fontFamily: 'inherit' }} />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Budget estimé (€)</label>
            <input type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="Ex: 50"
              style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '24px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
            <button onClick={handleSubmitProposal} disabled={loading}
              style={{ width: '100%', padding: '18px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              {loading ? 'Envoi...' : "Proposer l'activité"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Détail activité */}
      {showDetailModal && selectedActivity && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowDetailModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E' }}>{selectedActivity.title}</h2>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#C4A0B5" /></button>
            </div>
            <p style={{ fontSize: '14px', color: '#8B6B7A', marginBottom: '16px' }}>Proposé par {selectedActivity.proposer_name}</p>

            {selectedActivity.description && (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#FF4D8D', marginBottom: '8px' }}>DESCRIPTION</p>
                <p style={{ fontSize: '15px', color: '#2D1B2E', lineHeight: '22px' }}>{selectedActivity.description}</p>
              </div>
            )}

            {selectedActivity.estimated_budget > 0 && (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#FF4D8D' }}>BUDGET ESTIMÉ</p>
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#FF4D8D' }}>{selectedActivity.estimated_budget}€</p>
              </div>
            )}

            {hasUserRated(selectedActivity) ? (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#8B6B7A', marginBottom: '8px' }}>Note moyenne</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Star size={32} color="#FFB347" fill="#FFB347" />
                  <span style={{ fontSize: '48px', fontWeight: '800', color: '#2D1B2E' }}>{getAverageRating(selectedActivity)}</span>
                  <span style={{ fontSize: '24px', color: '#C4A0B5' }}>/10</span>
                </div>
                <p style={{ fontSize: '13px', color: '#C4A0B5', marginTop: '8px' }}>Vous avez noté {getUserRating(selectedActivity)}/10</p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#FF4D8D', marginBottom: '12px' }}>VOTRE NOTE (sur 10)</p>
                <input type="number" value={ratingInput} onChange={(e) => setRatingInput(e.target.value)} placeholder="Ex: 8.5" min="1" max="10"
                  style={{ width: '100%', padding: '14px', marginBottom: '12px', backgroundColor: 'white', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
                <button onClick={handleSubmitRating}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#FF4D8D', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                  Valider ma note
                </button>
              </div>
            )}

            <button onClick={() => { setShowDetailModal(false); navigate('/planning'); }}
              style={{ width: '100%', padding: '16px', backgroundColor: '#FFE8F4', border: '1.5px solid #FFD6E8', borderRadius: '14px', color: '#FF4D8D', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Calendar size={18} /> Ajouter au planning
            </button>
          </div>
        </div>
      )}

      {/* Modal Ajouter objet */}
      {showAddItemModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowAddItemModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '28px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)', width: '100%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2D1B2E' }}>Ajouter un objet</h2>
              <button onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#C4A0B5" /></button>
            </div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Titre *</label>
            <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Ex: Crème solaire"
              style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '16px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E' }} />
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Description (optionnel)</label>
            <textarea value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} placeholder="Ex: SPF 50, format voyage" rows={3}
              style={{ width: '100%', padding: '14px', marginTop: '8px', marginBottom: '24px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '16px', color: '#2D1B2E', resize: 'none', fontFamily: 'inherit' }} />
            <button onClick={handleAddChecklistItem} disabled={!newItemTitle.trim() || loading}
              style={{ width: '100%', padding: '18px', backgroundColor: !newItemTitle.trim() ? '#FFB3D1' : '#FF4D8D', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              {loading ? 'Ajout...' : 'Ajouter à la liste'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}