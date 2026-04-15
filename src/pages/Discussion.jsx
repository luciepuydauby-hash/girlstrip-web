import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';
import { supabase } from '../utils/supabase';
import { Send, Calendar, Package, DollarSign, Lightbulb, MessageCircle } from 'lucide-react';

export default function Discussion() {
  const { user, currentTrip, loadMessages, sendMessage, loadActivityFeed } = useAppStore();
  const [items, setItems] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setItems([]);
    fetchAll();

    const msgSub = supabase
      .channel(`messages:${currentTrip?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${currentTrip?.id}` },
        async (payload) => {
          const { data } = await supabase.from('messages').select('*, users!messages_user_id_fkey(name)').eq('id', payload.new.id).single();
          if (data) {
            setItems((prev) => [...prev, { ...data, itemType: 'message' }].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
          }
        }).subscribe();

    const actSub = supabase
      .channel(`activity:${currentTrip?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed', filter: `trip_id=eq.${currentTrip?.id}` },
        async (payload) => {
          const { data } = await supabase.from('activity_feed').select('*, users!activity_feed_user_id_fkey(name)').eq('id', payload.new.id).single();
          if (data) {
            setItems((prev) => [...prev, { ...data, itemType: 'activity' }].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
          }
        }).subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(actSub);
    };
  }, [currentTrip?.id]);

  const fetchAll = async () => {
    try {
      const [messages, activities] = await Promise.all([loadMessages(), loadActivityFeed()]);
      const allItems = [
        ...(messages || []).map((m) => ({ ...m, itemType: 'message' })),
        ...(activities || []).map((a) => ({ ...a, itemType: 'activity' })),
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setItems(allItems);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      await sendMessage(content);
    } catch (error) {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getInitiale = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const getMemberColor = (userId) => {
    const colors = ['#FF4D8D', '#FF6B6B', '#FFB347', '#FF85B3', '#FF4D8D', '#FFB3D1'];
    return colors[userId % colors.length];
  };

  const isMyMessage = (msg) => msg.user_id === user?.id;

  const getActivityIcon = (actionType) => {
    switch (actionType) {
      case 'event_created': return <Calendar size={13} color="#FF4D8D" />;
      case 'activity_added': return <Lightbulb size={13} color="#FFB347" />;
      case 'checklist_claimed': return <Package size={13} color="#FF6B6B" />;
      case 'budget_added': return <DollarSign size={13} color="#FFB347" />;
      default: return <MessageCircle size={13} color="#C4A0B5" />;
    }
  };

  const processedItems = items.map((item, index) => {
    if (item.itemType !== 'message') return item;
    const prevMsg = items.slice(0, index).reverse().find((i) => i.itemType === 'message');
    const nextMsg = items.slice(index + 1).find((i) => i.itemType === 'message');
    return {
      ...item,
      isFirst: !prevMsg || prevMsg.user_id !== item.user_id,
      isLast: !nextMsg || nextMsg.user_id !== item.user_id,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFF5F0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', padding: '16px 20px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        borderBottom: '1.5px solid #FFE8D6', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFB3D1', top: '-80px', right: '-60px', opacity: 0.2 }} />
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FF4D8D' }}>Discussion</h1>
        <p style={{ fontSize: '13px', color: '#C4A0B5', marginTop: '2px' }}>{currentTrip?.name}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2D1B2E', marginBottom: '8px' }}>Aucun message</h3>
            <p style={{ fontSize: '14px', color: '#C4A0B5' }}>Soyez la première à écrire !</p>
          </div>
        ) : (
          processedItems.map((item, index) => {
            if (item.itemType === 'activity') {
              return (
                <div key={`act-${item.id}`} style={{ textAlign: 'center', margin: '10px 0' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    backgroundColor: 'white', padding: '6px 14px', borderRadius: '20px',
                    border: '1.5px solid #FFE8D6', fontSize: '12px', color: '#8B6B7A',
                  }}>
                    {getActivityIcon(item.action_type)}
                    <span><strong style={{ color: '#FF4D8D' }}>{item.users?.name}</strong> {item.action_description}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#C4A0B5', marginTop: '4px' }}>{formatTime(item.created_at)}</div>
                </div>
              );
            }

            const isMine = isMyMessage(item);
            const color = getMemberColor(item.user_id);

            return (
              <div key={`msg-${item.id}`} style={{
                display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: '8px', marginBottom: '2px',
              }}>
                {!isMine && (
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '15px',
                    backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: item.isLast ? 1 : 0, flexShrink: 0,
                  }}>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{getInitiale(item.users?.name)}</span>
                  </div>
                )}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {item.isFirst && !isMine && (
                    <span style={{ fontSize: '12px', fontWeight: '700', color, marginBottom: '3px', marginLeft: '4px' }}>{item.users?.name}</span>
                  )}
                  {item.isFirst && isMine && (
                    <span style={{ fontSize: '10px', color: '#C4A0B5', marginBottom: '3px', marginRight: '4px' }}>{formatTime(item.created_at)}</span>
                  )}
                  <div style={{
                    padding: '10px 14px', borderRadius: '18px',
                    borderBottomRightRadius: isMine && !item.isLast ? '4px' : '18px',
                    borderBottomLeftRadius: !isMine && !item.isLast ? '4px' : '18px',
                    borderTopRightRadius: isMine && !item.isFirst ? '4px' : '18px',
                    borderTopLeftRadius: !isMine && !item.isFirst ? '4px' : '18px',
                    backgroundColor: isMine ? '#FF4D8D' : 'white',
                    border: isMine ? 'none' : '1.5px solid #FFE8D6',
                  }}>
                    <span style={{ fontSize: '15px', color: isMine ? 'white' : '#2D1B2E', lineHeight: '20px' }}>
                      {item.content}
                    </span>
                  </div>
                  {item.isLast && !isMine && (
                    <span style={{ fontSize: '10px', color: '#C4A0B5', marginTop: '3px', marginLeft: '4px' }}>{formatTime(item.created_at)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{
        backgroundColor: 'white', borderTop: '1.5px solid #FFE8D6',
        padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        display: 'flex', alignItems: 'flex-end', gap: '10px',
      }}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Écrire un message..."
          rows={1}
          style={{
            flex: 1, backgroundColor: '#FFF5F0', border: '1.5px solid #FFE8D6',
            borderRadius: '22px', padding: '10px 16px', fontSize: '15px',
            color: '#2D1B2E', resize: 'none', fontFamily: 'inherit',
            maxHeight: '100px', overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          style={{
            width: '44px', height: '44px', borderRadius: '22px',
            backgroundColor: !newMessage.trim() || sending ? '#FFE8D6' : '#FF4D8D',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
            boxShadow: !newMessage.trim() || sending ? 'none' : '0 3px 12px rgba(255,77,141,0.4)',
            flexShrink: 0,
          }}
        >
          <Send size={18} color={!newMessage.trim() || sending ? '#C4A0B5' : 'white'} />
        </button>
      </div>
    </div>
  );
}