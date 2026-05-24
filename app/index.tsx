import { View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const rotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1, // infinite repeat
      false // do not reverse
    );
  }, []);

  const animatedGlobeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // If user is already logged in, redirect them directly to the dashboard
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fdfbfb', '#ebedee']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements (using shadow for a soft glow since filter: blur isn't standard in RN) */}
      <View style={[styles.glowCircle, { top: -50, right: -50, backgroundColor: '#34D399', shadowColor: '#34D399' }]} />
      <View style={[styles.glowCircle, { bottom: -50, left: -50, backgroundColor: '#60A5FA', shadowColor: '#60A5FA' }]} />
      
      <Animated.View entering={FadeInDown.duration(1000).springify()} style={styles.content}>
        
        <View style={styles.glassCard}>
          <Text style={styles.title}>NRI Language</Text>
          <Text style={styles.subtitle}>Reconnect with your roots.</Text>
          
          <View style={styles.globeContainer}>
             <LinearGradient
               colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.1)']}
               style={styles.globeBg}
             />
             <Animated.Text style={[styles.globeEmoji, animatedGlobeStyle]}>🌍</Animated.Text>
          </View>

          <AnimatedPressable 
            style={[styles.button, buttonAnimatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.push('/(auth)/login')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Learning</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 0,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  glassCard: {
    width: '100%',
    padding: 40,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  globeContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 45,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  globeBg: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  globeEmoji: {
    fontSize: 90,
  },
  button: {
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderRadius: 100,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
