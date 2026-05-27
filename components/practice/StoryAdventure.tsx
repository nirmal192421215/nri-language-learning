import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { generateStoryMission, StoryNode } from '../../utils/ai';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Shadow } from '../KidsTheme';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function StoryAdventure({ countryId, title }: { countryId: string, title: string }) {
  const { user, updateProgress, setWorldProgress } = useAuth();
  const router = useRouter();

  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleNext = () => {
    if (selectedOption === null) return;
    
    if (currentNodeIdx < storyNodes.length - 1) {
      setCurrentNodeIdx(i => i + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleComplete = async () => {
    const xpGained = storyNodes.length * 20; // 60 XP
    updateProgress(xpGained);
    
    // Unlock next country logic
    const COUNTRY_ORDER = ['india', 'usa', 'uk', 'dubai'];
    const currentIdx = COUNTRY_ORDER.indexOf(countryId);
    if (currentIdx < COUNTRY_ORDER.length - 1 && user) {
      const nextCountry = COUNTRY_ORDER[currentIdx + 1];
      const newUnlocked = [...new Set([...(user.unlockedCountries || ['india']), nextCountry])];
      await setWorldProgress(newUnlocked, nextCountry);
    }
    
    router.replace('/(tabs)');
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
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.orange, marginBottom: 30 }}>+60 XP</Text>
          <Pressable style={[styles.nextButton, { backgroundColor: Colors.orange }]} onPress={handleComplete}>
            <Text style={styles.nextText}>Claim Reward & Travel! 🌍</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const currentNode = storyNodes[currentNodeIdx];
  const progress = ((currentNodeIdx) / storyNodes.length) * 100;
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
          
          <View style={styles.dialogueBox}>
            <Text style={styles.npcText}>{currentNode.npcDialogue}</Text>
            <Text style={styles.npcSub}>({currentNode.npcTranslation})</Text>
          </View>

          <Text style={styles.promptText}>How do you respond?</Text>

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
  
  narratorText: { fontFamily: Fonts.bodyReg, fontSize: 18, color: Colors.textMid, fontStyle: 'italic', marginBottom: 20, textAlign: 'center' },
  
  dialogueBox: { backgroundColor: '#F0F9FF', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 2, borderColor: '#BAE6FD' },
  npcText: { fontFamily: Fonts.heading, fontSize: 24, color: '#0369A1', textAlign: 'center', marginBottom: 8 },
  npcSub: { fontFamily: Fonts.bodyReg, fontSize: 16, color: '#0284C7', textAlign: 'center' },
  
  promptText: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.textDark, marginBottom: 16 },
  
  optionsContainer: { gap: 12 },
  optionButton: { padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center' },
  optionText: { fontFamily: Fonts.bodySemi, fontSize: 18, color: Colors.textDark, marginBottom: 4 },
  optionSub: { fontFamily: Fonts.bodyReg, fontSize: 14, color: Colors.textMid },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#F3F4F6' },
  nextButton: { backgroundColor: Colors.green, padding: 18, borderRadius: Radius.pill, alignItems: 'center' },
  nextText: { fontFamily: Fonts.bodySemi, color: 'white', fontSize: 18 }
});
