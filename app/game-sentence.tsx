import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SENTENCE_GAME_POOLS } from '../constants/translations';

export default function GameSentenceScreen() {
  const router = useRouter();
  const { user, updateProgress } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  const QUESTION_POOL = SENTENCE_GAME_POOLS[lang] || SENTENCE_GAME_POOLS['tamil'];

  const [questions, setQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'timeout'>('playing');

  useEffect(() => {
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 4)); // 4 questions per session
  }, []);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setAvailableWords([...questions[currentIndex].words].sort(() => Math.random() - 0.5));
      setSelectedWords([]);
      setTimeLeft(15);
      setStatus('playing');
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (status !== 'playing' || gameFinished) return;
    
    if (timeLeft <= 0) {
      handleWrong('timeout');
      return;
    }

    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status, gameFinished]);

  const selectWord = (word: string) => {
    if (status !== 'playing') return;
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter(w => w !== word));
  };

  const removeWord = (word: string) => {
    if (status !== 'playing') return;
    setSelectedWords(selectedWords.filter(w => w !== word));
    setAvailableWords([...availableWords, word]);
  };

  const checkAnswer = () => {
    const constructed = selectedWords.join(' ');
    if (constructed === currentQ.original) {
      setStatus('correct');
      setScore(s => s + (timeLeft > 10 ? 20 : 10)); // Time bonus
      nextQuestion();
    } else {
      handleWrong('wrong');
    }
  };

  const handleWrong = (state: 'wrong' | 'timeout') => {
    setStatus(state);
    nextQuestion();
  };

  const nextQuestion = () => {
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameFinished(true);
        grantXP();
      }
    }, 1500);
  };

  const grantXP = async () => {
    if (!user) return;
    try {
      const newTotal = user.xp + score;
      await AsyncStorage.setItem('user_xp', newTotal.toString());
      updateProgress(score); 
    } catch (e) {
      console.error(e);
    }
  };

  if (gameFinished) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.springify()} style={styles.center}>
          <Text style={styles.resultEmoji}>🧩</Text>
          <Text style={styles.resultTitle}>Time Attack Completed!</Text>
          <Text style={styles.resultScore}>+{score} XP Earned</Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/games')}>
             <Text style={styles.btnText}>Back to Games Hub</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/games')} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        
        <View style={[styles.timerBox, timeLeft <= 5 && styles.timerDanger]}>
          <Text style={styles.timerTxt}>⏱️ {timeLeft}s</Text>
        </View>

        <Text style={styles.scoreTxt}>XP: {score}</Text>
      </View>

      <View style={styles.content}>
        {currentQ ? (
          <>
            <Animated.View key={currentIndex} entering={FadeInUp.springify()} style={styles.playArea}>
              
              <Text style={styles.englishText}>"{currentQ.english}"</Text>

              <View style={styles.dropZone}>
                {selectedWords.length === 0 && <Text style={styles.placeholder}>Tap words below to build sentence</Text>}
                {selectedWords.map((word, i) => (
                  <Pressable key={i} onPress={() => removeWord(word)} style={styles.wordChip}>
                    <Text style={styles.wordTxt}>{word}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.sourceZone}>
                {availableWords.map((word, i) => (
                  <Pressable key={i} onPress={() => selectWord(word)} style={[styles.wordChip, styles.wordChipSource]}>
                    <Text style={styles.wordTxtSource}>{word}</Text>
                  </Pressable>
                ))}
              </View>

            </Animated.View>

            {status === 'correct' && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.statusBox}>
                 <Text style={styles.statusSuccess}>Excellent! +XP</Text>
              </Animated.View>
            )}
            {status === 'wrong' && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.statusBox}>
                 <Text style={styles.statusError}>Incorrect order!</Text>
              </Animated.View>
            )}
            {status === 'timeout' && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.statusBox}>
                 <Text style={styles.statusError}>Time is up!</Text>
              </Animated.View>
            )}
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.checkBtn, (availableWords.length > 0 || status !== 'playing') && styles.checkBtnDisabled]} 
          onPress={checkAnswer}
          disabled={availableWords.length > 0 || status !== 'playing'}
        >
          <Text style={styles.checkTxt}>Check Sentence</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  backTxt: { fontWeight: 'bold', color: '#374151' },
  scoreTxt: { fontWeight: 'bold', fontSize: 18, color: '#2563EB' },
  timerBox: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#3B82F6' },
  timerDanger: { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
  timerTxt: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  playArea: { alignItems: 'center' },
  englishText: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 40 },
  
  dropZone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 60,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40
  },
  placeholder: { color: '#9CA3AF', fontStyle: 'italic' },
  
  sourceZone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  wordChip: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    boxShadow: '0px 4px 6px rgba(59, 130, 246, 0.3)',
  },
  wordTxt: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  wordChipSource: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
  },
  wordTxtSource: { color: '#374151', fontWeight: 'bold', fontSize: 18 },

  statusBox: { alignItems: 'center', marginTop: 30 },
  statusSuccess: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  statusError: { fontSize: 20, fontWeight: 'bold', color: '#EF4444' },

  footer: { padding: 20, paddingBottom: 40 },
  checkBtn: { backgroundColor: '#2563EB', padding: 20, borderRadius: 16, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: '#93C5FD' },
  checkTxt: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  resultScore: { fontSize: 24, color: '#DBEAFE', fontWeight: 'bold', marginBottom: 40 },
  btn: { backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  btnText: { color: '#2563EB', fontSize: 18, fontWeight: 'bold' }
});
