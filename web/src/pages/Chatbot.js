import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

export default function Chatbot() {
  const [questions, setQuestions] = useState([]);
  const [sessionId] = useState(uuidv4());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/chatbot/questions').then(r => setQuestions(r.data.questions)).catch(() => {});
  }, []);

  const handleAnswer = async (option) => {
    const q = questions[step];
    const newAnswers = [...answers, { question: q.question, answer: option, key: q.key, step: q.step }];
    setAnswers(newAnswers);

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      // Submit
      setLoading(true);
      try {
        const res = await api.post('/chatbot/submit', { sessionId, responses: newAnswers });
        setResult(res.data.eligibilityResult);
      } catch { toast.error('Failed to get eligibility result'); }
      setLoading(false);
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setResult(null); };

  if (loading) return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Analyzing your eligibility...</p>
        </div>
      </div>
    </div>
  );

  if (result) return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{result.eligible ? '✅' : '❌'}</div>
          <h2 style={{ color: result.eligible ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>
            {result.eligible ? 'You are eligible to donate!' : 'Not eligible at this time'}
          </h2>
          <div style={styles.scoreCircle}>
            <span style={{ fontSize: 32, fontWeight: 700, color: result.score >= 60 ? 'var(--success)' : 'var(--danger)' }}>
              {result.score}
            </span>
            <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ 100</span>
          </div>
          {result.reasons?.length > 0 && (
            <div style={styles.reasons}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Reasons:</p>
              {result.reasons.map((r, i) => (
                <div key={i} style={styles.reason}>⚠️ {r}</div>
              ))}
            </div>
          )}
          {result.eligible && (
            <p style={{ color: 'var(--success)', marginTop: 16, fontWeight: 600 }}>
              You can accept donation requests from your dashboard!
            </p>
          )}
          <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={restart}>
            Check Again
          </button>
        </div>
      </div>
    </div>
  );

  const current = questions[step];
  if (!current) return null;

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={styles.progress}>
          <div style={{ ...styles.progressBar, width: `${((step) / questions.length) * 100}%` }} />
        </div>
        <p style={styles.stepLabel}>Question {step + 1} of {questions.length}</p>
        <h3 style={styles.question}>{current.question}</h3>
        <div style={styles.options}>
          {current.options.map(opt => (
            <button key={opt} className="btn btn-outline" style={styles.optionBtn} onClick={() => handleAnswer(opt)}>
              {opt}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button style={styles.backBtn} onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 560, margin: '0 auto', padding: '24px 16px' },
  card: { padding: '32px' },
  progress: { height: 6, background: '#eee', borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressBar: { height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' },
  stepLabel: { fontSize: '13px', color: 'var(--gray)', marginBottom: 8 },
  question: { fontSize: '20px', marginBottom: 24, lineHeight: 1.4 },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  optionBtn: { textAlign: 'left', padding: '14px 18px', fontSize: '15px', borderRadius: 8 },
  backBtn: { background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', marginTop: 16, fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px 0' },
  spinner: { width: 48, height: 48, border: '4px solid #eee', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  scoreCircle: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, margin: '16px 0' },
  reasons: { background: '#fff3cd', padding: '16px', borderRadius: 8, textAlign: 'left', marginTop: 16 },
  reason: { fontSize: '14px', marginBottom: 6, color: '#856404' }
};
