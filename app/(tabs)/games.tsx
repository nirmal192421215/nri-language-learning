import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import MascotAssistant from '../../components/MascotAssistant';

export default function GamesHubScreen() {
  const router = useRouter();

  const games = [
    {
      id: 'listen',
      title: 'Listen & Select',
      description: 'Train your ear! Listen to the spoken word and choose the correct translation.',
      icon: '🎧',
      color: ['#10B981', '#059669'], // Emerald
      route: '/game-listen'
    },
    {
      id: 'picture',
      title: 'Picture Quiz',
      description: 'Visual learning! Match the correct language word to the picture shown.',
      icon: '🖼️',
      color: ['#F59E0B', '#D97706'], // Amber
      route: '/game-picture'
    },
    {
      id: 'sentence',
      title: 'Sentence Builder',
      description: 'Time attack! Arrange the scrambled words into a perfect sentence fast.',
      icon: '🧩',
      color: ['#3B82F6', '#2563EB'], // Blue
      route: '/game-sentence'
    },
    {
      id: 'pronounce',
      title: 'Pronunciation Battle',
      description: 'Speak into the mic! AI analyzes your accent and scores your fluency.',
      icon: '🎤',
      color: ['#8B5CF6', '#7C3AED'], // Violet
      route: '/game-pronounce'
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.springify()} style={styles.header}>
          <Text style={styles.title}>🎮 Games Hub</Text>
          <Text style={styles.subtitle}>Play, practice, and earn XP!</Text>
        </Animated.View>

        <View style={styles.grid}>
          {games.map((game, index) => (
            <Animated.View 
              key={game.id} 
              entering={FadeInUp.delay(index * 100).springify()}
              style={styles.cardWrapper}
            >
              <Pressable 
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed
                ]}
                onPress={() => router.push(game.route as any)}
              >
                <LinearGradient 
                  colors={game.color as [string, string]} 
                  style={styles.cardGradient}
                  start={{x: 0, y: 0}} 
                  end={{x: 1, y: 1}}
                >
                  <Text style={styles.cardIcon}>{game.icon}</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardDesc}>{game.description}</Text>
                  
                  <View style={styles.playButton}>
                    <Text style={styles.playText}>Play Now</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <MascotAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#064E3B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#059669' },
  
  grid: {
    gap: 20,
    ...(Platform.OS === 'web' && {
      flexDirection: 'row',
      flexWrap: 'wrap',
    })
  },
  cardWrapper: {
    ...(Platform.OS === 'web' && {
      width: '48%',
      minWidth: 300,
    })
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardGradient: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 60,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
