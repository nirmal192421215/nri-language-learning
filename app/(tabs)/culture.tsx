import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { CULTURE_DATA } from '../../constants/translations';
import MascotAssistant from '../../components/MascotAssistant';

const LANGUAGE_NAMES: Record<string, string> = {
  tamil: 'Tamil Nadu',
  hindi: 'North India',
  telugu: 'Andhra Pradesh & Telangana',
  malayalam: 'Kerala',
  kannada: 'Karnataka'
};

export default function CultureScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user } = useAuth();

  const lang = user?.learningLanguage || 'tamil';
  const data = CULTURE_DATA[lang] || CULTURE_DATA['tamil'];
  const regionName = LANGUAGE_NAMES[lang] || 'Tamil Nadu';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ECFDF5', '#F0FDF4']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()}>
          <Text style={styles.title}>🏛️ Culture Hub</Text>
          <Text style={styles.subtitle}>Immerse yourself in the rich heritage of {regionName}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
          <LinearGradient colors={['#10B981', '#059669']} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>HERITAGE SPOTLIGHT</Text>
            <Text style={styles.heroTitle}>{data.heroTitle}</Text>
            <Text style={styles.heroDesc}>{data.heroDesc}</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Festivals</Text>
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.festivalsScroll}
          style={{ marginBottom: 30 }}
        >
          {data.festivals.map((fest: any, idx: number) => (
            <Animated.View key={fest.id} entering={FadeInRight.delay(idx * 150).springify()}>
              <Pressable style={styles.festivalCard}>
                <View style={[styles.festivalIconWrap, { backgroundColor: fest.color }]}>
                  <Text style={styles.festivalIcon}>{fest.icon}</Text>
                </View>
                <Text style={styles.festivalTitle}>{fest.title}</Text>
                <Text style={styles.festivalDesc}>{fest.desc}</Text>
                <View style={styles.vocabBox}>
                  <Text style={styles.vocabLabel}>Key Vocab:</Text>
                  <Text style={styles.vocabText}>{fest.vocab}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Traditional Arts</Text>
        <View style={styles.artsGrid}>
          {data.arts.map((art: any, idx: number) => (
            <Animated.View key={idx} entering={FadeInUp.delay(300 + idx * 50).springify()} style={[styles.artCard, isDesktop && { width: '23%' }]}>
              <Text style={styles.artIcon}>{art.icon}</Text>
              <Text style={styles.artTitle}>{art.title}</Text>
              <Text style={styles.artDesc}>{art.desc}</Text>
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
  content: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#065F46', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#4B5563', marginBottom: 25 },
  
  heroCard: {
    padding: 30,
    borderRadius: 24,
    marginBottom: 35,
    boxShadow: '0px 10px 20px rgba(16, 185, 129, 0.2)',
    elevation: 5,
    position: 'relative',
    overflow: 'hidden'
  },
  heroContent: { zIndex: 1 },
  heroBadge: { color: '#A7F3D0', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginBottom: 10 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  heroDesc: { fontSize: 16, color: '#ECFDF5', lineHeight: 24 },

  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  
  festivalsScroll: { gap: 15, paddingBottom: 10 },
  festivalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: 280,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.02)',
    elevation: 2
  },
  festivalIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  festivalIcon: { fontSize: 24 },
  festivalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  festivalDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 15 },
  vocabBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12 },
  vocabLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  vocabText: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },

  artsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15
  },
  artCard: {
    backgroundColor: 'white',
    width: '47%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.02)',
    elevation: 1
  },
  artIcon: { fontSize: 32, marginBottom: 10 },
  artTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  artDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' }
});
