import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function genSessionId() {
  return 'session_' + Math.random().toString(36).slice(2, 10);
}
function getOrCreateSessionId() {
  let id = localStorage.getItem('ragify_session');
  if (!id) { id = genSessionId(); localStorage.setItem('ragify_session', id); }
  return id;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ down }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {down ? <polyline points="6 9 12 15 18 9" /> : <polyline points="6 15 12 9 18 15" />}
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.type === 'success' && <CheckIcon />}
          {t.type === 'error' && <XIcon size={13} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── URL Modal ─────────────────────────────────────────────────────────────────

function UrlModal({ onClose, onIngest, loading }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => { if (url.trim()) onIngest(url.trim(), label.trim()); };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title"><LinkIcon /> Add URL</div>
          <button className="modal-close" onClick={onClose}><XIcon size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">URL</label>
            <input
              ref={inputRef}
              className="field-input"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Label <span className="optional">— optional</span></label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. docs, blog, research"
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading || !url.trim()}>
            {loading ? <><span className="btn-spinner" /> Ingesting…</> : 'Add to knowledge base'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [tab, setTab]                       = useState('chat');
  const [messages, setMessages]             = useState([]);
  const [question, setQuestion]             = useState('');
  const [topK, setTopK]                     = useState(5);
  const [threshold, setThreshold]           = useState(0.75);
  const [loading, setLoading]               = useState(false);
  const [streaming, setStreaming]           = useState(true);
  const [sessionId]                         = useState(() => getOrCreateSessionId());
  const [sessions, setSessions]             = useState([]);
  const [sources, setSources]               = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [apiStatus, setApiStatus]           = useState('checking');
  const [expandedSource, setExpandedSource] = useState(null);
  const [theme, setTheme]                   = useState(() => localStorage.getItem('ragify_theme') || 'dark');
  const [attachOpen, setAttachOpen]         = useState(false);
  const [showUrlModal, setShowUrlModal]     = useState(false);
  const [urlLoading, setUrlLoading]         = useState(false);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [toasts, setToasts]                 = useState([]);

  const bottomRef   = useRef(null);
  const fileRef     = useRef(null);
  const attachRef   = useRef(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ragify_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch(`${API_URL}/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'settings') loadSources();
  }, [tab]);

  useEffect(() => {
    const handler = (e) => {
      if (attachRef.current && !attachRef.current.contains(e.target)) setAttachOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await fetch(`${API_URL}/sources`);
      const data = await res.json();
      setSources(data.sources || []);
    } catch (_) {}
    finally { setSourcesLoading(false); }
  };

  const handleIngestUrl = async (url, label) => {
    setUrlLoading(true);
    try {
      const res = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, label: label || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Ingest failed');
      addToast(`Added — ${data.chunks_stored} chunks indexed`);
      setShowUrlModal(false);
      loadSources();
    } catch (err) {
      addToast(err.message, 'error');
    } finally { setUrlLoading(false); }
  };

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachOpen(false);
    setPdfLoading(true);
    addToast(`Reading ${file.name}…`, 'info');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/ingest/pdf`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'PDF ingest failed');
      addToast(`${file.name} — ${data.chunks_stored} chunks indexed`);
      loadSources();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPdfLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteSource = async (url) => {
    if (!window.confirm(`Remove "${url}" from knowledge base?`)) return;
    try {
      await fetch(`${API_URL}/sources?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
      loadSources();
      addToast('Source removed');
    } catch (_) {}
  };

  const handleQuery = async () => {
    if (!question.trim() || loading) return;
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    if (streaming) {
      const streamingMsgId = Date.now();
      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], fallback: false, streaming: true, id: streamingMsgId }]);
      try {
        const res = await fetch(`${API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userMsg.content, history: [], top_k: topK, similarity_threshold: threshold, session_id: sessionId, stream: true }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === 'token') {
                setMessages(prev => prev.map(m => m.id === streamingMsgId ? { ...m, content: m.content + evt.content } : m));
              } else if (evt.type === 'sources') {
                setMessages(prev => prev.map(m => m.id === streamingMsgId ? { ...m, sources: evt.sources, fallback: evt.used_fallback, streaming: false } : m));
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        setMessages(prev => prev.map(m => m.id === streamingMsgId ? { ...m, content: `Error: ${err.message}`, error: true, streaming: false } : m));
      }
    } else {
      try {
        const res = await fetch(`${API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userMsg.content, history: [], top_k: topK, similarity_threshold: threshold, session_id: sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Query failed');
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources, fallback: data.used_fallback }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, error: true }]);
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(); }
  };

  const clearChat = async () => {
    setMessages([]);
    try { await fetch(`${API_URL}/history/${sessionId}`, { method: 'DELETE' }); } catch (_) {}
  };

  const newSession = () => {
    const id = genSessionId();
    localStorage.setItem('ragify_session', id);
    window.location.reload();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Toast toasts={toasts} />

      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfChange} />

      {showUrlModal && (
        <UrlModal onClose={() => setShowUrlModal(false)} onIngest={handleIngestUrl} loading={urlLoading} />
      )}

      <div className="accent-bar" />

      <header className="header">
        <div className="brand">
          <div className="brand-icon"><BrandIcon /></div>
          <div>
            <div className="brand-name">Ragify</div>
            <div className="brand-sub">RAG · knowledge base</div>
          </div>
        </div>
        <div className="header-right">
          <div className={`status-pill status-pill--${apiStatus}`}>
            <div className={`status-dot ${apiStatus}`} />
            <span className="status-label">{apiStatus === 'checking' ? 'connecting' : apiStatus}</span>
          </div>
          <button className="icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className={`icon-btn ${tab === 'settings' ? 'icon-btn--active' : ''}`}
            onClick={() => setTab(t => t === 'settings' ? 'chat' : 'settings')}
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <main className="main">

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className="chat-layout">
            <div className="chat-messages">

              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-glyph"><BrandIcon /></div>
                  <div className="empty-title">Ask me anything</div>
                  <div className="empty-sub">
                    I'll answer from your knowledge base, or from my own knowledge if nothing's been added yet.
                    Use <strong>Attach</strong> below to add a URL or PDF at any time.
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`message message-${msg.role}${msg.error ? ' message-error' : ''}`}>
                  <div className="message-meta">
                    <span className="role-label">{msg.role === 'user' ? 'You' : 'Ragify'}</span>
                    {msg.fallback && <span className="tag tag--dim">general knowledge</span>}
                    {msg.streaming && <span className="tag tag--dim">typing…</span>}
                  </div>
                  <div className="message-content">
                    {msg.content}
                    {msg.streaming && <span className="cursor-blink">▍</span>}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources">
                      <div className="sources-label">Sources</div>
                      {msg.sources.map((s, si) => (
                        <div key={si} className="source-item-wrap">
                          <div
                            className="source-item-header"
                            onClick={() => setExpandedSource(expandedSource === `${i}-${si}` ? null : `${i}-${si}`)}
                          >
                            <span className="source-num">{si + 1}</span>
                            <span className="source-url">{s.url.replace('pdf://', '')}</span>
                            <ChevronIcon down={expandedSource !== `${i}-${si}`} />
                          </div>
                          {expandedSource === `${i}-${si}` && (
                            <div className="source-preview">{s.chunk}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && !streaming && (
                <div className="message message-assistant">
                  <div className="message-meta"><span className="role-label">Ragify</span></div>
                  <div className="typing"><span /><span /><span /></div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div className="chat-input-area">
              <div className="input-box">
                <textarea
                  className="chat-input"
                  placeholder="Message Ragify…"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                />
                <div className="input-actions">
                  {/* Attach */}
                  <div className="attach-wrap" ref={attachRef}>
                    <button
                      className={`attach-btn${attachOpen ? ' attach-btn--open' : ''}`}
                      onClick={() => setAttachOpen(o => !o)}
                      disabled={urlLoading || pdfLoading}
                      title="Add to knowledge base"
                    >
                      {(urlLoading || pdfLoading)
                        ? <span className="btn-spinner btn-spinner--sm" />
                        : <PaperclipIcon />
                      }
                      <span className="attach-label">Attach</span>
                    </button>

                    {attachOpen && (
                      <div className="attach-menu">
                        <button className="attach-option" onClick={() => { setAttachOpen(false); setShowUrlModal(true); }}>
                          <span className="attach-option-icon"><LinkIcon /></span>
                          <div>
                            <div className="attach-option-label">Add URL</div>
                            <div className="attach-option-desc">Fetch and index a web page</div>
                          </div>
                        </button>
                        <button className="attach-option" onClick={() => { setAttachOpen(false); fileRef.current?.click(); }}>
                          <span className="attach-option-icon"><FileIcon /></span>
                          <div>
                            <div className="attach-option-label">Upload PDF</div>
                            <div className="attach-option-desc">Parse and index a document</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Send */}
                  <button className="send-btn" onClick={handleQuery} disabled={loading || !question.trim()}>
                    {loading && !streaming
                      ? <span className="btn-spinner btn-spinner--inv" />
                      : <SendIcon />
                    }
                  </button>
                </div>
              </div>

              <div className="input-footer">
                {messages.length > 0 && (
                  <button className="ghost-btn ghost-btn--sm" onClick={clearChat}>Clear chat</button>
                )}
                <button className="ghost-btn ghost-btn--sm" onClick={newSession}>New session</button>
                <span className="footer-divider" />
                <span className="hint-text">↵ send · ⇧↵ newline</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div className="settings-layout">

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Knowledge base</div>
                <button className="ghost-btn ghost-btn--sm" onClick={loadSources}>Refresh</button>
              </div>
              {sourcesLoading && <div className="dim-text">Loading…</div>}
              {!sourcesLoading && sources.length === 0 && (
                <div className="dim-text">No sources yet. Use the Attach button in chat to add URLs or PDFs.</div>
              )}
              {!sourcesLoading && sources.map((s, i) => (
                <div key={i} className="kb-row">
                  <div className="kb-info">
                    <div className="kb-url">{s.url.replace('pdf://', '📄 ')}</div>
                    <div className="kb-meta">
                      {s.label && <span className="tag">{s.label}</span>}
                      <span className="dim-text">{s.chunks} chunks</span>
                    </div>
                  </div>
                  <button className="kb-delete" onClick={() => handleDeleteSource(s.url)}><XIcon size={11} /></button>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-header"><div className="panel-title">Retrieval</div></div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Top K</div>
                  <div className="setting-desc">Chunks retrieved per query</div>
                </div>
                <div className="setting-control">
                  <input type="range" min="1" max="20" value={topK} onChange={e => setTopK(Number(e.target.value))} className="slider" />
                  <span className="slider-val">{topK}</span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Similarity threshold</div>
                  <div className="setting-desc">Minimum match score (0–1)</div>
                </div>
                <div className="setting-control">
                  <input type="range" min="0" max="1" step="0.05" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="slider" />
                  <span className="slider-val">{threshold.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><div className="panel-title">Response</div></div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Streaming</div>
                  <div className="setting-desc">Show tokens as they're generated</div>
                </div>
                <button className={`toggle-btn ${streaming ? 'on' : 'off'}`} onClick={() => setStreaming(s => !s)}>
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                  {streaming ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><div className="panel-title">Session</div></div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Current</div>
                  <div className="setting-desc setting-desc--mono">{sessionId}</div>
                </div>
                <button className="ghost-btn" onClick={newSession}>New session</button>
              </div>
              {sessions.length > 0 && (
                <div className="sessions-list">
                  {sessions.map((s, i) => (
                    <div key={i} className={`session-item ${s === sessionId ? 'active' : ''}`}>
                      <span>{s}</span>
                      {s === sessionId && <span className="tag tag--dim">current</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header"><div className="panel-title">API</div></div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Backend</div>
                  <div className="setting-desc setting-desc--mono">{API_URL}</div>
                </div>
                <div className={`status-badge status-badge--${apiStatus}`}>{apiStatus}</div>
              </div>
            </div>

            <div className="panel panel--danger">
              <div className="panel-header"><div className="panel-title">Danger zone</div></div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Clear all documents</div>
                  <div className="setting-desc">Permanently deletes all ingested content</div>
                </div>
                <button className="danger-btn" onClick={async () => {
                  if (!window.confirm('Delete ALL documents?')) return;
                  try {
                    const res = await fetch(`${API_URL}/clear`, { method: 'DELETE' });
                    const data = await res.json();
                    addToast(data.message || 'Cleared');
                    loadSources();
                  } catch (e) { addToast('Error: ' + e.message, 'error'); }
                }}>Clear DB</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Clear conversation</div>
                  <div className="setting-desc">Deletes messages for this session</div>
                </div>
                <button className="danger-btn" onClick={async () => {
                  if (!window.confirm('Clear conversation history?')) return;
                  await clearChat();
                  addToast('Conversation cleared');
                }}>Clear history</button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;