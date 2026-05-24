import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useRouter, Redirect } from 'expo-router';
import { GREETINGS } from '../../constants/translations';
import { useState } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Helper component for animated module cards
function ModuleCard({ module, isDone, onPress }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  return (
    <AnimatedPressable 
      style={[styles.moduleCard, isDone && styles.moduleCardDone, animatedStyle]}
      onPressIn={() => scale.value = withSpring(0.97, { damping: 12, stiffness: 300 })}
      onPressOut={() => scale.value = withSpring(1, { damping: 12, stiffness: 300 })}
      onPress={onPress}
    >
      <View style={[styles.moduleIconBox, isDone && { backgroundColor: '#D1FAE5' }]}>
        <Text style={styles.moduleIconText}>{isDone ? '✅' : module.icon}</Text>
      </View>
      <View style={styles.moduleInfo}>
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.moduleDesc}>{module.desc}</Text>
        <View style={styles.moduleMetaRow}>
          <Text style={styles.moduleMetaText}>🕒 {module.duration}</Text>
          <Text style={styles.moduleMetaXp}>{isDone ? '✔ Completed' : module.xp}</Text>
        </View>
      </View>
      <View style={styles.moduleAction}>
        <Text style={styles.moduleActionIcon}>➔</Text>
      </View>
    </AnimatedPressable>
  );
}


export default function DashboardScreen() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Redirect to welcome screen if they logout
  if (!user) {
    return <Redirect href="/" />;
  }

  // --- Tier Logic (based on level string, NOT xp) ---
  let tier = 'Beginner';
  if (user?.level?.includes('Pro')) tier = 'Pro';
  else if (user?.level?.includes('Intermediate')) tier = 'Intermediate';

  const completedModules = user?.completedModules || [];
  const totalPillars = 4;
  const completedCount = completedModules.length;
  const tierProgress = (completedCount / totalPillars) * 100;
  const nextTier = tier === 'Beginner' ? 'Intermediate' : tier === 'Intermediate' ? 'Pro' : 'Master';

  // --- Curriculum Definitions ---
  const activeCurriculum = [
    { id: 'c1', title: 'Foundations', desc: tier === 'Beginner' ? 'Master the core letters and sounds.' : tier === 'Intermediate' ? 'Connect words into fluid sentences.' : 'Translate complex paragraphs.', icon: 'Aa', route: '/practice/foundations', duration: '10 min', xp: '+20 XP', moduleId: 'foundations' },
    { id: 'c2', title: 'Communication', desc: tier === 'Beginner' ? 'Learn how to introduce yourself.' : tier === 'Intermediate' ? 'Practice speaking with the AI Tutor.' : 'Chat at normal native speaking speed.', icon: '👋', route: '/practice/communication', duration: '15 min', xp: '+30 XP', moduleId: 'communication' },
    { id: 'c3', title: 'Pronunciation', desc: tier === 'Beginner' ? 'Perfect your accent with simple words.' : tier === 'Intermediate' ? 'Perfect your accent with full sentences.' : 'Perfect your accent with complex idioms.', icon: '🎙️', route: '/practice/pronunciation', duration: '1 hr', xp: '+50 XP', moduleId: 'pronunciation' },
    { id: 'c4', title: 'Assessment', desc: tier === 'Beginner' ? 'Test your foundational knowledge.' : tier === 'Intermediate' ? 'Evaluate your intermediate fluency.' : 'Achieve total fluency certification.', icon: '📝', route: '/practice/assessment', duration: '1 hr', xp: '+100 XP', moduleId: 'assessment' },
  ];

  const earnedBadges = [];
  if (user.xp >= 100) earnedBadges.push({ icon: '🥇', name: 'Quick Learner' });
  if (user.streak >= 5) earnedBadges.push({ icon: '🔥', name: '5 Day Streak' });
  else if (user.streak >= 3) earnedBadges.push({ icon: '🔥', name: '3 Day Streak' });
  if (tier === 'Intermediate' || tier === 'Pro') earnedBadges.push({ icon: '🧠', name: 'Enthusiast' });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#fdfbfb', '#ebedee']} style={StyleSheet.absoluteFill} />
      
      {/* Soft animated background elements */}
      <View style={[styles.glowCircle, { top: -80, right: -20, backgroundColor: '#34D399' }]} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Stats */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{GREETINGS[user?.learningLanguage || 'tamil'] || 'Hello'}, {user.name === '[object Object]' ? 'Student' : user.name}!</Text>
            <Text style={styles.subGreeting}>Let's continue your journey</Text>
          </View>
          {!isDesktop && (
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statText}>{user.streak}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statText}>{user.xp} XP</Text>
              </View>
              <Pressable onPress={logout} style={[styles.statBadge, { paddingHorizontal: 12 }]}>
                <Text style={styles.statIcon}>🚪</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Module Completion Progress Header */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.tierCard}>
          <LinearGradient colors={['#10B981', '#059669']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
          
          <View style={styles.tierHeaderTop}>
            <View>
              <Text style={styles.tierLabel}>Current Level</Text>
              <Text style={styles.tierTitle}>{tier} Phase</Text>
            </View>
            <View style={styles.tierBadge}>
              <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
              <Text style={styles.tierBadgeText}>{tier === 'Pro' ? 'MAX' : `Rank ${tier === 'Beginner' ? 'I' : 'II'}`}</Text>
            </View>
          </View>
          
          <View style={styles.tierProgressContainer}>
            <View style={styles.tierProgressBarBg}>
              <View style={[styles.tierProgressBarFill, { width: `${tierProgress}%`, backgroundColor: '#ffffff' }]} />
            </View>
            <View style={styles.tierProgressTextRow}>
              <Text style={styles.tierProgressText}>{completedCount}/{totalPillars} Modules Done</Text>
              <Text style={styles.tierProgressText}>{tier === 'Pro' ? 'Mastery Reached 🏆' : `Complete all 4 to unlock ${nextTier}`}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Curriculum Modules */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Your Curriculum</Text>
          <Text style={styles.sectionSubtitle}>Complete modules to earn XP and advance your tier.</Text>
          
          {activeCurriculum.map((module, index) => {
            const isDone = completedModules.includes(module.moduleId);
            return (
              <Animated.View key={module.id} entering={FadeInRight.delay(200 + (index * 100)).springify()}>
                <ModuleCard module={module} isDone={isDone} onPress={() => router.push(module.route as any)} />
              </Animated.View>
            );
          })}
        </View>
        
        {/* Achievements */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.achievementsSection}>
           <Text style={styles.sectionTitle}>Recent Badges</Text>
           {earnedBadges.length > 0 ? (
             <View style={styles.badgeList}>
               {earnedBadges.map((badge, index) => (
                 <View key={index} style={styles.badgeItem}>
                   <Text style={{fontSize: 34}}>{badge.icon}</Text>
                   <Text style={styles.badgeName}>{badge.name}</Text>
                 </View>
               ))}
             </View>
           ) : (
             <Text style={{ color: '#6B7280', fontStyle: 'italic', marginLeft: 4 }}>
               Complete tasks and build your streak to earn badges!
             </Text>
           )}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 0,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontWeight: '700',
    color: '#374151',
  },
  tierCard: {
    marginHorizontal: 4,
    borderRadius: 28,
    padding: 28,
    marginBottom: 35,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  tierLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  tierTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  tierBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  tierProgressContainer: {
    width: '100%',
  },
  tierProgressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tierProgressBarFill: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tierProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierProgressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },

  curriculumSection: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '500',
  },
  moduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  moduleCardDone: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  moduleIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleIconText: {
    fontSize: 30,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  moduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleMetaText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginRight: 12,
  },
  moduleMetaXp: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  moduleAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moduleActionIcon: {
    color: '#94a3b8',
    fontSize: 18,
  },
  achievementsSection: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  badgeList: {
    flexDirection: 'row',
    gap: 16,
  },
  badgeItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    width: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
  }
});
