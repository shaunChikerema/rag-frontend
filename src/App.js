import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function App() {
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);

  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestLabel, setIngestLabel] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestLog, setIngestLog] = useState([]);

  const [apiStatus, setApiStatus] = useState('checking');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (err) {
      setIngestLog(prev => prev.map((e, i) => i === 0 ? { ...e, status: 'error', error: err.message } : e));
    } finally {
      setIngestLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!question.trim() || loading) return;
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.content, history, top_k: topK, similarity_threshold: threshold }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Query failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const clearChat = () => setMessages([]);

  const statusLabel = apiStatus === 'checking' ? 'connecting…' : apiStatus === 'online' ? 'API online' : 'API offline';

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon"><BrandIcon /></div>
          <div>
            <div className="brand-name">RAG Engine</div>
            <div className="brand-sub">knowledge base</div>
          </div>
        </div>
        <div className="status-pill">
          <div className={`status-dot ${apiStatus}`} />
          <span className="status-label">{statusLabel}</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        <button className={`tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          <span className="tab-icon">◎</span> Query
        </button>
        <button className={`tab ${tab === 'ingest' ? 'active' : ''}`} onClick={() => setTab('ingest')}>
          <span className="tab-icon">⊕</span> Ingest
        </button>
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          <span className="tab-icon">⊡</span> Settings
        </button>
      </nav>

      {/* Main */}
      <main className="main">

        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <div className="chat-layout">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <div className="empty-glyph"><EmptyIcon /></div>
                  <p className="empty-title">Ask anything</p>
                  <p className="empty-sub">Ingest some URLs first, then query.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`message message-${msg.role} ${msg.error ? 'message-error' : ''}`}>
                  <div className="message-role">
                    <span className="role-dot" />
                    {msg.role === 'user' ? 'YOU' : 'RAG'}
                  </div>
                  <div className="message-content">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources">
                      <div className="sources-label">Sources</div>
                      {msg.sources.map((s, si) => (
                        <a key={si} href={s.url} target="_blank" rel="noreferrer" className="source-item">
                          <span className="source-num">[{si + 1}]</span>
                          <span className="source-url">{s.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="message message-assistant">
                  <div className="message-role">
                    <span className="role-dot" />
                    RAG
                  </div>
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <div className="input-top">
                <span className="msg-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                {messages.length > 0 && (
                  <button className="clear-btn" onClick={clearChat}>Clear chat</button>
                )}
              </div>
              <div className="input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask a question about your ingested content…"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={loading}
                />
                <button className="send-btn" onClick={handleQuery} disabled={loading || !question.trim()}>
                  {loading ? '…' : <SendIcon />}
                </button>
              </div>
              <div className="input-hint">Enter to send · Shift+Enter for new line</div>
            </div>
          </div>
        )}

        {/* ── INGEST TAB ── */}
        {tab === 'ingest' && (
          <div className="ingest-layout">
            <div className="panel">
              <div className="panel-title">Add URL to knowledge base</div>
              <div className="field-group">
                <label className="field-label">URL</label>
                <input
                  className="field-input"
                  type="url"
                  placeholder="https://example.com/article"
                  value={ingestUrl}
                  onChange={e => setIngestUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleIngest()}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Label <span className="optional">(optional)</span></label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. docs, blog, research"
                  value={ingestLabel}
                  onChange={e => setIngestLabel(e.target.value)}
                />
              </div>
              <button
                className="ingest-btn"
                onClick={handleIngest}
                disabled={ingestLoading || !ingestUrl.trim()}
              >
                {ingestLoading ? 'Ingesting…' : 'Ingest URL →'}
              </button>
            </div>

            {ingestLog.length > 0 && (
              <div className="ingest-log">
                <div className="log-title">Ingest log</div>
                {ingestLog.map((entry, i) => (
                  <div key={i} className={`log-entry log-${entry.status}`}>
                    <div className="log-url">{entry.url}</div>
                    <div className="log-meta">
                      {entry.label && <span className="log-chip">{entry.label}</span>}
                      <span>{entry.time}</span>
                      {entry.status === 'loading' && <span className="log-status">ingesting…</span>}
                      {entry.status === 'done'    && <span className="log-status">✓ {entry.chunks} chunks stored</span>}
                      {entry.status === 'error'   && <span className="log-status err">✕ {entry.error}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="settings-layout">
            <div className="panel">
              <div className="panel-title">Retrieval settings</div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Top K results</div>
                  <div className="setting-desc">Number of chunks retrieved per query</div>
                </div>
                <div className="setting-control">
                  <input
                    type="range" min="1" max="20" value={topK}
                    onChange={e => setTopK(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="slider-val">{topK}</span>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-name">Similarity threshold</div>
                  <div className="setting-desc">Minimum cosine similarity score (0–1)</div>
                </div>
                <div className="setting-control">
                  <input
                    type="range" min="0" max="1" step="0.05" value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="slider-val">{threshold.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">API connection</div>
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
                  <div className="setting-desc">Permanently deletes all ingested content from the database</div>
                </div>
                <button className="danger-btn" onClick={async () => {
                  if (!window.confirm('Delete ALL documents? This cannot be undone.')) return;
                  try {
                    const res = await fetch(`${API_URL}/clear`, { method: 'DELETE' });
                    const data = await res.json();
                    alert(data.message || 'Cleared');
                  } catch (e) {
                    alert('Error: ' + e.message);
                  }
                }}>
                  Clear DB
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;