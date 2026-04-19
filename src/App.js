import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function genSessionId() {
  return 'session_' + Math.random().toString(36).slice(2, 10);
}

function getOrCreateSessionId() {
  let id = localStorage.getItem('askragify_session');
  if (!id) { id = genSessionId(); localStorage.setItem('askragify_session', id); }
  return id;
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#061008" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#061008" stroke="none" />
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

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function App() {
  const [tab, setTab]                     = useState('chat');
  const [messages, setMessages]           = useState([]);
  const [question, setQuestion]           = useState('');
  const [topK, setTopK]                   = useState(5);
  const [threshold, setThreshold]         = useState(0.75);
  const [loading, setLoading]             = useState(false);
  const [streaming, setStreaming]         = useState(true);
  const [sessionId]                       = useState(() => getOrCreateSessionId());
  const [sessions, setSessions]           = useState([]);
  const [ingestUrl, setIngestUrl]         = useState('');
  const [ingestLabel, setIngestLabel]     = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestLog, setIngestLog]         = useState([]);
  const [pdfFile, setPdfFile]             = useState(null);
  const [pdfLabel, setPdfLabel]           = useState('');
  const [pdfLoading, setPdfLoading]       = useState(false);
  const [sources, setSources]             = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [apiStatus, setApiStatus]         = useState('checking');
  const [expandedSource, setExpandedSource] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  // API health check
  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions list
  useEffect(() => {
    fetch(`${API_URL}/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {});
  }, []);

  // Load knowledge base sources when on ingest tab
  useEffect(() => {
    if (tab === 'ingest') loadSources();
  }, [tab]);

  const loadSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await fetch(`${API_URL}/sources`);
      const data = await res.json();
      setSources(data.sources || []);
    } catch (_) {}
    finally { setSourcesLoading(false); }
  };

  const handleIngest = async () => {
    if (!ingestUrl.trim()) return;
    setIngestLoading(true);
    const entry = { url: ingestUrl, label: ingestLabel, status: 'loading', time: new Date().toLocaleTimeString() };
    setIngestLog(prev => [entry, ...prev]);
    try {
      const res = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ingestUrl, label: ingestLabel || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Ingest failed');
      setIngestLog(prev => prev.map((e, i) => i === 0 ? { ...e, status: 'done', chunks: data.chunks_stored } : e));
      setIngestUrl('');
      setIngestLabel('');
      loadSources();
    } catch (err) {
      setIngestLog(prev => prev.map((e, i) => i === 0 ? { ...e, status: 'error', error: err.message } : e));
    } finally {
      setIngestLoading(false);
    }
  };

  const handlePdfIngest = async () => {
    if (!pdfFile) return;
    setPdfLoading(true);
    const entry = { url: pdfFile.name, label: pdfLabel || pdfFile.name, status: 'loading', time: new Date().toLocaleTimeString() };
    setIngestLog(prev => [entry, ...prev]);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      if (pdfLabel) formData.append('label', pdfLabel);
      const res = await fetch(`${API_URL}/ingest/pdf`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'PDF ingest failed');
      setIngestLog(prev => prev.map((e, i) => i === 0 ? { ...e, status: 'done', chunks: data.chunks_stored } : e));
      setPdfFile(null);
      setPdfLabel('');
      if (fileRef.current) fileRef.current.value = '';
      loadSources();
    } catch (err) {
      setIngestLog(prev => prev.map((e, i) => i === 0 ? { ...e, status: 'error', error: err.message } : e));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDeleteSource = async (url) => {
    if (!window.confirm(`Delete all chunks for "${url}"?`)) return;
    try {
      await fetch(`${API_URL}/sources?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
      loadSources();
    } catch (_) {}
  };

  const handleQuery = async () => {
    if (!question.trim() || loading) return;
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    if (streaming) {
      // Streaming mode
      const streamingMsgId = Date.now();
      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], fallback: false, streaming: true, id: streamingMsgId }]);
      try {
        const res = await fetch(`${API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userMsg.content,
            history: [],
            top_k: topK,
            similarity_threshold: threshold,
            session_id: sessionId,
            stream: true,
          }),
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
                setMessages(prev => prev.map(m =>
                  m.id === streamingMsgId ? { ...m, content: m.content + evt.content } : m
                ));
              } else if (evt.type === 'sources') {
                setMessages(prev => prev.map(m =>
                  m.id === streamingMsgId ? { ...m, sources: evt.sources, fallback: evt.used_fallback, streaming: false } : m
                ));
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        setMessages(prev => prev.map(m =>
          m.id === streamingMsgId ? { ...m, content: `Error: ${err.message}`, error: true, streaming: false } : m
        ));
      }
    } else {
      // Non-streaming mode
      try {
        const res = await fetch(`${API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userMsg.content,
            history: [],
            top_k: topK,
            similarity_threshold: threshold,
            session_id: sessionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Query failed');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          fallback: data.used_fallback,
        }]);
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
    localStorage.setItem('askragify_session', id);
    window.location.reload();
  };

  const statusLabel = apiStatus === 'checking' ? 'connecting...'
    : apiStatus === 'online' ? 'API online'
    : 'API offline';

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon"><BrandIcon /></div>
          <div>
            <div className="brand-name">Askragify</div>
            <div className="brand-sub">RAG · knowledge base</div>
          </div>
        </div>
        <div className="header-right">
          <div className="session-badge" title={`Session: ${sessionId}`}>
            <span className="session-dot" />
            <span className="session-label">{sessionId.slice(-6)}</span>
          </div>
          <div className="status-pill">
            <div className={`status-dot ${apiStatus}`} />
            <span className="status-label">{statusLabel}</span>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {[
          { id: 'chat',     label: 'Query' },
          { id: 'ingest',   label: 'Ingest' },
          { id: 'settings', label: 'Settings' },
        ].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-dot" />
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">

        {/* ════ CHAT ════ */}
        {tab === 'chat' && (
          <div className="chat-layout">
            <div className="chat-messages">
              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-glyph"><EmptyIcon /></div>
                  <div className="empty-title">Ask anything</div>
                  <div className="empty-sub">Search your knowledge base or just have a conversation.</div>
                  <div className="empty-steps">
                    <div className="empty-step">
                      <span className="step-num">1</span>
                      <div className="step-body">
                        <div className="step-title">Ingest a URL or PDF</div>
                        <div className="step-desc">Add pages or documents to your knowledge base.</div>
                        <button className="step-cta" onClick={() => setTab('ingest')}>Go to Ingest →</button>
                      </div>
                    </div>
                    <div className="empty-step">
                      <span className="step-num">2</span>
                      <div className="step-body">
                        <div className="step-title">Ask a question</div>
                        <div className="step-desc">Or just chat — Askragify answers from its own knowledge too.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`message message-${msg.role}${msg.error ? ' message-error' : ''}`}>
                  <div className="message-role">
                    <span className="role-dot" />
                    {msg.role === 'user' ? 'YOU' : 'ASKRAGIFY'}
                    {msg.fallback && <span className="fallback-badge">model knowledge</span>}
                    {msg.streaming && <span className="streaming-badge">typing...</span>}
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
                          <div className="source-item-header" onClick={() => setExpandedSource(expandedSource === `${i}-${si}` ? null : `${i}-${si}`)}>
                            <span className="source-num">[{si + 1}]</span>
                            <a href={s.url.startsWith('pdf://') ? '#' : s.url} target="_blank" rel="noreferrer" className="source-url" onClick={e => s.url.startsWith('pdf://') && e.preventDefault()}>
                              {s.url.replace('pdf://', '')}
                            </a>
                            <span className="source-toggle">{expandedSource === `${i}-${si}` ? '▲' : '▼'}</span>
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
                  <div className="message-role"><span className="role-dot" />ASKRAGIFY</div>
                  <div className="typing"><span /><span /><span /></div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <div className="input-top">
                <span className="msg-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                <div className="input-top-right">
                  <button className="new-session-btn" onClick={newSession} title="Start new session">+ New session</button>
                  {messages.length > 0 && <button className="clear-btn" onClick={clearChat}>Clear chat</button>}
                </div>
              </div>
              <div className="input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask a question or just say hey..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={loading}
                />
                <button className="send-btn" onClick={handleQuery} disabled={loading || !question.trim()}>
                  {loading && !streaming ? <span style={{ color: '#061008', fontSize: 16 }}>...</span> : <SendIcon />}
                </button>
              </div>
              <div className="input-hint">Enter to send · Shift+Enter for new line · {streaming ? 'Streaming on' : 'Streaming off'}</div>
            </div>
          </div>
        )}

        {/* ════ INGEST ════ */}
        {tab === 'ingest' && (
          <div className="ingest-layout">

            {/* URL ingest */}
            <div className="panel">
              <div className="panel-title">Add URL to knowledge base</div>
              <div className="field-group">
                <label className="field-label">URL</label>
                <input className="field-input" type="url" placeholder="https://example.com/article"
                  value={ingestUrl} onChange={e => setIngestUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleIngest()} />
              </div>
              <div className="field-group">
                <label className="field-label">Label <span className="optional">(optional)</span></label>
                <input className="field-input" type="text" placeholder="e.g. docs, blog, research"
                  value={ingestLabel} onChange={e => setIngestLabel(e.target.value)} />
              </div>
              <button className="ingest-btn" onClick={handleIngest} disabled={ingestLoading || !ingestUrl.trim()}>
                {ingestLoading ? 'Ingesting...' : 'Ingest URL →'}
              </button>
            </div>

            {/* PDF ingest */}
            <div className="panel">
              <div className="panel-title">Upload PDF</div>
              <div className="field-group">
                <label className="field-label">PDF file</label>
                <input ref={fileRef} className="field-input file-input" type="file" accept=".pdf"
                  onChange={e => setPdfFile(e.target.files[0] || null)} />
              </div>
              <div className="field-group">
                <label className="field-label">Label <span className="optional">(optional)</span></label>
                <input className="field-input" type="text" placeholder="e.g. research-paper"
                  value={pdfLabel} onChange={e => setPdfLabel(e.target.value)} />
              </div>
              <button className="ingest-btn" onClick={handlePdfIngest} disabled={pdfLoading || !pdfFile}>
                {pdfLoading ? 'Processing PDF...' : 'Upload & Ingest PDF →'}
              </button>
            </div>

            {/* Ingest log */}
            {ingestLog.length > 0 && (
              <div className="ingest-log">
                <div className="log-title">Ingest log</div>
                {ingestLog.map((entry, i) => (
                  <div key={i} className={`log-entry log-${entry.status}`}>
                    <div className="log-url">{entry.url}</div>
                    <div className="log-meta">
                      {entry.label && <span className="log-chip">{entry.label}</span>}
                      <span>{entry.time}</span>
                      {entry.status === 'loading' && <span className="log-status">ingesting...</span>}
                      {entry.status === 'done'    && <span className="log-status">✓ {entry.chunks} chunks stored</span>}
                      {entry.status === 'error'   && <span className="log-status err">✕ {entry.error}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Knowledge base */}
            <div className="panel">
              <div className="panel-title-row">
                <div className="panel-title">Knowledge base</div>
                <button className="refresh-btn" onClick={loadSources}>↻ Refresh</button>
              </div>
              {sourcesLoading && <div className="sources-loading">Loading...</div>}
              {!sourcesLoading && sources.length === 0 && (
                <div className="sources-empty">No sources ingested yet.</div>
              )}
              {!sourcesLoading && sources.map((s, i) => (
                <div key={i} className="kb-row">
                  <div className="kb-info">
                    <div className="kb-url">{s.url.replace('pdf://', '📄 ')}</div>
                    <div className="kb-meta">
                      {s.label && <span className="log-chip">{s.label}</span>}
                      <span className="kb-chunks">{s.chunks} chunks</span>
                    </div>
                  </div>
                  <button className="kb-delete" onClick={() => handleDeleteSource(s.url)} title="Delete source">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {tab === 'settings' && (
          <div className="settings-layout">
            <div className="panel">
              <div className="panel-title">Retrieval</div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Top K results</div>
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
                  <div className="setting-desc">Minimum cosine similarity (0-1)</div>
                </div>
                <div className="setting-control">
                  <input type="range" min="0" max="1" step="0.05" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="slider" />
                  <span className="slider-val">{threshold.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Response</div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Streaming</div>
                  <div className="setting-desc">Show tokens as they're generated</div>
                </div>
                <button className={`toggle-btn ${streaming ? 'on' : 'off'}`} onClick={() => setStreaming(s => !s)}>
                  {streaming ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Session</div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Current session</div>
                  <div className="setting-desc">{sessionId}</div>
                </div>
                <button className="clear-btn" onClick={newSession}>New session</button>
              </div>
              {sessions.length > 0 && (
                <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div className="setting-name">All sessions</div>
                  <div className="sessions-list">
                    {sessions.map((s, i) => (
                      <div key={i} className={`session-item ${s === sessionId ? 'active' : ''}`}>
                        <span>{s}</span>
                        {s === sessionId && <span className="session-current">current</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">API</div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Backend URL</div>
                  <div className="setting-desc">{API_URL}</div>
                </div>
                <div className={`status-badge ${apiStatus}`}>{apiStatus}</div>
              </div>
            </div>

            <div className="panel danger-card">
              <div className="panel-title">Danger zone</div>
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
                    alert(data.message || 'Cleared');
                    loadSources();
                  } catch (e) { alert('Error: ' + e.message); }
                }}>Clear DB</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Clear conversation history</div>
                  <div className="setting-desc">Deletes saved messages for this session</div>
                </div>
                <button className="danger-btn" onClick={async () => {
                  if (!window.confirm('Clear conversation history?')) return;
                  await clearChat();
                  alert('Cleared.');
                }}>Clear History</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
