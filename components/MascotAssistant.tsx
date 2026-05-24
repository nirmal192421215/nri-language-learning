import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  withSpring
} from 'react-native-reanimated';

export default function MascotAssistant() {
  const router = useRouter();
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.3);
  const shadowScale = useSharedValue(1);

  useEffect(() => {
    // Up and down float
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true // reverse
    );

    // Slight rotation back and forth
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Shadow pulse inverse to translation
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    shadowScale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedMonkeyStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ]
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    return {
      opacity: shadowOpacity.value,
      transform: [{ scale: shadowScale.value }, { scaleY: 0.3 }]
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(1.1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.monkeyWrapper, animatedMonkeyStyle]}>
        <Pressable 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
          onPress={() => router.push('/')}
        >
          {/* Glassmorphism Chat Bubble */}
          <View style={styles.chatBubbleContainer}>
            <View style={[styles.glassmorphism, Platform.OS === 'web' && styles.webGlass]}>
              <Text style={styles.chatText}>Ready to learn today? 🚀</Text>
            </View>
            <View style={styles.bubbleTail} />
          </View>

          <Image 
            source={require('../assets/avatars/monkey.png')} 
            style={styles.monkeyImage} 
          />
        </Pressable>
      </Animated.View>
      
      {/* Subtle Shadow beneath the mascot */}
      <Animated.View style={[styles.shadow, animatedShadowStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  monkeyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  monkeyImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#10B981', // Emerald green border
    backgroundColor: '#fff',
    // Strong shadow for 3D feel
    ...Platform.select({
      web: { boxShadow: '0px 15px 25px rgba(16, 185, 129, 0.4)' },
      default: { elevation: 10, shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 10 }
    }),
  },
  shadow: {
    width: 70,
    height: 70,
    backgroundColor: '#10B981',
    borderRadius: 35,
    position: 'absolute',
    bottom: -15,
    zIndex: 1,
    ...Platform.select({
      web: { filter: 'blur(8px)' },
      default: {}
    }),
  },
  chatBubbleContainer: {
    position: 'absolute',
    top: -55,
    right: 60,
    width: 200,
    zIndex: 10,
  },
  glassmorphism: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly more opaque for better readability
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.1)' },
      default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }
    })
  },
  webGlass: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  } as any,
  bubbleTail: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
    borderRightWidth: 12,
    borderRightColor: 'transparent',
  },
  chatText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#064E3B', // Dark emerald
    textAlign: 'center',
  }
});
