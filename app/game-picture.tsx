import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PICTURE_GAME_POOLS } from '../constants/translations';

const LANGUAGE_NAMES: Record<string, string> = {
  tamil: 'Tamil',
  hindi: 'Hindi',
  telugu: 'Telugu',
  malayalam: 'Malayalam',
  kannada: 'Kannada'
};

export default function GamePictureScreen() {
  const router = useRouter();
  const { user, updateProgress } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  const QUESTION_POOL = PICTURE_GAME_POOLS[lang] || PICTURE_GAME_POOLS['tamil'];
  const languageName = LANGUAGE_NAMES[lang] || 'Tamil';
  
  const [questions, setQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    // Shuffle the pool and pick 5 questions for this session
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 5));
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (!currentQ || selectedOpt !== null) return;
    
    setSelectedOpt(idx);
    const correct = idx === currentQ.correct;
    
    if (correct) setScore(s => s + 10);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOpt(null);
      } else {
        setGameFinished(true);
        grantXP();
      }
    }, 1200);
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
        <LinearGradient colors={['#F59E0B', '#D97706']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.springify()} style={styles.center}>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>Great Job!</Text>
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
      <LinearGradient colors={['#FEF3C7', '#FFFBEB']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/games')} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        <Text style={styles.scoreTxt}>XP: {score}</Text>
      </View>

      <View style={styles.content}>
        {currentQ ? (
          <>
            <Animated.View key={currentIndex} entering={FadeInUp.springify()} style={styles.imageBox}>
              <Text style={styles.emojiDisplay}>{currentQ.emoji}</Text>
              <Text style={styles.instruction}>What is this in {languageName}?</Text>
            </Animated.View>

            <View style={styles.optionsGrid}>
              {currentQ.options.map((opt, idx) => {
                let bgColor = 'white';
                let borderColor = '#E5E7EB';
                if (selectedOpt !== null) {
                  if (idx === currentQ.correct) {
                    bgColor = '#D1FAE5'; 
                    borderColor = '#10B981';
                  } else if (idx === selectedOpt) {
                    bgColor = '#FEE2E2'; 
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
  scoreTxt: { fontWeight: 'bold', fontSize: 18, color: '#D97706', alignSelf: 'center' },
  
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  imageBox: { alignItems: 'center', marginBottom: 40 },
  emojiDisplay: { fontSize: 120, marginBottom: 20 },
  instruction: { fontSize: 18, color: '#4B5563', fontWeight: 'bold' },
  
  optionsGrid: { gap: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  optionCard: {
    width: '45%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.05)',
  },
  optionText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  resultScore: { fontSize: 24, color: '#FEF3C7', fontWeight: 'bold', marginBottom: 40 },
  btn: { backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  btnText: { color: '#D97706', fontSize: 18, fontWeight: 'bold' }
});
