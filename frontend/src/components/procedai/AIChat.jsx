import { useRef, useEffect } from "react";
import "../../style/AIChat.css";
import { useTranslation } from "react-i18next";
function SparkleIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
    </svg>
  );
}

function renderText(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <div key={i} className="pai-chat__bold">{line.slice(2, -2)}</div>;
    }
    return line ? <div key={i}>{line}</div> : <div key={i} style={{ height: 6 }} />;
  });
}

function TypingIndicator() {
  return (
    <div className="pai-chat__typing">
      <div className="pai-chat__typing-dots">
        <span /><span /><span />
      </div>
      <span className="pai-chat__typing-label">Generando…</span>
    </div>
  );
}

export default function AIChat({ isOpen, onToggle, messages, input, onInputChange, maxLength, onSend, loading, onAccept, onReject, customers = [], selectedCustomerId, onCustomerChange }) {
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const {t} = useTranslation();

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <>
          <div className="pai-chat__backdrop" onClick={onToggle} />
          <div className="pai-chat__panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="pai-chat__header">
              <div className="pai-chat__header-info">
                <div className="pai-chat__avatar"><SparkleIcon /></div>
                <div>
                  <div className="pai-chat__name">AI Assistant</div>
                  <div className="pai-chat__sub">Powered by Gemini</div>
                </div>
              </div>
              <button className="pai-chat__close-btn" onClick={onToggle}>
                <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                  <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="pai-chat__messages">
              {messages.length === 0 && (
                <div className="pai-chat__empty">Descrivi la procedura che vuoi generare</div>
              )}
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`pai-chat__msg${isUser ? " pai-chat__msg--user" : ""}`}>
                    {!isUser && <div className="pai-chat__msg-author">AI</div>}
                    <div className={`pai-chat__bubble${isUser ? " pai-chat__bubble--user" : ""}${msg.isError ? " pai-chat__bubble--error" : ""}`}>
                      {renderText(msg.text)}
                    </div>
                    {msg.recommendation && (
                      <div className="pai-chat__actions">
                        <button
                          className="pai-chat__accept"
                          onClick={() => onAccept(msg.recommendation)}
                          disabled={msg.recAccepted || msg.recRejected}
                        >
                          {msg.recAccepted ? "✓ Salvato" : "✓ Accetta e salva"}
                        </button>
                        <button
                          className="pai-chat__reject"
                          onClick={() => onReject(msg.recommendation)}
                          disabled={msg.recAccepted || msg.recRejected}
                        >
                          Scarta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && <TypingIndicator />}
              <div ref={endRef} />
            </div>

            {/* Cliente collegato (opzionale) */}
            {customers.length > 0 && (
              <div className="pai-chat__customer-row mb-1">
                <select
                  className="pai-chat__customer-select"
                  value={selectedCustomerId || ""}
                  onChange={e => onCustomerChange(e.target.value || null)}
                >
                  <option value="">{t("ai.no_customer_selected")}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Input */}
            <div className="pai-chat__input-row">
              <textarea
                className="pai-chat__textarea"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={t("ai.chat_placeholder")}
                maxLength={maxLength}
                rows={2}
              />
              <button className="pai-chat__send" onClick={onSend} disabled={loading || !input.trim()}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1={22} y1={2} x2={11} y2={13} />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            {maxLength && (
              <div className="pai-chat__char-count">{input.length}/{maxLength}</div>
            )}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        className={`pai-chat__fab${isOpen ? " pai-chat__fab--open" : ""}`}
        onClick={onToggle}
        title="AI Assistant"
      >
        {isOpen ? (
          <svg width={20} height={20} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
          </svg>
        ) : (
          <SparkleIcon size={20} />
        )}
      </button>
    </>
  );
}
