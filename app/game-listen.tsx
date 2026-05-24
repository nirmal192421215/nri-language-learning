import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LISTEN_GAME_POOLS, SPEECH_CODES } from '../constants/translations';

export default function GameListenScreen() {
  const router = useRouter();
  const { user, updateProgress } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  const QUESTION_POOL = LISTEN_GAME_POOLS[lang] || LISTEN_GAME_POOLS['tamil'];
  const speechCode = SPEECH_CODES[lang] || 'ta-IN';
  
  const [questions, setQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 5));
  }, []);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (questions.length > 0 && !gameFinished && currentQ) {
      playAudio();
    }
  }, [currentIndex, gameFinished, questions]);

  const playAudio = () => {
    Speech.speak(currentQ.target, { 
      language: speechCode, 
      rate: 0.9, 
      pitch: 0.8 // Lower pitch for a male-sounding voice
    });
  };

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return; // Prevent multiple clicks
    
    setSelectedOpt(idx);
    const correct = idx === currentQ.correct;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 10);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setGameFinished(true);
        grantXP();
      }
    }, 1500);
  };

  const grantXP = async () => {
    if (!user) return;
    try {
      // Simulate granting low XP for game completion
      const newTotal = user.xp + score;
      await AsyncStorage.setItem('user_xp', newTotal.toString());
      updateProgress(score); // Update context
    } catch (e) {
      console.error(e);
    }
  };

  if (gameFinished) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.springify()} style={styles.center}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>Game Complete!</Text>
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
      <LinearGradient colors={['#F0FDF4', '#ECFDF5']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/games')} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        <Text style={styles.scoreTxt}>XP: {score}</Text>
      </View>

      <View style={styles.content}>
        {currentQ ? (
          <>
            <Animated.View entering={FadeInDown.springify()} style={styles.audioBox}>
              <Pressable onPress={playAudio} style={styles.speakerBtn}>
                 <Text style={styles.speakerIcon}>🎧</Text>
              </Pressable>
              <Text style={styles.instruction}>Listen & Select the correct meaning</Text>
            </Animated.View>

            <View style={styles.optionsGrid}>
              {currentQ.options.map((opt, idx) => {
                let bgColor = 'white';
                let borderColor = '#E5E7EB';
                if (selectedOpt !== null) {
                  if (idx === currentQ.correct) {
                    bgColor = '#D1FAE5'; // Greenish
                    borderColor = '#10B981';
                  } else if (idx === selectedOpt) {
                    bgColor = '#FEE2E2'; // Reddish
                    borderColor = '#EF4444';
                  }
                }

                return (
                  <Pressable 
                    key={idx}
                    style={[styles.optionCard, { backgroundColor: bgColor, borderColor }]}
                    onPress={() => handleSelect(idx)}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  backTxt: { fontWeight: 'bold', color: '#374151' },
  scoreTxt: { fontWeight: 'bold', fontSize: 18, color: '#10B981', alignSelf: 'center' },
  
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  audioBox: { alignItems: 'center', marginBottom: 50 },
  speakerBtn: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center',
    boxShadow: '0px 10px 20px rgba(16, 185, 129, 0.4)',
    elevation: 8,
    marginBottom: 20
  },
  speakerIcon: { fontSize: 60 },
  instruction: { fontSize: 18, color: '#4B5563', fontWeight: '500' },
  
  optionsGrid: { gap: 15 },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.05)',
  },
  optionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  resultScore: { fontSize: 24, color: '#D1FAE5', fontWeight: 'bold', marginBottom: 40 },
  btn: { backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  btnText: { color: '#059669', fontSize: 18, fontWeight: 'bold' }
});
