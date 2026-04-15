import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { Plus, ChevronLeft, ChevronRight, Filter, X, Clock, DollarSign, Users, CheckSquare, Square, Trash2, Edit } from 'lucide-react';

export default function Planning() {
  const { loadEvents, createEvent, deleteEvent, updateEvent, loadEventChecklist, toggleEventChecklistItem, user, loadTripMembers, currentTrip } = useAppStore();

  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventFilter, setEventFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventChecklist, setSelectedEventChecklist] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('activity');
  const [eventDescription, setEventDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [budget, setBudget] = useState('');
  const [participants, setParticipants] = useState([]);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    setEvents([]);
    fetchEvents();
    fetchMembers();
  }, [currentTrip?.id]);

  const fetchEvents = async () => {
    try {
      const data = await loadEvents();
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await loadTripMembers();
      setMembers(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const openEventDetail = async (event) => {
    setSelectedEvent(event);
    try {
      const data = await loadEventChecklist(event.id);
      setSelectedEventChecklist(data || []);
    } catch (error) {
      setSelectedEventChecklist([]);
    }
    setShowDetailModal(true);
  };

  const startEdit = () => {
    setEventTitle(selectedEvent.title);
    setEventType(selectedEvent.type);
    setEventDescription(selectedEvent.description || '');
    setStartDate(selectedEvent.start_date);
    setEndDate(selectedEvent.end_date || '');
    setAllDay(selectedEvent.all_day || false);
    setStartTime(selectedEvent.start_time || '09:00');
    setEndTime(selectedEvent.end_time || '10:00');
    setBudget(selectedEvent.budget?.toString() || '');
    setParticipants(selectedEvent.participants || []);
    setChecklist([]);
    setEditMode(true);
    setShowDetailModal(false);
    setShowEventModal(true);
  };

  const resetForm = () => {
    setEventTitle(''); setEventType('activity'); setEventDescription('');
    setStartDate(new Date().toISOString().split('T')[0]); setEndDate('');
    setAllDay(false); setStartTime('09:00'); setEndTime('10:00');
    setBudget(''); setParticipants([]); setChecklist([]);
    setEditMode(false); setSelectedEvent(null);
  };

  const eventTypeColors = {
    transport: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', label: 'Transport' },
    accommodation: { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC', label: 'Hébergement' },
    activity: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'Activité' },
    specific_event: { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', label: 'Événement' },
  };

  const getWeekDays = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    const dow = firstDay.getDay();
    startDay.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      return d;
    });
  };

  const toDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const getEventsForDay = (day) => {
    const dayStr = toDateStr(day);
    return events.filter((event) => {
      if (eventFilter === 'mine') {
        const p = event.participants || [];
        if (p.length > 0 && !p.includes(user?.id)) return false;
      }
      return event.start_date === dayStr;
    });
  };

  const getEventsForDayAndHour = (day, hour) => {
    const dayStr = toDateStr(day);
    return events.filter((event) => {
      if (eventFilter === 'mine') {
        const p = event.participants || [];
        if (p.length > 0 && !p.includes(user?.id)) return false;
      }
      const eventHour = event.start_time ? parseInt(event.start_time.split(':')[0]) : 0;
      return event.start_date === dayStr && eventHour === hour;
    });
  };

  const isToday = (date) => toDateStr(date) === toDateStr(new Date());
  const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();

  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + direction);
    else if (view === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) return;
    setLoading(true);
    try {
      const eventData = {
        title: eventTitle, type: eventType, description: eventDescription,
        start_date: startDate, end_date: endDate || null,
        all_day: allDay, start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
        budget: budget ? parseFloat(budget) : null,
        participants, checklist,
      };
      if (editMode && selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
      } else {
        await createEvent(eventData);
      }
      await fetchEvents();
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Supprimer cet événement ?')) return;
    await deleteEvent(eventId);
    setShowDetailModal(false);
    await fetchEvents();
  };

  const timeSlots = [
    { label: 'Nuit', emoji: '🌙', hours: [0, 1, 2, 3, 4, 5] },
    { label: 'Matin', emoji: '🌅', hours: [6, 7, 8, 9, 10, 11] },
    { label: 'Après-midi', emoji: '☀️', hours: [12, 13, 14, 15, 16, 17] },
    { label: 'Soirée', emoji: '🌆', hours: [18, 19, 20, 21, 22, 23] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFF5F0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1.5px solid #FFE8D6',
        padding: '16px', paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FF4D8D' }}>Planning</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: eventFilter === 'mine' ? '#FF4D8D' : '#FFF0F5',
                border: '1.5px solid', borderColor: eventFilter === 'mine' ? '#FF4D8D' : '#FFD6E8',
                borderRadius: '20px', padding: '8px 14px', cursor: 'pointer',
                color: eventFilter === 'mine' ? 'white' : '#FF4D8D',
                fontSize: '13px', fontWeight: '600',
              }}
            >
              <Filter size={14} /> {eventFilter === 'all' ? 'Tous' : 'Moi'}
            </button>
            <button
              onClick={() => { setEditMode(false); setShowEventModal(true); }}
              style={{
                width: '42px', height: '42px', borderRadius: '21px',
                backgroundColor: '#FF4D8D', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(255,77,141,0.4)',
              }}
            >
              <Plus size={20} color="white" />
            </button>
          </div>
        </div>

        {showFilterMenu && (
          <div style={{
            position: 'absolute', right: '16px', top: '80px',
            backgroundColor: 'white', borderRadius: '12px', border: '1.5px solid #FFE8D6',
            boxShadow: '0 4px 16px rgba(255,77,141,0.15)', zIndex: 100, overflow: 'hidden',
          }}>
            {['all', 'mine'].map((f) => (
              <button key={f} onClick={() => { setEventFilter(f); setShowFilterMenu(false); }}
                style={{
                  display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: eventFilter === f ? '#FF4D8D' : '#8B6B7A',
                  fontWeight: eventFilter === f ? '700' : '500', fontSize: '14px',
                  borderBottom: f === 'all' ? '1px solid #FFF0F5' : 'none',
                }}
              >
                {f === 'all' ? 'Tous les événements' : 'Mes événements'}
              </button>
            ))}
          </div>
        )}

        {/* Vue + Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: '#FFF0F5', borderRadius: '12px', padding: '4px' }}>
            {['month', 'week', 'day'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                  backgroundColor: view === v ? '#FF4D8D' : 'transparent',
                  color: view === v ? 'white' : '#C4A0B5',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => navigate(-1)} style={{ padding: '8px', backgroundColor: '#FFF0F5', border: '1.5px solid #FFD6E8', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={22} color="#FF4D8D" />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#2D1B2E' }}>
              {view === 'month'
                ? currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                : view === 'week'
                ? `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                : currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => navigate(1)} style={{ padding: '8px', backgroundColor: '#FFF0F5', border: '1.5px solid #FFD6E8', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={22} color="#FF4D8D" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'month' && (
          <div style={{ backgroundColor: 'white', margin: '12px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #FFE8D6' }}>
            <div style={{ display: 'flex', backgroundColor: '#FFF0F5', borderBottom: '1px solid #FFE8D6' }}>
              {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((d) => (
                <div key={d} style={{ flex: 1, padding: '10px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#FF4D8D' }}>{d}</span>
                </div>
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, weekIndex) => (
              <div key={weekIndex} style={{ display: 'flex' }}>
                {monthDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <button key={dayIndex} onClick={() => { setCurrentDate(day); setView('day'); }}
                      style={{
                        flex: 1, minHeight: '72px', padding: '6px',
                        borderRight: dayIndex < 6 ? '1px solid #FFF0F5' : 'none',
                        borderBottom: weekIndex < 5 ? '1px solid #FFF0F5' : 'none',
                        background: 'none', cursor: 'pointer', textAlign: 'center',
                      }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '13px', margin: '0 auto 4px',
                        backgroundColor: isToday(day) ? '#FF4D8D' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: isToday(day) ? '800' : '400', color: isToday(day) ? 'white' : isCurrentMonth(day) ? '#2D1B2E' : '#C4A0B5' }}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} style={{ width: '5px', height: '5px', borderRadius: '3px', backgroundColor: eventTypeColors[event.type]?.border || '#FFB3D1' }} />
                        ))}
                        {dayEvents.length > 3 && <span style={{ fontSize: '8px', color: '#FF4D8D', fontWeight: '700' }}>+{dayEvents.length - 3}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {view === 'week' && (
          <>
            {/* Header jours */}
            <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1.5px solid #FFE8D6', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ width: '50px' }} />
              {weekDays.map((day, i) => (
                <button key={i} onClick={() => { setCurrentDate(day); setView('day'); }}
                  style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: isToday(day) ? '#FFF0F5' : 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: isToday(day) ? '#FF4D8D' : '#C4A0B5', marginBottom: '4px' }}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: isToday(day) ? '#FF4D8D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: isToday(day) ? 'white' : '#2D1B2E' }}>{day.getDate()}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Paquets d'heures */}
            {timeSlots.map((slot) => {
              const hasEvents = weekDays.some((day) => slot.hours.some((hour) => getEventsForDayAndHour(day, hour).length > 0));
              return (
                <div key={slot.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FFF0F5', borderBottom: '1px solid #FFE8D6', borderTop: '1px solid #FFE8D6' }}>
                    <span style={{ fontSize: '14px' }}>{slot.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#FF4D8D', flex: 1 }}>{slot.label}</span>
                    <span style={{ fontSize: '11px', color: '#C4A0B5' }}>{slot.hours[0].toString().padStart(2, '0')}h — {(slot.hours[slot.hours.length - 1] + 1).toString().padStart(2, '0')}h</span>
                  </div>
                  {slot.hours.map((hour) => {
                    const hasEventsThisHour = weekDays.some((day) => getEventsForDayAndHour(day, hour).length > 0);
                    return (
                      <div key={hour} style={{ display: 'flex', borderBottom: '1px solid #FFF0F5', minHeight: hasEventsThisHour ? '56px' : '28px' }}>
                        <div style={{ width: '50px', padding: '6px 8px 0 0', textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: '#C4A0B5' }}>{hour.toString().padStart(2, '0')}:00</span>
                        </div>
                        {weekDays.map((day, dayIndex) => {
                          const dayEvents = getEventsForDayAndHour(day, hour);
                          return (
                            <div key={dayIndex} style={{ flex: 1, borderLeft: '1px solid #FFF0F5', padding: '2px', backgroundColor: isToday(day) ? '#FFFBFD' : 'white' }}>
                              {dayEvents.map((event) => {
                                const colors = eventTypeColors[event.type] || { bg: '#FFF5F0', text: '#FF4D8D', border: '#FFB3D1' };
                                return (
                                  <button key={event.id} onClick={() => openEventDetail(event)}
                                    style={{ width: '100%', backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, borderRadius: '4px', padding: '3px', marginBottom: '2px', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: colors.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {event.start_time} {event.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {view === 'day' && (
          <>
            {hours.map((hour) => {
              const dayEvents = getEventsForDayAndHour(currentDate, hour);
              return (
                <div key={hour} style={{ display: 'flex', borderBottom: '1px solid #FFF0F5', minHeight: dayEvents.length > 0 ? '64px' : '40px' }}>
                  <div style={{ width: '50px', padding: '6px 8px 0 0', textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: '#C4A0B5' }}>{hour.toString().padStart(2, '0')}:00</span>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1.5px solid #FFE8D6', padding: '4px', backgroundColor: 'white' }}>
                    {dayEvents.map((event) => {
                      const colors = eventTypeColors[event.type] || { bg: '#FFF5F0', text: '#FF4D8D', border: '#FFB3D1' };
                      return (
                        <button key={event.id} onClick={() => openEventDetail(event)}
                          style={{ width: '100%', backgroundColor: colors.bg, borderLeft: `4px solid ${colors.border}`, borderRadius: '8px', padding: '8px', marginBottom: '4px', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: colors.text, display: 'block' }}>
                            {event.all_day ? 'Toute la journée' : event.start_time} {event.title}
                          </span>
                          {event.description && <span style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>{event.description}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal Détail */}
      {showDetailModal && selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowDetailModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '24px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#C4A0B5" /></button>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E' }}>Détails</span>
              <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={22} color="#FF4D8D" /></button>
            </div>

            {(() => {
              const colors = eventTypeColors[selectedEvent.type] || { bg: '#FFF5F0', text: '#FF4D8D', border: '#FFB3D1', label: 'Autre' };
              return (
                <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', backgroundColor: colors.bg, border: `1.5px solid ${colors.border}`, marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: colors.text }}>{colors.label}</span>
                </div>
              );
            })()}

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#2D1B2E', marginBottom: '16px' }}>{selectedEvent.title}</h2>

            <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1.5px solid #FFE8D6' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#FF4D8D', letterSpacing: '1px', marginBottom: '6px' }}>DATE</p>
              <p style={{ fontSize: '15px', color: '#2D1B2E', fontWeight: '500' }}>
                {new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {!selectedEvent.all_day && selectedEvent.start_time && (
                <p style={{ fontSize: '13px', color: '#8B6B7A', marginTop: '4px' }}>
                  {selectedEvent.start_time}{selectedEvent.end_time ? ` - ${selectedEvent.end_time}` : ''}
                </p>
              )}
            </div>

            {selectedEvent.description && (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#FF4D8D', letterSpacing: '1px', marginBottom: '6px' }}>DESCRIPTION</p>
                <p style={{ fontSize: '15px', color: '#2D1B2E', lineHeight: '22px' }}>{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.budget && (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1.5px solid #FFE8D6', display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#FF4D8D', letterSpacing: '1px' }}>BUDGET</p>
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#FF4D8D' }}>{selectedEvent.budget}€</p>
              </div>
            )}

            {selectedEventChecklist.length > 0 && (
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1.5px solid #FFE8D6' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#FF4D8D', letterSpacing: '1px', marginBottom: '12px' }}>
                  CHECKLIST — {selectedEventChecklist.filter((i) => i.completed).length}/{selectedEventChecklist.length}
                </p>
                {selectedEventChecklist.map((item) => (
                  <button key={item.id} onClick={async () => {
                    await toggleEventChecklistItem(item.id, !item.completed);
                    setSelectedEventChecklist((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: !item.completed } : i));
                  }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
                    {item.completed ? <CheckSquare size={20} color="#FF4D8D" /> : <Square size={20} color="#C4A0B5" />}
                    <span style={{ fontSize: '14px', color: item.completed ? '#C4A0B5' : '#2D1B2E', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</span>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => handleDelete(selectedEvent.id)}
              style={{ width: '100%', padding: '16px', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '14px', color: '#DC2626', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Supprimer l'événement
            </button>
          </div>
        </div>
      )}

      {/* Modal Créer/Modifier */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,27,46,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1.5px solid #FFE8D6' }}>
              <button onClick={() => { setShowEventModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#C4A0B5" /></button>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E' }}>{editMode ? 'Modifier' : 'Nouvel événement'}</span>
              <button onClick={handleCreateEvent} disabled={!eventTitle.trim() || loading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: !eventTitle.trim() || loading ? '#FFB3D1' : '#FF4D8D', fontSize: '16px', fontWeight: '700' }}>
                {loading ? '...' : editMode ? 'Sauvegarder' : 'Créer'}
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
              <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Titre de l'événement"
                style={{ width: '100%', fontSize: '20px', fontWeight: '700', color: '#2D1B2E', border: 'none', borderBottom: '2px solid #FFE8D6', paddingBottom: '12px', marginBottom: '20px', outline: 'none' }} />

              {/* Type */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {Object.entries(eventTypeColors).map(([type, colors]) => (
                  <button key={type} onClick={() => setEventType(type)}
                    style={{
                      padding: '8px 14px', borderRadius: '20px', border: '1.5px solid',
                      borderColor: eventType === type ? colors.border : '#FFE8D6',
                      backgroundColor: eventType === type ? colors.bg : '#FFF5F0',
                      color: eventType === type ? colors.text : '#8B6B7A',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    {colors.label}
                  </button>
                ))}
              </div>

              {/* Toute la journée */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF5F0', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1.5px solid #FFE8D6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#FF4D8D" />
                  <span style={{ fontSize: '15px', color: '#2D1B2E' }}>Toute la journée</span>
                </div>
                <button onClick={() => setAllDay(!allDay)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: allDay ? '#FF4D8D' : '#FFE8D6', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: 'white', position: 'absolute', top: '2px', transition: '0.2s', left: allDay ? '22px' : '2px' }} />
                </button>
              </div>

              {/* Dates */}
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A', marginBottom: '8px' }}>Date de début</p>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', marginBottom: '16px' }} />

              {!allDay && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A', marginBottom: '8px' }}>Heure de début</p>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', marginBottom: '16px' }} />
                </>
              )}

              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A', marginBottom: '8px' }}>Date de fin (optionnel)</p>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', marginBottom: '16px' }} />

              {!allDay && endDate && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A', marginBottom: '8px' }}>Heure de fin</p>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', marginBottom: '16px' }} />
                </>
              )}

              {/* Description */}
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A', marginBottom: '8px' }}>Description (optionnel)</p>
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Ajouter une description..." rows={3}
                style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', resize: 'none', fontFamily: 'inherit', marginBottom: '16px' }} />

              {/* Budget */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} color="#FF4D8D" />
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Budget (optionnel)</p>
              </div>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Montant en €"
                style={{ width: '100%', padding: '14px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '12px', fontSize: '15px', color: '#2D1B2E', marginBottom: '16px' }} />

              {/* Participants */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} color="#FF4D8D" />
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Participants (optionnel)</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {members.map((member) => {
                  const isSelected = participants.includes(member.id);
                  return (
                    <button key={member.id} onClick={() => setParticipants((prev) => isSelected ? prev.filter((id) => id !== member.id) : [...prev, member.id])}
                      style={{ padding: '8px 14px', borderRadius: '20px', border: '1.5px solid', borderColor: isSelected ? '#FFB3D1' : '#FFE8D6', backgroundColor: isSelected ? '#FFE8F4' : '#FFF5F0', color: isSelected ? '#FF4D8D' : '#8B6B7A', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      {member.name}
                    </button>
                  );
                })}
              </div>

              {/* Checklist */}
              {!editMode && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckSquare size={18} color="#FF4D8D" />
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#8B6B7A' }}>Checklist (optionnel)</p>
                  </div>
                  {checklist.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <button onClick={() => setChecklist((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: !i.completed } : i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {item.completed ? <CheckSquare size={20} color="#FF4D8D" /> : <Square size={20} color="#C4A0B5" />}
                      </button>
                      <input value={item.text} onChange={(e) => setChecklist((prev) => prev.map((i) => i.id === item.id ? { ...i, text: e.target.value } : i))}
                        placeholder="Tâche..."
                        style={{ flex: 1, padding: '10px', backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6', borderRadius: '10px', fontSize: '14px', color: '#2D1B2E' }} />
                      <button onClick={() => setChecklist((prev) => prev.filter((i) => i.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={18} color="#FFB3D1" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setChecklist((prev) => [...prev, { id: Date.now(), text: '', completed: false }])}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', backgroundColor: 'white', border: '1.5px dashed #FFD6E8', borderRadius: '12px', color: '#FF4D8D', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    <Plus size={16} /> Ajouter une tâche
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}