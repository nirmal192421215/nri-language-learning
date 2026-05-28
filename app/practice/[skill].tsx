import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QuizUI from '../../components/practice/QuizUI';
import SentenceBuilder from '../../components/practice/SentenceBuilder';
import Flashcards from '../../components/practice/Flashcards';
import ChatUI from '../../components/practice/ChatUI';
import AlphabetGridUI from '../../components/practice/AlphabetGridUI';
import VoiceRecordingUI from '../../components/practice/VoiceRecordingUI';
import ReadingUI from '../../components/practice/ReadingUI';
import { useAuth } from '../../context/AuthContext';

export default function PracticeScreen() {
  const { skill } = useLocalSearchParams<{ skill: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Determine tier
  let tier = 'Beginner';
  if (user?.level?.includes('Pro')) tier = 'Pro';
  else if (user?.level?.includes('Intermediate')) tier = 'Intermediate';

  // Format the skill slug into a readable title
  const title = skill ? skill.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Practice';

  // Polymorphic router logic
  let PracticeComponent;

  // --- Dynamic 4-Pillar Routing ---
  if (skill === 'foundations') {
    // Beginner = Alphabet, Intermediate/Pro = Sentence Builder
    if (tier === 'Beginner') {
      PracticeComponent = <AlphabetGridUI skill={skill} title="The Alphabet" />;
    } else {
      PracticeComponent = <SentenceBuilder skill={skill} title={tier === 'Pro' ? 'Advanced Translation' : 'Sentence Structures'} />;
    }
  } else if (skill === 'communication') {
    // All levels use ChatUI but level is passed for AI difficulty
    PracticeComponent = <ChatUI skill={skill} title={tier === 'Beginner' ? 'Basic Greetings' : tier === 'Intermediate' ? 'Conversational AI' : 'Native Speed Conversation'} />;
  } else if (skill === 'pronunciation') {
    // All levels use VoiceRecordingUI, it reads user.level internally
    PracticeComponent = <VoiceRecordingUI skill={skill} title="Pronunciation" />;
  } else if (skill === 'assessment') {
    // All levels use QuizUI, it reads user.level internally
    PracticeComponent = <QuizUI skill="mini-quiz" title={tier === 'Beginner' ? 'Beginner Assessment' : tier === 'Intermediate' ? 'Intermediate Assessment' : 'Mastery Exam'} />;
  }
  // --- Legacy routing (for direct links) ---
  else if (skill?.includes('sentence') || skill?.includes('fluency') || skill?.includes('translation')) {
    PracticeComponent = <SentenceBuilder skill={skill} title={title} />;
  } else if (skill?.includes('alphabet')) {
    PracticeComponent = <AlphabetGridUI skill={skill} title={title} />;
  } else if (skill?.includes('greetings') || skill?.includes('tutor') || skill?.includes('culture') || skill?.includes('communication')) {
    PracticeComponent = <ChatUI skill={skill} title={title} />;
  } else if (skill?.includes('vocabulary')) {
    PracticeComponent = <Flashcards skill={skill} title={title} />;
  } else if (skill === 'reading') {
    PracticeComponent = <ReadingUI skill={skill} title={title} />;
  } else {
    PracticeComponent = <QuizUI skill={skill} title={title} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ECFDF5', '#F0FDF4']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.content}>
        {PracticeComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    padding: 20,
  }
});
