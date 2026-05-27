import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '../../components/KidsTheme';

export default function VocabularyScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FEF3C7', '#FDE68A', '#FCD34D']} style={StyleSheet.absoluteFill} />
      <Text style={styles.emoji}>📚</Text>
      <Text style={styles.title}>Vocabulary Island</Text>
      <Text style={styles.subtitle}>New words coming soon! ✨</Text>
      <Text style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
        ← Back to Map
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.textDark, marginBottom: 12 },
  subtitle: { fontFamily: Fonts.bodyReg, fontSize: 18, color: Colors.textMid, marginBottom: 30 },
  backBtn: { fontFamily: Fonts.bodySemi, fontSize: 16, color: '#B45309', padding: 12, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: Radius.pill, overflow: 'hidden' }
});
