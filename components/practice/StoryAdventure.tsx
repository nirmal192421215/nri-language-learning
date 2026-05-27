import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import Animated, { FadeInDown, SlideInRight, SlideInUp, withSpring, withSequence, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { generateStoryMission, StoryNode } from '../../utils/ai';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Shadow } from '../KidsTheme';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Speech from 'expo-speech';
import { SPEECH_CODES } from '../../constants/translations';

export default function StoryAdventure({ countryId, title }: { countryId: string, title: string }) {
  const { user, updateProgress, setWorldProgress } = useAuth();
  const router = useRouter();

  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<{ isCorrect: boolean, text: string } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Animations
  const micScale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);
  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));

  useEffect(() => {
    const fetchStory = async () => {
      try {
        if (!user) return;
        const generated = await generateStoryMission(title, user.learningLanguage || 'Tamil');
        setStoryNodes(generated);
      } catch (err) {
        setError('Failed to load the story mission. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStory();
  }, [countryId, user]);

  // Set up Speech Recognition (Web)
  useEffect(() => {
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = SPEECH_CODES[user?.learningLanguage || 'tamil'] || 'ta-IN'; 
      recognitionRef.current.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
        setTranscript(t);
      };
      recognitionRef.current.onerror = () => stopRecording(true);
      recognitionRef.current.onend = () => { if (isRecording) stopRecording(); };
    }
  }, [isRecording, user]);

  // Speak NPC text when node changes
  useEffect(() => {
    if (storyNodes.length > 0 && currentNodeIdx < storyNodes.length) {
      const node = storyNodes[currentNodeIdx];
      const langCode = SPEECH_CODES[user?.learningLanguage || 'tamil'] || 'ta-IN';
      
      setTimeout(() => {
        Speech.speak(node.npcDialogue, { language: langCode, rate: 0.9, pitch: 1.1 });
      }, 500);
    }
  }, [currentNodeIdx, storyNodes, user]);

  const startRecording = () => {
    micScale.value = withSequence(withSpring(0.9), withSpring(1));
    setTranscript('');
    setVoiceFeedback(null);
    setIsRecording(true);
    pulseAnim.value = withRepeat(withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })), -1, false);

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else {
      // Mock for native if no speech recognition
      const correctOpt = storyNodes[currentNodeIdx].options.find(o => o.isCorrect);
      setTimeout(() => setTranscript(correctOpt?.text || 'mocked'), 1500);
      setTimeout(() => stopRecording(), 3000);
    }
  };

  const stopRecording = (isErr = false) => {
    setIsRecording(false);
    pulseAnim.value = withSpring(1);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (!isErr) evaluatePronunciation();
  };

  const evaluatePronunciation = () => {
    const node = storyNodes[currentNodeIdx];
    const correctOpt = node.options.find(o => o.isCorrect);
    if (!correctOpt) return;

    const target = correctOpt.text.replace(/[\s.,!?]/g, '').toLowerCase();
    const spoken = transcript.replace(/[\s.,!?]/g, '').toLowerCase();

    if (!spoken) {
      setVoiceFeedback({ isCorrect: false, text: "We didn't catch that. Try again!" });
      setTimeout(() => { setVoiceFeedback(null); setTranscript(''); }, 2000);
      return;
    }

    const isMatch = spoken === target || spoken.includes(target) || (target.includes(spoken) && spoken.length > target.length / 2);
    
    if (isMatch) {
      setVoiceFeedback({ isCorrect: true, text: "Perfect pronunciation! 🎉" });
      setSelectedOption(node.options.findIndex(o => o.isCorrect)); // mock select for footer
    } else {
      setVoiceFeedback({ isCorrect: false, text: "Not quite right. Try again!" });
      setTimeout(() => { setVoiceFeedback(null); setTranscript(''); }, 2000);
    }
  };

  const handleNext = () => {
    if (currentNodeIdx < storyNodes.length - 1) {
      setCurrentNodeIdx(i => i + 1);
      setSelectedOption(null);
      setTranscript('');
      setVoiceFeedback(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleComplete = async () => {
    const xpGained = storyNodes.length * 20; // 60 XP
    const coinsGained = 25; // Phase 2: Add 25 coins reward
    updateProgress(xpGained, coinsGained);
    
    const COUNTRY_ORDER = ['india', 'usa', 'uk', 'dubai'];
    const currentIdx = COUNTRY_ORDER.indexOf(countryId);
    if (currentIdx < COUNTRY_ORDER.length - 1 && user) {
      const nextCountry = COUNTRY_ORDER[currentIdx + 1];
      const newUnlocked = [...new Set([...(user.unlockedCountries || ['india']), nextCountry])];
      await setWorldProgress(newUnlocked, nextCountry);
      
      // Navigate back with unlock animation params
      router.replace({ pathname: '/(tabs)', params: { justUnlocked: nextCountry, previousCountry: countryId } });
    } else {
      router.replace('/(tabs)');
    }
  };

  const speakText = (text: string) => {
    const langCode = SPEECH_CODES[user?.learningLanguage || 'tamil'] || 'ta-IN';
    Speech.speak(text, { language: langCode, rate: 0.9 });
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.green} /></View>;
  if (error || storyNodes.length === 0) return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;

  if (isFinished) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut />
        <Animated.View entering={FadeInDown.springify()} style={styles.resultCard}>
          <Text style={{ fontSize: 60 }}>✈️</Text>
          <Text style={styles.titleText}>Mission Complete!</Text>
          <Text style={{ fontSize: 18, color: Colors.textMid, textAlign: 'center', marginVertical: 10 }}>You successfully navigated the {title} adventure!</Text>
          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.orange }}>+60 XP</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EAB308' }}>+25 🪙</Text>
          </View>
          <Pressable style={[styles.nextButton, { backgroundColor: Colors.orange }]} onPress={handleComplete}>
            <Text style={styles.nextText}>Claim Reward & Travel! 🌍</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const currentNode = storyNodes[currentNodeIdx];
  const progress = ((currentNodeIdx) / storyNodes.length) * 100;
  const isFinalNode = currentNodeIdx === storyNodes.length - 1;
  const isCorrectChoice = selectedOption !== null && currentNode.options[selectedOption]?.isCorrect;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: Colors.textMid }}>✕</Text>
        </Pressable>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View key={currentNodeIdx} entering={SlideInRight.springify()} style={styles.card}>
          <Text style={styles.narratorText}>"{currentNode.narratorText}"</Text>
          
          <Pressable style={styles.dialogueBox} onPress={() => speakText(currentNode.npcDialogue)}>
            <Text style={styles.speakerIcon}>🔊</Text>
            <View>
              <Text style={styles.npcText}>{currentNode.npcDialogue}</Text>
              <Text style={styles.npcSub}>({currentNode.npcTranslation})</Text>
            </View>
          </Pressable>

          <Text style={styles.promptText}>{isFinalNode ? "Voice Challenge! Say the correct response:" : "How do you respond?"}</Text>

          {isFinalNode ? (
            // VOICE RECORDING UI (Final Node)
            <View style={styles.voiceSection}>
              <View style={styles.optionsContainer}>
                {currentNode.options.map((opt, idx) => (
                  <View key={idx} style={[styles.optionButton, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', paddingVertical: 12 }]}>
                    <Text style={[styles.optionText, { fontSize: 16 }]}>{opt.text}</Text>
                    <Text style={styles.optionSub}>{opt.translation}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.micArea}>
                <Animated.View style={[styles.micPulse, pulseStyle, isRecording && { backgroundColor: Colors.redLight }]} />
                <Animated.View style={micStyle}>
                  <Pressable 
                    style={[styles.micBtn, isRecording && styles.micBtnRec]}
                    onPress={isRecording ? () => stopRecording() : startRecording}
                    disabled={selectedOption !== null}
                  >
                    <Text style={styles.micIcon}>🎙️</Text>
                  </Pressable>
                </Animated.View>
              </View>
              <Text style={styles.statusText}>{isRecording ? "Listening..." : "Tap mic to speak your choice"}</Text>

              {transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>"{transcript}"</Text>
                </View>
              ) : null}

              {voiceFeedback && (
                <Animated.View entering={SlideInUp} style={[styles.feedbackBox, !voiceFeedback.isCorrect && { borderColor: Colors.red }]}>
                  <Text style={[styles.feedbackText, !voiceFeedback.isCorrect && { color: Colors.red }]}>{voiceFeedback.text}</Text>
                </Animated.View>
              )}
            </View>
          ) : (
            // MULTIPLE CHOICE UI (Standard Nodes)
            <View style={styles.optionsContainer}>
              {currentNode.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isWrong = isSelected && !opt.isCorrect;
                
                let borderColor = '#E5E7EB';
                let bgColor = 'white';
                if (isSelected) {
                  borderColor = opt.isCorrect ? Colors.green : Colors.red;
                  bgColor = opt.isCorrect ? '#ECFDF5' : '#FEF2F2';
                }

                return (
                  <Pressable
                    key={idx}
                    disabled={selectedOption !== null}
                    style={[styles.optionButton, { borderColor, backgroundColor: bgColor }]}
                    onPress={() => setSelectedOption(idx)}
                  >
                    <Text style={[styles.optionText, isSelected && { color: opt.isCorrect ? Colors.greenDark : Colors.redDark, fontWeight: 'bold' }]}>
                      {opt.text}
                    </Text>
                    <Text style={styles.optionSub}>{opt.translation}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {selectedOption !== null && (
        <Animated.View entering={SlideInRight} style={styles.footer}>
          {!isCorrectChoice ? (
            <Text style={{ color: Colors.red, fontFamily: Fonts.bodySemi, marginBottom: 10, textAlign: 'center' }}>Oops! That didn't make sense here. Let's move on.</Text>
          ) : (
            <Text style={{ color: Colors.green, fontFamily: Fonts.bodySemi, marginBottom: 10, textAlign: 'center' }}>Great response! 🎉</Text>
          )}
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {currentNodeIdx === storyNodes.length - 1 ? 'Finish Mission' : 'Continue Story'}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
  progressBarBg: { flex: 1, height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, marginHorizontal: 15, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.green },
  
  scrollContent: { padding: 20, paddingBottom: 150 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, ...(Platform.OS === 'web' ? { boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' } : { ...Shadow.card }) },
  resultCard: { backgroundColor: 'white', borderRadius: 32, padding: 40, margin: 20, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0px 20px 50px rgba(0,0,0,0.2)' } : { elevation: 10 }) },
  titleText: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.textDark, marginTop: 10 },
  
  narratorText: { fontFamily: Fonts.bodyReg, fontSize: 18, color: Colors.textMid, fontStyle: 'italic', marginBottom: 20, textAlign: 'center' },
  
  dialogueBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 2, borderColor: '#BAE6FD' },
  speakerIcon: { fontSize: 24, marginRight: 15 },
  npcText: { fontFamily: Fonts.heading, fontSize: 24, color: '#0369A1', marginBottom: 4 },
  npcSub: { fontFamily: Fonts.bodyReg, fontSize: 16, color: '#0284C7' },
  
  promptText: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.textDark, marginBottom: 16 },
  
  optionsContainer: { gap: 12 },
  optionButton: { padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center' },
  optionText: { fontFamily: Fonts.bodySemi, fontSize: 18, color: Colors.textDark, marginBottom: 4 },
  optionSub: { fontFamily: Fonts.bodyReg, fontSize: 14, color: Colors.textMid },

  voiceSection: { alignItems: 'center', marginTop: 10 },
  micArea: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  micPulse: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.pinkLight, opacity: 0.6 },
  micBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.pink, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF', ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 20px rgba(236,72,153,0.4)' } : { elevation: 8 }) },
  micBtnRec: { backgroundColor: Colors.red, borderColor: Colors.redLight },
  micIcon: { fontSize: 32 },
  statusText: { fontFamily: Fonts.bodySemi, color: Colors.textMid, marginBottom: 10 },
  transcriptBox: { backgroundColor: Colors.bgMuted, padding: 12, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#E5E7EB', width: '100%', alignItems: 'center', marginBottom: 10 },
  transcriptText: { fontFamily: Fonts.bodyReg, fontSize: 16, color: Colors.textDark, fontStyle: 'italic' },
  feedbackBox: { backgroundColor: Colors.greenLight, padding: 12, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.green, width: '100%', alignItems: 'center' },
  feedbackText: { fontFamily: Fonts.bodySemi, color: Colors.greenDark, fontSize: 16 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#F3F4F6' },
  nextButton: { backgroundColor: Colors.green, padding: 18, borderRadius: Radius.pill, alignItems: 'center' },
  nextText: { fontFamily: Fonts.bodySemi, color: 'white', fontSize: 18 }
});
