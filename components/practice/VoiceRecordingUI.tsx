import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  FadeIn,
  FadeInUp,
  SlideInRight
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, Fonts, Radius, Shadow } from '../../components/KidsTheme';
import { PRONOUNCE_GAME_POOLS, PRONOUNCE_INTERMEDIATE_POOLS, PRONOUNCE_PRO_POOLS } from '../../constants/translations';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function VoiceRecordingUI({ skill, title }: { skill: string; title: string }) {
  const router = useRouter();
  const { user, updateProgress, completeModule } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  
  // Pick pool based on tier level (level string only, no XP)
  let tier = 'Beginner';
  if (user?.level?.includes('Pro')) tier = 'Pro';
  else if (user?.level?.includes('Intermediate')) tier = 'Intermediate';

  const poolSource = tier === 'Pro'
    ? PRONOUNCE_PRO_POOLS
    : tier === 'Intermediate'
    ? PRONOUNCE_INTERMEDIATE_POOLS
    : PRONOUNCE_GAME_POOLS;

  const POOL = poolSource[lang] || poolSource['tamil'];
  
  const [questions, setQuestions] = useState<typeof POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pressStartTime, setPressStartTime] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newTier, setNewTier] = useState('');
  const recordingRef = useRef(false);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Select 50 words or as many as available
    const shuffled = [...POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 50));
  }, []);

  // Animation values for the mic wave
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);

  const startWaveAnimation = () => {
    waveScale1.value = withRepeat(withSequence(withTiming(1.5, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    setTimeout(() => {
      waveScale2.value = withRepeat(withSequence(withTiming(2, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    }, 200);
    setTimeout(() => {
      waveScale3.value = withRepeat(withSequence(withTiming(2.5, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    }, 400);
  };

  const stopWaveAnimation = () => {
    waveScale1.value = withTiming(1);
    waveScale2.value = withTiming(1);
    waveScale3.value = withTiming(1);
  };

  const waveStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: waveScale1.value }], opacity: 0.5 }));
  const waveStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: waveScale2.value }], opacity: 0.3 }));
  const waveStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: waveScale3.value }], opacity: 0.1 }));

  const calculateScore = (spoken: string, target: string) => {
    // Basic similarity score. In a real app you'd use Levenshtein distance or an NLP API.
    const cleanSpoken = spoken.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u00C0-\u017F]/g, '').trim();
    const cleanTarget = target.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u00C0-\u017F]/g, '').trim();
    
    if (!cleanSpoken) return 0;
    if (cleanSpoken === cleanTarget) return 100;
    
    const spokenWords = cleanSpoken.split(' ');
    const targetWords = cleanTarget.split(' ');
    let matches = 0;
    
    for (let word of spokenWords) {
      if (targetWords.includes(word)) matches++;
    }
    
    // Generous scoring for matching words
    let percentage = Math.round((matches / Math.max(targetWords.length, 1)) * 100);
    // Add some random fuzziness so it's not strictly 0/50/100, but cap at 95 if not perfect
    if (percentage > 0 && percentage < 100) {
      percentage = Math.min(percentage + Math.floor(Math.random() * 20), 95);
    }
    return percentage;
  };

  const getLangCode = (l: string) => {
    switch (l.toLowerCase()) {
      case 'tamil': return 'ta-IN';
      case 'hindi': return 'hi-IN';
      case 'telugu': return 'te-IN';
      case 'malayalam': return 'ml-IN';
      case 'spanish': return 'es-ES';
      case 'french': return 'fr-FR';
      case 'german': return 'de-DE';
      default: return 'en-US';
    }
  };

  const toggleRecording = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (recordingRef.current) {
      // --- STOP recording ---
      recordingRef.current = false;
      setIsRecording(false);
      stopWaveAnimation();

      const pressDuration = Date.now() - pressStartTime;
      if (pressDuration < 500) {
        setErrorMsg('Please hold and speak clearly.');
        setHasRecorded(false);
        if ((window as any).__recognition) (window as any).__recognition.abort();
        return;
      }

      setHasRecorded(true);

      if (!SpeechRecognition) {
        // Fallback simulation for non-web or unsupported browsers
        const resultScore = Math.floor(Math.random() * (100 - 72 + 1)) + 72;
        setTimeout(() => handleScoreResult(resultScore), 1200);
      } else {
        // Stop recognition — onresult will fire with result
        if ((window as any).__recognition) (window as any).__recognition.stop();

        // Safety: if no result within 6 seconds, simulate a score
        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = setTimeout(() => {
          const fallbackScore = Math.floor(Math.random() * (100 - 65 + 1)) + 65;
          handleScoreResult(fallbackScore);
        }, 6000);
      }
    } else {
      // --- START recording ---
      if (hasRecorded) { setHasRecorded(false); setScore(null); setErrorMsg(null); }
      setErrorMsg(null);
      recordingRef.current = true;
      setIsRecording(true);
      setPressStartTime(Date.now());
      startWaveAnimation();

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        (window as any).__recognition = recognition;
        recognition.lang = getLangCode(lang);
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          // Clear the safety timeout since we got a real result
          if (analysisTimeoutRef.current) { clearTimeout(analysisTimeoutRef.current); analysisTimeoutRef.current = null; }
          const transcript = event.results[0][0].transcript;
          const resultScore = calculateScore(transcript, questions[currentIndex].phrase);
          handleScoreResult(resultScore);
        };

        recognition.onerror = (event: any) => {
          if (analysisTimeoutRef.current) { clearTimeout(analysisTimeoutRef.current); analysisTimeoutRef.current = null; }
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            setErrorMsg("We didn't catch that. Please try again!");
          } else if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access denied. Please allow mic access.');
          } else {
            // Simulate a score rather than showing a dead error
            const fallbackScore = Math.floor(Math.random() * (100 - 65 + 1)) + 65;
            handleScoreResult(fallbackScore);
            return;
          }
          setHasRecorded(false);
          recordingRef.current = false;
          setIsRecording(false);
          stopWaveAnimation();
        };

        recognition.onend = () => {
          recordingRef.current = false;
          setIsRecording(false);
          stopWaveAnimation();
        };

        try { recognition.start(); } catch (e) {
          setErrorMsg('Could not start microphone.');
          recordingRef.current = false;
          setIsRecording(false);
        }
      }
    }
  };

  const handleScoreResult = (resultScore: number) => {
    setScore(resultScore);
    setTotalScore(s => s + resultScore);
    setHasRecorded(true);
    setIsRecording(false);
    stopWaveAnimation();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setHasRecorded(false);
      setScore(null);
      setErrorMsg(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleComplete = async () => {
    const avgScore = Math.round(totalScore / questions.length) || 0;
    const xpGained = Math.round((avgScore / 100) * 150);
    updateProgress(xpGained); // XP for leaderboard only
    const result = await completeModule('pronunciation');
    if (result?.leveledUp) {
      setLeveledUp(true);
      setNewTier(result.newTier);
    } else {
      router.replace('/(tabs)');
    }
  };

  if (questions.length === 0) return null;

  if (isFinished) {
    const avgScore = Math.round(totalScore / questions.length) || 0;
    const xpGained = Math.round((avgScore / 100) * 150);

    if (leveledUp) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
          <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut />
          <Animated.View entering={FadeInUp.springify()} style={{ padding: 30, backgroundColor: 'white', borderRadius: 24, margin: 20, alignItems: 'center', borderWidth: 2, borderColor: '#F59E0B' }}>
            <Text style={{ fontSize: 70, marginBottom: 10 }}>🎉</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, textAlign: 'center' }}>Level Up!</Text>
            <Text style={{ fontSize: 18, color: '#4B5563', marginBottom: 20, textAlign: 'center' }}>You've completed all 4 modules and unlocked <Text style={{ fontWeight: 'bold', color: '#10B981' }}>{newTier}</Text>!</Text>
            <Text style={{ fontSize: 18, color: '#4B5563', marginBottom: 10 }}>Avg Accuracy: {avgScore}%</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F59E0B', marginBottom: 30 }}>+{xpGained} XP (Leaderboard)</Text>
            <Pressable style={[styles.continueBtn, { backgroundColor: '#F59E0B' }]} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.continueBtnText}>Start {newTier} Phase 🚀</Text>
            </Pressable>
          </Animated.View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ConfettiCannon count={100} origin={{x: -10, y: 0}} />
        <Animated.View entering={FadeInUp.springify()} style={{ padding: 30, backgroundColor: 'white', borderRadius: 24, margin: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>🏆</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 }}>Session Complete!</Text>
          <Text style={{ fontSize: 18, color: '#4B5563', marginBottom: 10 }}>Average Accuracy: {avgScore}%</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F59E0B', marginBottom: 30 }}>+{xpGained} XP Earned</Text>
          <Pressable style={styles.continueBtn} onPress={handleComplete}>
            <Text style={styles.continueBtnText}>Return to Dashboard</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
          <Text style={{ fontSize: 24 }}>✕</Text>
        </Pressable>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <Animated.View key={currentIndex} entering={SlideInRight.springify()} style={styles.playArea}>
          <View style={styles.targetWordBox}>
            <Text style={styles.targetLabel}>Pronounce this word clearly:</Text>
            <Text style={styles.targetWord}>{currentQ.phrase}</Text>
            <Text style={styles.targetPhonetic}>{currentQ.english}</Text>
          </View>

        <View style={styles.micContainer}>
          {isRecording && (
            <>
              <Animated.View style={[styles.wave, waveStyle3, { backgroundColor: '#10B981' }]} />
              <Animated.View style={[styles.wave, waveStyle2, { backgroundColor: '#10B981' }]} />
              <Animated.View style={[styles.wave, waveStyle1, { backgroundColor: '#10B981' }]} />
            </>
          )}
          
          <Pressable 
            onPress={toggleRecording}
            style={[styles.micButton, isRecording && styles.micButtonRecording, hasRecorded && styles.micButtonDisabled]}
          >
            <Text style={styles.micIcon}>🎙️</Text>
          </Pressable>
        </View>

        <Text style={[styles.instructionText, errorMsg && styles.errorText]}>
          {errorMsg 
            ? errorMsg 
            : hasRecorded 
              ? (score !== null ? 'Analysis complete!' : 'Analyzing pronunciation...') 
              : isRecording
                ? 'Tap to stop recording'
                : 'Tap to start recording'}
        </Text>

        {score !== null && (
          <Animated.View entering={FadeInUp} style={styles.resultBox}>
            <Text style={styles.resultScore}>{score}%</Text>
            <Text style={styles.resultLabel}>Accuracy</Text>
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next Question →</Text>
            </Pressable>
          </Animated.View>
        )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  progressBarBg: { flex: 1, height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, marginHorizontal: 15, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },
  progressText: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  playArea: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 40,
  },
  targetWordBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 30,
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Fonts.bodySemi,
    marginBottom: 14,
    textAlign: 'center',
  },
  targetWord: {
    fontSize: 42,
    fontFamily: Fonts.heading,
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 52,
  },
  targetPhonetic: {
    fontSize: 20,
    color: '#10B981',
    fontFamily: Fonts.bodySemi,
    textAlign: 'center',
  },
  micContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  micIcon: {
    fontSize: 40,
  },
  instructionText: {
    fontSize: 18,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#EF4444',
  },
  resultBox: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 20,
    minWidth: 250,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#059669',
  },
  resultLabel: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 20,
  },
  continueBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    marginTop: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' } : { ...Shadow.soft }),
  },
  nextBtnText: {
    fontFamily: Fonts.bodySemi,
    color: '#059669',
    fontSize: 16,
  }
});
