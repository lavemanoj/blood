import { useState, useEffect } from 'react';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

export default function ChatbotPanel({ onEligibilityResult }) {
  const [questions, setQuestions] = useState([]);
  const [sessionId] = useState(uuidv4());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    api.get('/chatbot/questions').then(r => setQuestions(r.data.questions)).catch(() => {});
    api.get('/chatbot/history').then(r => {
      if (r.data?.length > 0) setLastResult(r.data[0].eligibilityResult);
    }).catch(() => {});
  }, []);

  const handleAnswer = async (option) => {
    const q = questions[step];
    const newAnswers = [...answers, { question: q.question, answer: option, key: q.key, step: q.step }];
    setAnswers(newAnswers);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await api.post('/chatbot/submit', { sessionId, responses: newAnswers });
        setResult(res.data.eligibilityResult);
        setLastResult(res.data.eligibilityResult);
        if (onEligibilityResult) onEligibilityResult(res.data.eligibilityResult);
      } catch { }
      setLoading(false);
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setResult(null); };
  const current = questions[step];
  const progress = questions.length ? (step / questions.length) * 100 : 0;

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerIcon}>🩺</span>
        <div>
          <div style={S.headerTitle}>Eligibility Check</div>
          {lastResult && !result && (
            <div style={{ ...S.lastBadge, color: lastResult.eligible ? '#30d158' : '#ff453a' }}>
              Last: {lastResult.eligible ? '✅' : '❌'} {lastResult.score}/100
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={S.center}>
          <div className="spinner spinner-sm" style={{ margin: '0 auto 10px' }} />
          <p style={S.muted}>Analyzing your eligibility...</p>
        </div>
      )}

      {/* Result */}
      {!loading && result && (
        <div style={S.resultWrap}>
          <div style={S.resultEmoji}>{result.eligible ? '✅' : '❌'}</div>
          <div style={{ ...S.resultTitle, color: result.eligible ? '#30d158' : '#ff453a' }}>
            {result.eligible ? 'You are eligible!' : 'Not eligible right now'}
          </div>
          <div style={S.scoreRow}>
            <span style={{ ...S.scoreNum, color: result.score >= 60 ? '#30d158' : '#ff453a' }}>{result.score}</span>
            <span style={S.scoreDenom}>/100</span>
          </div>
          {result.reasons?.length > 0 && (
            <div style={S.reasons}>
              {result.reasons.map((r, i) => (
                <div key={i} style={S.reason}>⚠️ {r}</div>
              ))}
            </div>
          )}
          <button style={S.restartBtn} onClick={restart}>Check Again</button>
        </div>
      )}

      {/* Questions */}
      {!loading && !result && current && (
        <>
          <div style={S.progressBg}>
            <div style={{ ...S.progressFill, width: progress + '%' }} />
          </div>
          <div style={S.stepLabel}>Question {step + 1} of {questions.length}</div>
          <div style={S.question}>{current.question}</div>
          <div style={S.options}>
            {current.options.map(opt => (
              <button key={opt} style={S.optBtn} className="chatbot-opt-btn" onClick={() => handleAnswer(opt)}>
                {opt}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button style={S.backBtn} onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}>
              ← Back
            </button>
          )}
        </>
      )}

      {!loading && !result && !current && questions.length === 0 && (
        <div style={S.center}><p style={S.muted}>Loading questions...</p></div>
      )}
    </div>
  );
}

const S = {
  panel: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  headerIcon: { fontSize: 24, width: 40, height: 40, background: 'rgba(191,90,242,0.15)', border: '1px solid rgba(191,90,242,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontWeight: 700, fontSize: 14, color: 'white' },
  lastBadge: { fontSize: 11, marginTop: 2 },
  progressBg: { height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #ff2d55, #bf5af2)', borderRadius: 2, transition: 'width 0.3s' },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  question: { fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 16, lineHeight: 1.5 },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  optBtn: { 
    padding: '11px 14px', 
    background: 'rgba(255,255,255,0.06)', 
    border: '1px solid rgba(255,255,255,0.15)', 
    borderRadius: 10, 
    cursor: 'pointer', 
    fontSize: 13, 
    color: '#ffffff', 
    textAlign: 'left', 
    transition: 'all 0.15s', 
    fontFamily: 'Inter, sans-serif',
    WebkitTextFillColor: '#ffffff',
    display: 'block',
    width: '100%'
  },
  backBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', marginTop: 12, fontSize: 12, padding: 0 },
  center: { textAlign: 'center', padding: '20px 0' },
  muted: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  resultWrap: { textAlign: 'center' },
  resultEmoji: { fontSize: 40, marginBottom: 10 },
  resultTitle: { fontWeight: 700, fontSize: 15, marginBottom: 8 },
  scoreRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3, marginBottom: 14 },
  scoreNum: { fontSize: 36, fontWeight: 900 },
  scoreDenom: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  reasons: { background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)', borderRadius: 10, padding: '12px 14px', textAlign: 'left', marginBottom: 14 },
  reason: { fontSize: 12, color: '#ff9f0a', marginBottom: 4, lineHeight: 1.4 },
  restartBtn: { width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }
};
