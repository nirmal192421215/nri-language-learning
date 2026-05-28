import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, SlideInRight } from 'react-native-reanimated';
import { generateFlashcardLesson, Flashcard } from '../../utils/ai';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function Flashcards({ skill, title }: { skill: string, title: string }) {
  const { user, updateProgress, completeModule } = useAuth();
  const router = useRouter();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFlipped = useSharedValue(0);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        if (!user) return;
        const generated = await generateFlashcardLesson(title, user.level, user.learningLanguage || "Tamil");
        setCards(generated);
      } catch (err) {
        setError('Failed to load flashcards.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [user]);

  const flipCard = () => {
    isFlipped.value = withTiming(isFlipped.value === 0 ? 1 : 0, { duration: 300 });
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      isFlipped.value = 0; // reset flip
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
      }, 150);
    } else {
      setIsFinished(true);
    }
  };

  const handleComplete = () => {
    const xpGained = cards.length * 5; // 5 XP per flashcard
    updateProgress(xpGained);
    completeModule(skill.toLowerCase());
    router.replace('/(tabs)');
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${isFlipped.value * 180}deg` }],
      opacity: isFlipped.value < 0.5 ? 1 : 0,
      zIndex: isFlipped.value < 0.5 ? 1 : 0
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${(isFlipped.value - 1) * 180}deg` }],
      opacity: isFlipped.value > 0.5 ? 1 : 0,
      zIndex: isFlipped.value > 0.5 ? 1 : 0
    };
  });

  if (isLoading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 100 }} />;
  if (error || cards.length === 0) return <Text style={{ color: 'red', marginTop: 100, textAlign: 'center' }}>{error}</Text>;

  if (isFinished) {
    const xpGained = cards.length * 5;
    return (
      <Animated.View entering={FadeInUp.springify()} style={styles.resultCard}>
        <Text style={{ fontSize: 40 }}>🧠</Text>
        <Text style={styles.questionText}>Stack Complete!</Text>
        <Text style={{ fontSize: 18, color: '#4B5563', marginVertical: 10 }}>You reviewed {cards.length} terms.</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F59E0B', marginBottom: 30 }}>+{xpGained} XP</Text>
        <Pressable style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </Animated.View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <Animated.View key={currentIndex} entering={SlideInRight.springify()} style={{ flex: 1, alignItems: 'center' }}>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 15 }}>
          <Text style={{ fontSize: 24, color: '#065F46' }}>✕</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#065F46', flex: 1 }}>{title}</Text>
        <Text style={styles.counter}>{currentIndex + 1} / {cards.length}</Text>
      </View>
      
      <View style={styles.cardContainer}>
        {/* Front of Card */}
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          <Text style={styles.cardHint}>Tap to translate</Text>
          <Text style={styles.nativeText}>{currentCard.term}</Text>
        </Animated.View>

        {/* Back of Card */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <Text style={styles.cardHint}>Did you get it right?</Text>
          <Text style={styles.englishText}>{currentCard.translation}</Text>
        </Animated.View>
        
        {/* Invisible touch layer to flip */}
        <Pressable style={StyleSheet.absoluteFill} onPress={flipCard} />
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next Card ➡️</Text>
        </Pressable>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  resultCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center' },
  questionText: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  counter: { fontSize: 18, fontWeight: 'bold', color: '#6B7280', marginBottom: 20 },
  cardContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
    transform: [{ perspective: 1000 }]
  },
  card: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    boxShadow: '0px 20px 40px rgba(0,0,0,0.1)',
    elevation: 10,
    backfaceVisibility: 'hidden'
  },
  cardBack: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981'
  },
  nativeText: { fontSize: 48, fontWeight: 'bold', color: '#065F46', textAlign: 'center' },
  englishText: { fontSize: 36, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  cardHint: { position: 'absolute', top: 20, fontSize: 14, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  actionRow: { marginTop: 40, width: '100%' },
  button: { backgroundColor: '#10B981', padding: 18, borderRadius: 16, alignItems: 'center', width: '100%' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
