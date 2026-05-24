import { View, Text, StyleSheet, Pressable, ScrollView, Animated as RNAnimated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInRight, FadeOutLeft, SlideInRight, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { generateAssessmentQuestions, AssessmentQuestion } from '../utils/ai';

export default function AssessmentScreen() {
  const router = useRouter();
  const { language } = useLocalSearchParams();
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const langStr = (language as string) || 'Tamil';
        const fetched = await generateAssessmentQuestions(langStr);
        setQuestions(fetched);
      } catch (err: any) {
        // Fallback to error state
        setError(err.message || 'Failed to generate questions. Did you set EXPO_PUBLIC_GEMINI_API_KEY?');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [language]);

  useEffect(() => {
    if (questions.length > 0) {
      RNAnimated.timing(progressAnim, {
        toValue: (currentIndex / questions.length) * 100,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions]);

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    const newScore = score + (selectedAnswer === currentQuestion.correctOption ? 10 : 0);
    
    if (currentIndex < questions.length - 1) {
      setScore(newScore);
      setCurrentIndex(curr => curr + 1);
      setSelectedAnswer(null);
    } else {
      router.replace({ pathname: '/result', params: { score: newScore } });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#F0FDF4', '#FFFDD0']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 20, color: '#065F46' }}>Generating AI Assessment...</Text>
      </View>
    );
  }

  if (error || questions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <LinearGradient colors={['#F0FDF4', '#FFFDD0']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 18, color: '#DC2626', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <Pressable style={styles.nextButton} onPress={() => router.replace('/')}>
           <Text style={styles.nextButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F0FDF4', '#FFFDD0']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <RNAnimated.View style={[styles.progressBarFill, {
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }]} />
        </View>
        <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View 
          key={currentIndex}
          entering={SlideInRight.springify()} 
          exiting={FadeOutLeft}
          layout={Layout.springify()}
          style={styles.questionCard}
        >
          {(currentQuestion.type as string) === 'audio' && (
            <View style={styles.audioPlaceholder}>
              <Text style={{fontSize:40}}>🔊</Text>
              <Text style={styles.audioText}>Play Audio</Text>
            </View>
          )}

          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsGrid}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedAnswer(idx)}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, selectedAnswer === null && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  progressText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#065F46',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.05)',
    elevation: 5,
  },
  audioPlaceholder: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    marginBottom: 20,
  },
  audioText: {
    color: '#059669',
    marginTop: 10,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#059669',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
