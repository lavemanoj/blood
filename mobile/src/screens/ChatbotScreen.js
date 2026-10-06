import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

export default function ChatbotScreen() {
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
      setLoading(true);
      try {
        const res = await api.post('/chatbot/submit', { sessionId, responses: newAnswers });
        setResult(res.data.eligibilityResult);
      } catch { }
      setLoading(false);
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setResult(null); };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#e63946" />
      <Text style={styles.loadingText}>Analyzing eligibility...</Text>
    </View>
  );

  if (result) return (
    <ScrollView contentContainerStyle={styles.center}>
      <Text style={{ fontSize: 64 }}>{result.eligible ? '✅' : '❌'}</Text>
      <Text style={[styles.resultTitle, { color: result.eligible ? '#2d6a4f' : '#e63946' }]}>
        {result.eligible ? 'You are eligible!' : 'Not eligible right now'}
      </Text>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreNum}>{result.score}</Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>
      {result.reasons?.map((r, i) => (
        <View key={i} style={styles.reason}><Text style={styles.reasonText}>⚠️ {r}</Text></View>
      ))}
      <TouchableOpacity style={styles.btn} onPress={restart}>
        <Text style={styles.btnText}>Check Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const current = questions[step];
  if (!current) return <View style={styles.center}><ActivityIndicator color="#e63946" /></View>;

  const progress = (step / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.stepLabel}>Question {step + 1} of {questions.length}</Text>
      <Text style={styles.question}>{current.question}</Text>
      <ScrollView>
        {current.options.map(opt => (
          <TouchableOpacity key={opt} style={styles.option} onPress={() => handleAnswer(opt)}>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {step > 0 && (
        <TouchableOpacity onPress={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  progressBg: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 16 },
  progressFill: { height: 6, backgroundColor: '#e63946', borderRadius: 3 },
  stepLabel: { fontSize: 13, color: '#6c757d', marginBottom: 8 },
  question: { fontSize: 20, fontWeight: '600', marginBottom: 24, lineHeight: 28 },
  option: { borderWidth: 2, borderColor: '#dee2e6', borderRadius: 10, padding: 16, marginBottom: 10 },
  optionText: { fontSize: 15 },
  back: { color: '#6c757d', textAlign: 'center', marginTop: 16, fontSize: 14 },
  loadingText: { marginTop: 12, color: '#6c757d' },
  resultTitle: { fontSize: 22, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  scoreBox: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 16 },
  scoreNum: { fontSize: 48, fontWeight: '700', color: '#e63946' },
  scoreLabel: { fontSize: 18, color: '#6c757d', marginLeft: 4 },
  reason: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 6, marginBottom: 8, width: '100%' },
  reasonText: { fontSize: 13, color: '#856404' },
  btn: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, marginTop: 20, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 }
});
