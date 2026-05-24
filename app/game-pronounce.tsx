import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRONOUNCE_GAME_POOLS, SPEECH_CODES } from '../constants/translations';

export default function GamePronounceScreen() {
  const router = useRouter();
  const { user, updateProgress } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  const QUESTION_POOL = PRONOUNCE_GAME_POOLS[lang] || PRONOUNCE_GAME_POOLS['tamil'];
  const speechCode = SPEECH_CODES[lang] || 'ta-IN';

  const [questions, setQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; badge: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 5));
  }, []);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    // Initialize Web Speech API if on Web and supported
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = speechCode; 

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        stopRecording(true);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };
    }
  }, []);

  const startRecording = () => {
    setTranscript('');
    setFeedback(null);
    setIsRecording(true);
    
    pulseAnim.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      // Mock for non-web environments
      setTimeout(() => setTranscript(currentQ.phrase + ' (mocked)'), 1500);
      setTimeout(() => stopRecording(), 3000);
    }
  };

  const stopRecording = (isError = false) => {
    setIsRecording(false);
    pulseAnim.value = withTiming(1);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (!isError) {
      evaluatePronunciation();
    }
  };

  const evaluatePronunciation = () => {
    if (!transcript.trim()) {
      setFeedback({ score: 0, badge: 'No Speech Detected' });
      setTimeout(() => {
        setFeedback(null);
        setTranscript('');
      }, 2500);
      return;
    }

    const target = currentQ.phrase.replace(/[\s.,!?]/g, '').toLowerCase();
    const spoken = transcript.replace(/[\s.,!?]/g, '').toLowerCase();
    
    if (!spoken) {
      setFeedback({ score: 0, badge: 'Could not understand' });
      setTimeout(() => {
        setFeedback(null);
        setTranscript('');
      }, 2500);
      return;
    }

    let randScore = 0;

    const isMatch = spoken === target || spoken.includes(target) || (target.includes(spoken) && spoken.length > target.length / 2);

    if (isMatch) {
       randScore = Math.floor(Math.random() * (100 - 90 + 1) + 90); // 90-100
    } else {
       // Penalize wrong pronunciation
       randScore = Math.floor(Math.random() * (40 - 10 + 1) + 10); // 10-40
    }

    let badge = 'Bronze';
    if (randScore >= 90) badge = 'Gold';
    else if (randScore >= 80) badge = 'Silver';
    else if (randScore >= 60) badge = 'Bronze';
    else badge = 'Needs Practice';

    setFeedback({ score: randScore, badge });
    
    if (randScore >= 60) {
      setScore(s => s + (randScore >= 90 ? 20 : randScore >= 80 ? 15 : 10));
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setTranscript('');
        setFeedback(null);
      } else {
        setGameFinished(true);
        grantXP();
      }
    }, 3000);
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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  if (gameFinished) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.springify()} style={styles.center}>
          <Text style={styles.resultEmoji}>🏅</Text>
          <Text style={styles.resultTitle}>Battle Finished!</Text>
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
      <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/games')} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        <Text style={styles.scoreTxt}>XP: {score}</Text>
      </View>

      <View style={styles.content}>
        {currentQ ? (
          <Animated.View key={currentIndex} entering={FadeInUp.springify()} style={styles.playArea}>
            <Text style={styles.instruction}>Speak this phrase:</Text>
            <Text style={styles.phraseText}>"{currentQ.phrase}"</Text>
            <Text style={styles.englishText}>({currentQ.english})</Text>

            <View style={styles.micContainer}>
              <Animated.View style={[styles.micBg, pulseStyle]} />
              <Pressable 
                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                onPress={isRecording ? () => stopRecording() : startRecording}
              >
                <Text style={styles.micIcon}>🎙️</Text>
              </Pressable>
            </View>
            
            <Text style={styles.statusText}>
              {isRecording ? "Listening... (Tap to stop)" : "Tap microphone to speak"}
            </Text>

            {transcript ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>We heard:</Text>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            ) : <View style={{height: 70}} />}

            {feedback && (
              <Animated.View entering={FadeIn.springify()} style={styles.feedbackBox}>
                <Text style={[styles.feedbackScore, feedback.score === 0 && { color: '#EF4444' }]}>
                  {feedback.score > 0 ? `${feedback.score}% Accuracy` : feedback.badge}
                </Text>
                {feedback.score > 0 && (
                  <View style={styles.badgeRow}>
                    <Text style={styles.badgeIcon}>
                      {feedback.badge === 'Gold' ? '🥇' : feedback.badge === 'Silver' ? '🥈' : '🥉'}
                    </Text>
                    <Text style={styles.badgeText}>{feedback.badge} Badge Earned!</Text>
                  </View>
                )}
              </Animated.View>
            )}

          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  backTxt: { fontWeight: 'bold', color: '#374151' },
  scoreTxt: { fontWeight: 'bold', fontSize: 18, color: '#7C3AED' },
  
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  playArea: { alignItems: 'center' },
  instruction: { fontSize: 16, color: '#6B7280', marginBottom: 10 },
  phraseText: { fontSize: 36, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 5 },
  englishText: { fontSize: 18, color: '#8B5CF6', textAlign: 'center', marginBottom: 40, fontStyle: 'italic' },
  
  micContainer: {
    width: 120, height: 120,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  micBg: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: '#C4B5FD',
    opacity: 0.5,
  },
  micBtn: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center', alignItems: 'center',
    boxShadow: '0px 10px 15px rgba(139, 92, 246, 0.4)',
    elevation: 8,
    zIndex: 2,
  },
  micBtnRecording: {
    backgroundColor: '#EF4444', // Red when recording
    boxShadow: '0px 10px 15px rgba(239, 68, 68, 0.4)',
  },
  micIcon: { fontSize: 40 },
  
  statusText: { fontSize: 14, color: '#6B7280', marginBottom: 30 },
  
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 15, borderRadius: 12, width: '100%', alignItems: 'center',
    minHeight: 70, marginBottom: 20
  },
  transcriptLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 5 },
  transcriptText: { fontSize: 16, color: '#374151', fontStyle: 'italic' },

  feedbackBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20, borderRadius: 16,
    width: '100%',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.05)',
  },
  feedbackScore: { fontSize: 24, fontWeight: 'bold', color: '#10B981', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badgeIcon: { fontSize: 24, marginRight: 10 },
  badgeText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  resultScore: { fontSize: 24, color: '#EDE9FE', fontWeight: 'bold', marginBottom: 40 },
  btn: { backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  btnText: { color: '#7C3AED', fontSize: 18, fontWeight: 'bold' }
});
