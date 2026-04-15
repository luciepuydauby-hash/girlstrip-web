import { create } from 'zustand';
import { supabase } from './supabase';

export const useAppStore = create((set, get) => ({
  user: null,
  currentTrip: null,
  trips: [],

  setUser: (user) => set({ user }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  createUser: async (prenom, email) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name: prenom, email }])
      .select()
      .single();
    if (error) throw error;
    set({ user: data });
    return data;
  },

  getUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email.toLowerCase())
      .single();
    if (error) return null;
    set({ user: data });
    return data;
  },

  createTrip: async (nom, dateDepart) => {
    const { user } = get();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('trips')
      .insert([{ name: nom, start_date: dateDepart, code }])
      .select()
      .single();
    if (error) throw error;
    await supabase.from('trip_members').insert([{ trip_id: data.id, user_id: user.id }]);
    set({ currentTrip: data });
    return data;
  },

  joinTrip: async (code) => {
    const { user } = get();
    const { data: trip, error } = await supabase
      .from('trips')
      .select()
      .eq('code', code.toUpperCase())
      .single();
    if (error) throw new Error("Voyage introuvable");
    const { data: existing } = await supabase
      .from('trip_members')
      .select()
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single();
    if (!existing) {
      await supabase.from('trip_members').insert([{ trip_id: trip.id, user_id: user.id }]);
    }
    set({ currentTrip: trip });
    return trip;
  },

  loadTrips: async () => {
    const { user } = get();
    const { data, error } = await supabase
      .from('trip_members')
      .select('trip_id, trips(*)')
      .eq('user_id', user.id);
    if (error) throw error;
    const trips = data.map((d) => d.trips);
    set({ trips });
    return trips;
  },

  loadTripMembers: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('trip_members')
      .select('user_id, users(*)')
      .eq('trip_id', currentTrip.id);
    if (error) throw error;
    return data.map((d) => d.users);
  },

  updateTripDate: async (tripId, newDate) => {
    const { data, error } = await supabase
      .from('trips')
      .update({ start_date: newDate })
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw error;
    set({ currentTrip: data });
    return data;
  },

  loadEvents: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('trip_id', currentTrip.id)
      .order('start_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  createEvent: async (eventData) => {
    const { user, currentTrip } = get();
    const { checklist, ...rest } = eventData;
    const { data: event, error } = await supabase
      .from('events')
      .insert([{ ...rest, trip_id: currentTrip.id, created_by: user.id }])
      .select()
      .single();
    if (error) throw error;
    if (checklist && checklist.length > 0) {
      const checklistItems = checklist
        .filter((item) => item.text.trim())
        .map((item) => ({ event_id: event.id, title: item.text, completed: item.completed }));
      if (checklistItems.length > 0) {
        await supabase.from('event_checklist').insert(checklistItems);
      }
    }
    await supabase.from('activity_feed').insert([{
      trip_id: currentTrip.id,
      user_id: user.id,
      action_type: 'event_created',
      action_description: `a créé l'événement "${rest.title}"`,
    }]);
    return event;
  },

  updateEvent: async (eventId, eventData) => {
    const { checklist, ...rest } = eventData;
    const { data, error } = await supabase
      .from('events')
      .update({ ...rest })
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteEvent: async (eventId) => {
    await supabase.from('event_checklist').delete().eq('event_id', eventId);
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
  },

  loadEventChecklist: async (eventId) => {
    const { data, error } = await supabase
      .from('event_checklist')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return data;
  },

  toggleEventChecklistItem: async (itemId, completed) => {
    const { error } = await supabase
      .from('event_checklist')
      .update({ completed })
      .eq('id', itemId);
    if (error) throw error;
  },

  loadAllEventChecklists: async () => {
    const { currentTrip } = get();
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('trip_id', currentTrip.id);
    if (eventsError) throw eventsError;
    const { data: checklist, error: checklistError } = await supabase
      .from('event_checklist')
      .select('*')
      .in('event_id', events.map((e) => e.id));
    if (checklistError) throw checklistError;
    return events.map((event) => ({
      ...event,
      checklist: checklist.filter((item) => item.event_id === event.id),
    })).filter((event) => event.checklist.length > 0);
  },

  loadActivityIdeas: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('activity_ideas')
      .select('*, activity_rating(*)')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createActivityIdea: async (ideaData) => {
    const { user, currentTrip } = get();
    const { data, error } = await supabase
      .from('activity_ideas')
      .insert([{ ...ideaData, trip_id: currentTrip.id, created_by: user.id }])
      .select()
      .single();
    if (error) throw error;
    await supabase.from('activity_feed').insert([{
      trip_id: currentTrip.id,
      user_id: user.id,
      action_type: 'activity_added',
      action_description: `a proposé l'activité "${ideaData.title}"`,
    }]);
    return data;
  },

  rateActivity: async (activityId, rating) => {
    const { user } = get();
    const { data: existing } = await supabase
      .from('activity_rating')
      .select()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .single();
    if (existing) {
      await supabase.from('activity_rating').update({ rating }).eq('id', existing.id);
    } else {
      await supabase.from('activity_rating').insert([{ activity_id: activityId, user_id: user.id, rating }]);
    }
  },

  loadChecklistItems: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*, users(name)')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createChecklistItem: async (title, description) => {
    const { user, currentTrip } = get();
    const { data, error } = await supabase
      .from('checklist_items')
      .insert([{ title, description, trip_id: currentTrip.id }])
      .select()
      .single();
    if (error) throw error;
    await supabase.from('activity_feed').insert([{
      trip_id: currentTrip.id,
      user_id: user.id,
      action_type: 'checklist_claimed',
      action_description: `a ajouté "${title}" à la valise`,
    }]);
    return data;
  },

  claimChecklistItem: async (itemId) => {
    const { user, currentTrip } = get();
    const { data, error } = await supabase
      .from('checklist_items')
      .update({ assigned_to: user.id })
      .eq('id', itemId)
      .select('*, users(name)')
      .single();
    if (error) throw error;
    await supabase.from('activity_feed').insert([{
      trip_id: currentTrip.id,
      user_id: user.id,
      action_type: 'checklist_claimed',
      action_description: `a pris en charge "${data.title}"`,
    }]);
    return data;
  },

  unclaimChecklistItem: async (itemId) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .update({ assigned_to: null })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  loadMessages: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('messages')
      .select('*, users!messages_user_id_fkey(name)')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data;
  },

  sendMessage: async (content) => {
    const { user, currentTrip } = get();
    const { data, error } = await supabase
      .from('messages')
      .insert([{ content, trip_id: currentTrip.id, user_id: user.id }])
      .select('*, users!messages_user_id_fkey(name)')
      .single();
    if (error) throw error;
    return data;
  },

  loadActivityFeed: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*, users!activity_feed_user_id_fkey(name)')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data;
  },

  loadTripChecklist: async () => {
    const { currentTrip } = get();
    const { data, error } = await supabase
      .from('trip_checklist')
      .select('*')
      .eq('trip_id', currentTrip.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addTripChecklistItem: async (title) => {
    const { user, currentTrip } = get();
    const { data, error } = await supabase
      .from('trip_checklist')
      .insert([{ title, trip_id: currentTrip.id, created_by: user.id, completed: false }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggleTripChecklistItem: async (itemId, completed) => {
    const { error } = await supabase
      .from('trip_checklist')
      .update({ completed })
      .eq('id', itemId);
    if (error) throw error;
  },

  deleteTripChecklistItem: async (itemId) => {
    const { error } = await supabase
      .from('trip_checklist')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },
}));