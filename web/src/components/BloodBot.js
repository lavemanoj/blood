import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

const SUGGESTED = [
  'Am I eligible to donate?',
  'How long does donation take?',
  'What blood type is universal?',
  'How often can I donate?',
  'What should I eat before donating?',
  'Is it painful?',
  'What are the benefits?'
];

const WELCOME = {
  from: 'bot',
  text: "Hi! I'm HemoraBot 🩸 Ask me anything about blood donation — eligibility, process, blood types, recovery, or benefits!"
};

export default function BloodBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot/ask', { message: msg });
      const botMsg = { from: 'bot', text: res.data.answer };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <button style={styles.fab} className="bloodbot-fab" onClick={() => setOpen(o => !o)} title="HemoraBot — Ask about blood donation">
        {open ? '✕' : '🩸'}
        {!open && unread > 0 && <span style={styles.badge}>{unread}</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div style={styles.window} className="bloodbot-window">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.avatar}>🩸</span>
              <div>
                <div style={styles.botName}>HemoraBot</div>
                <div style={styles.botStatus}>● Online — Ask me anything</div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.msgRow, justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.from === 'bot' && <span style={styles.botAvatar}>🤖</span>}
                <div style={{ ...styles.bubble, ...(m.from === 'user' ? styles.userBubble : styles.botBubble) }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                <span style={styles.botAvatar}>🤖</span>
                <div style={styles.botBubble}>
                  <span style={styles.typing}><span /><span /><span /></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div style={styles.suggestions}>
              {SUGGESTED.map((s, i) => (
                <button key={i} style={styles.suggestion} onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              style={styles.input}
              placeholder="Ask about blood donation..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button style={styles.sendBtn} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
        .typing span { display: inline-block; width: 7px; height: 7px; background: #aaa; border-radius: 50%; margin: 0 2px; animation: bounce 1.2s infinite ease-in-out; }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </>
  );
}

const styles = {
  fab: { position: 'fixed', bottom: 28, right: 28, width: 56, height: 56, borderRadius: '50%', background: '#ff2d55', color: 'white', border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,45,85,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' },
  badge: { position: 'absolute', top: -4, right: -4, background: '#ff9f0a', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  window: { position: 'fixed', bottom: 96, right: 28, width: 360, maxHeight: 520, background: 'rgba(15,15,22,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(20px)' },
  header: { background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { fontSize: 22, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  botName: { color: 'white', fontWeight: 700, fontSize: 15 },
  botStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', padding: 4 },
  messages: { flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300 },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 6 },
  botAvatar: { fontSize: 18, flexShrink: 0 },
  bubble: { maxWidth: '80%', padding: '9px 13px', borderRadius: 14, fontSize: 13, lineHeight: 1.5 },
  botBubble: { background: 'rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '14px 14px 14px 2px', border: '1px solid rgba(255,255,255,0.1)' },
  userBubble: { background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', color: 'white', borderRadius: '14px 14px 2px 14px' },
  typing: { display: 'flex', alignItems: 'center', height: 20 },
  suggestions: { padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)' },
  suggestion: { background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.25)', borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: '#ffffff', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', WebkitTextFillColor: '#ffffff' },
  inputRow: { display: 'flex', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', gap: 8 },
  input: { flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 14px', fontSize: 13, outline: 'none', color: 'white', fontFamily: 'Inter, sans-serif' },
  sendBtn: { background: '#ff2d55', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
};
