import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Radius, Shadow } from '../../components/KidsTheme';
import MascotAssistant from '../../components/MascotAssistant';
import ConfettiCannon from 'react-native-confetti-cannon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width, height } = Dimensions.get('window');

const WORLD_MAP = [
  { id: 'india', name: 'India', icon: '🇮🇳', color: '#10B981', gradient: ['#34D399', '#059669'], description: 'Temple visits, family dinners, and festival shopping!', level: 'Beginner' },
  { id: 'usa', name: 'USA', icon: '🇺🇸', color: '#3B82F6', gradient: ['#60A5FA', '#2563EB'], description: 'Teaching friends, family video calls, and cultural events.', level: 'Intermediate' },
  { id: 'uk', name: 'UK', icon: '🇬🇧', color: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'], description: 'School conversations and local community events.', level: 'Pro' },
  { id: 'dubai', name: 'Dubai', icon: '🇦🇪', color: '#F59E0B', gradient: ['#FBBF24', '#D97706'], description: 'Shopping, restaurants, and workplace communication.', level: 'Master' },
];

function FloatingIsland({ country, index, isUnlocked, isCurrent, onPress }: any) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(index * 200, withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 150).springify()} style={[styles.nodeContainer, style, index % 2 === 1 ? { alignSelf: 'flex-end', marginRight: '10%' } : { alignSelf: 'flex-start', marginLeft: '10%' }]}>
      
      {/* Path Line connecting nodes (skip for last) */}
      {index < WORLD_MAP.length - 1 && (
        <View style={[styles.pathLine, index % 2 === 1 ? styles.pathLineLeft : styles.pathLineRight]} />
      )}

      <AnimatedPressable
        style={[styles.islandCard, !isUnlocked && styles.islandLocked, isCurrent && styles.islandCurrent]}
        onPress={isUnlocked ? onPress : null}
      >
        <LinearGradient
          colors={isUnlocked ? country.gradient : ['#D1D5DB', '#9CA3AF']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.islandContent}>
          <Text style={styles.islandIcon}>{country.icon}</Text>
          <View style={styles.islandTextWrap}>
            <Text style={styles.islandName}>{country.name}</Text>
            <Text style={styles.islandLevel}>{country.level}</Text>
          </View>
        </View>

        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
        
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>📍 You are here</Text>
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function WorldJourneyScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);

  // The Airplane Animation State
  const planeAnim = useSharedValue(0);

  useEffect(() => {
    if (params.justUnlocked) {
      // Trigger unlock animation!
      setTimeout(() => setShowConfetti(true), 500);
      
      // We would animate planeAnim from 0 to 1 along a bezier curve
      // For simplicity here, we'll just fire the confetti as a reward for unlocking
    }
  }, [params]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }
  
  if (!user) {
    router.replace('/');
    return null;
  }

  const unlockedCountries = user.unlockedCountries || ['india'];
  const currentCountry = user.currentCountry || 'india';

  const handlePress = (countryId: string) => {
    router.push(`/story/${countryId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']} style={StyleSheet.absoluteFill} />
      
      {/* Clouds Background */}
      <Text style={[styles.cloud, { top: 40, left: 20 }]}>☁️</Text>
      <Text style={[styles.cloud, { top: 120, right: 30, fontSize: 60 }]}>☁️</Text>
      <Text style={[styles.cloud, { top: 300, left: -10, fontSize: 80 }]}>☁️</Text>

      {showConfetti && <ConfettiCannon count={200} origin={{x: width/2, y: -20}} fallSpeed={3000} fadeOut />}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={SlideInDown.springify()} style={styles.header}>
          <Text style={styles.title}>World Journey</Text>
          <Text style={styles.subtitle}>Travel the globe and master your language through epic adventures! 🌍🚀</Text>
          <View style={styles.statsRow}>
            <View style={styles.statPill}><Text style={styles.statText}>⭐ {user.xp} XP</Text></View>
            <View style={[styles.statPill, { borderColor: '#CA8A04', backgroundColor: '#FEF08A' }]}>
              <Text style={[styles.statText, { color: '#854D0E' }]}>🪙 {user.coins || 0}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.mapArea}>
          {WORLD_MAP.map((country, idx) => (
            <FloatingIsland
              key={country.id}
              country={country}
              index={idx}
              isUnlocked={unlockedCountries.includes(country.id) || params.justUnlocked === country.id}
              isCurrent={currentCountry === country.id || params.justUnlocked === country.id}
              onPress={() => handlePress(country.id)}
            />
          ))}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <MascotAssistant message={params.justUnlocked ? `Incredible! We just arrived in ${WORLD_MAP.find(c => c.id === params.justUnlocked)?.name}! ✈️` : "Ready for an adventure? Pick your destination! ✈️"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2FE' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60 },
  header: { paddingHorizontal: 24, marginBottom: 40, alignItems: 'center' },
  title: { fontFamily: Fonts.heading, fontSize: 36, color: '#0369A1', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: Fonts.bodyReg, fontSize: 16, color: '#0284C7', textAlign: 'center', marginBottom: 15 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statPill: { backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 2, borderColor: '#0284C7' },
  statText: { fontFamily: Fonts.bodySemi, color: '#0369A1', fontSize: 16 },
  cloud: { position: 'absolute', fontSize: 50, opacity: 0.8 },
  
  mapArea: { width: '100%', paddingHorizontal: 20, alignItems: 'center' },
  
  nodeContainer: { width: '80%', maxWidth: 350, marginBottom: 50, position: 'relative' },
  islandCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 10px 30px rgba(0,0,0,0.15)' } : { ...Shadow.card }),
  },
  islandLocked: { opacity: 0.7, borderColor: '#9CA3AF' },
  islandCurrent: { borderWidth: 4, borderColor: '#FDE047' },
  
  islandContent: { padding: 24, flexDirection: 'row', alignItems: 'center' },
  islandIcon: { fontSize: 50, marginRight: 16 },
  islandTextWrap: { flex: 1 },
  islandName: { fontFamily: Fonts.heading, fontSize: 28, color: '#FFFFFF' },
  islandLevel: { fontFamily: Fonts.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1 },
  
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  lockIcon: { fontSize: 40 },
  
  currentBadge: { position: 'absolute', top: -15, right: 20, backgroundColor: '#FDE047', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 2, borderColor: '#CA8A04' },
  currentBadgeText: { fontFamily: Fonts.bodySemi, fontSize: 12, color: '#854D0E' },

  pathLine: { position: 'absolute', width: 60, height: 80, borderRightWidth: 4, borderBottomWidth: 4, borderColor: 'rgba(255,255,255,0.6)', borderStyle: 'dashed', borderRadius: 20, zIndex: -1 },
  pathLineRight: { top: '80%', left: '50%' },
  pathLineLeft: { top: '80%', right: '50%', borderLeftWidth: 4, borderRightWidth: 0 }
});
