import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { id: 'tamil', name: 'Tamil', subtitle: 'தமிழ்', color: '#10B981' },
  { id: 'hindi', name: 'Hindi', subtitle: 'हिन्दी', color: '#059669' },
  { id: 'telugu', name: 'Telugu', subtitle: 'తెలుగు', color: '#047857' },
  { id: 'malayalam', name: 'Malayalam', subtitle: 'മലയാളം', color: '#34D399' },
  { id: 'kannada', name: 'Kannada', subtitle: 'ಕನ್ನಡ', color: '#6EE7B7' }
];

function LanguageCard({ lang, index, onPress }: { lang: any; index: number; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Animated.View style={[styles.card, animatedStyle, { borderLeftColor: lang.color, borderLeftWidth: 6 }]}>
          <Text style={styles.cardTitle}>{lang.name}</Text>
          <Text style={styles.cardSubtitle}>{lang.subtitle}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { setLearningLanguage } = useAuth();

  const handleSelect = async (langId: string) => {
    if (setLearningLanguage) {
      await setLearningLanguage(langId);
    }
    router.push({ pathname: '/assessment', params: { language: langId } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFDD0', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.Text entering={FadeIn.duration(800)} style={styles.header}>
          Which language do you want to learn?
        </Animated.Text>
        <View style={styles.grid}>
          {LANGUAGES.map((lang, index) => (
            <LanguageCard 
              key={lang.id} 
              lang={lang} 
              index={index} 
              onPress={() => handleSelect(lang.id)} 
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#064E3B',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 400,
  },
  grid: {
    width: '100%',
    maxWidth: 500,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 2,
    backdropFilter: 'blur(10px)',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 20,
    color: '#6B7280',
  }
});
