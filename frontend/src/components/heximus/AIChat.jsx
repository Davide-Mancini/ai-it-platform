import { useRef, useEffect } from "react";
import "./AIChat.css";

function SparkleIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.5 4.5l1.4 1.4M10.1 10.1l1.4 1.4M4.5 11.5l1.4-1.4M10.1 5.9l1.4-1.4" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function ChatMessage({ msg, onAccept, onReject }) {
  const isUser = msg.role === "user";

  const renderText = (text) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <div key={i} className="hx-chat-msg__bold">{line.slice(2, -2)}</div>;
      }
      return line ? <div key={i}>{line}</div> : <div key={i} className="hx-chat-msg__spacer" />;
    });

  return (
    <div className={`hx-chat-msg${isUser ? " hx-chat-msg--user" : ""}`}>
      {!isUser && <span className="hx-chat-msg__author">AI</span>}
      <div className={`hx-chat-msg__bubble${isUser ? " hx-chat-msg__bubble--user" : ""}${msg.isError ? " hx-chat-msg__bubble--error" : ""}`}>
        {renderText(msg.text)}
      </div>
      {msg.recommendation && (
        <div className="hx-chat-msg__actions">
          <button className="hx-chat-msg__accept" onClick={() => onAccept(msg.recommendation)}>
            ✓ Accetta e salva
          </button>
          <button className="hx-chat-msg__reject" onClick={() => onReject(msg.recommendation)}>
            Scarta
          </button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="hx-chat-typing">
      <div className="hx-chat-typing__dots">
        <span /><span /><span />
      </div>
      <span className="hx-chat-typing__label">Generando…</span>
    </div>
  );
}

export default function AIChat({
  isOpen,
  onToggle,
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  onAccept,
  onReject,
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <>
          <div className="hx-chat-backdrop" onClick={onToggle} />
          <div className="hx-chat-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="hx-chat-panel__header">
              <div className="hx-chat-panel__header-info">
                <div className="hx-chat-panel__avatar">
                  <SparkleIcon size={17} />
                </div>
                <div>
                  <div className="hx-chat-panel__name">AI Assistant</div>
                  <div className="hx-chat-panel__sub">Genera procedure con Gemini</div>
                </div>
              </div>
              <button className="hx-chat-panel__close" onClick={onToggle}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="hx-chat-panel__messages">
              {messages.length === 0 && (
                <div className="hx-chat-panel__empty">Descrivi la procedura che vuoi generare</div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} onAccept={onAccept} onReject={onReject} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="hx-chat-panel__input-row">
              <textarea
                className="hx-chat-panel__textarea"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder="Descrivi la procedura… (Invio per inviare)"
                rows={2}
              />
              <button
                className="hx-chat-panel__send"
                onClick={onSend}
                disabled={loading || !input.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <polyline points="10 4 14 8 10 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* FAB */}
      <button
        className={`hx-chat-fab${isOpen ? " hx-chat-fab--open" : ""}`}
        onClick={onToggle}
        title="AI Assistant"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2.5 4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6l-3 2.4V10.5H3.5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </>
  );
}
