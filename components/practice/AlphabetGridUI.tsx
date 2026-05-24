import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const ALPHABETS: Record<string, { letter: string; sound: string; desc: string }[]> = {
  tamil: [
    { letter: 'அ', sound: 'a', desc: 'Amma (Mother)' },
    { letter: 'ஆ', sound: 'aa', desc: 'Aadu (Goat)' },
    { letter: 'இ', sound: 'i', desc: 'Ilai (Leaf)' },
    { letter: 'ஈ', sound: 'ee', desc: 'Eetti (Spear)' },
    { letter: 'உ', sound: 'u', desc: 'Ural (Mortar)' },
    { letter: 'ஊ', sound: 'oo', desc: 'Oosi (Needle)' },
    { letter: 'எ', sound: 'e', desc: 'Eli (Rat)' },
    { letter: 'ஏ', sound: 'ae', desc: 'Aeni (Ladder)' },
    { letter: 'ஐ', sound: 'ai', desc: 'Aindhu (Five)' },
    { letter: 'ஒ', sound: 'o', desc: 'Ottagam (Camel)' },
    { letter: 'ஓ', sound: 'oo', desc: 'Odam (Boat)' },
    { letter: 'ஔ', sound: 'au', desc: 'Avvai (Old Woman)' },
  ],
  hindi: [
    { letter: 'अ', sound: 'a', desc: 'Anaar (Pomegranate)' },
    { letter: 'आ', sound: 'aa', desc: 'Aam (Mango)' },
    { letter: 'इ', sound: 'i', desc: 'Imli (Tamarind)' },
    { letter: 'ई', sound: 'ee', desc: 'Eekh (Sugarcane)' },
    { letter: 'उ', sound: 'u', desc: 'Ullu (Owl)' },
    { letter: 'ऊ', sound: 'oo', desc: 'Oon (Wool)' },
    { letter: 'ए', sound: 'e', desc: 'Ek (One)' },
    { letter: 'ऐ', sound: 'ai', desc: 'Ainak (Spectacles)' },
    { letter: 'ओ', sound: 'o', desc: 'Okhli (Mortar)' },
    { letter: 'औ', sound: 'au', desc: 'Aurat (Woman)' },
  ],
  telugu: [
    { letter: 'అ', sound: 'a', desc: 'Amma (Mother)' },
    { letter: 'ఆ', sound: 'aa', desc: 'Aavu (Cow)' },
    { letter: 'ఇ', sound: 'i', desc: 'Illu (House)' },
    { letter: 'ఈ', sound: 'ee', desc: 'Eega (Fly)' },
    { letter: 'ఉ', sound: 'u', desc: 'Udutha (Squirrel)' },
    { letter: 'ఊ', sound: 'oo', desc: 'Uyyala (Cradle)' },
    { letter: 'ఎ', sound: 'e', desc: 'Eluka (Rat)' },
    { letter: 'ఏ', sound: 'ae', desc: 'Aenugu (Elephant)' },
    { letter: 'ఐ', sound: 'ai', desc: 'Aidu (Five)' },
    { letter: 'ఒ', sound: 'o', desc: 'Onti (Camel)' },
  ],
  malayalam: [
    { letter: 'അ', sound: 'a', desc: 'Amma (Mother)' },
    { letter: 'ആ', sound: 'aa', desc: 'Aana (Elephant)' },
    { letter: 'ഇ', sound: 'i', desc: 'Ila (Leaf)' },
    { letter: 'ഈ', sound: 'ee', desc: 'Eettillam (Hospital)' },
    { letter: 'ഉ', sound: 'u', desc: 'Urumb (Ant)' },
    { letter: 'ഊ', sound: 'oo', desc: 'Oonjal (Swing)' },
    { letter: 'എ', sound: 'e', desc: 'Eli (Rat)' },
    { letter: 'ഏ', sound: 'ae', desc: 'Aethapazham (Banana)' },
    { letter: 'ഐ', sound: 'ai', desc: 'Aiswaryam (Wealth)' },
    { letter: 'ഒ', sound: 'o', desc: 'Ottakam (Camel)' },
  ],
  kannada: [
    { letter: 'ಅ', sound: 'a', desc: 'Amma (Mother)' },
    { letter: 'ಆ', sound: 'aa', desc: 'Aane (Elephant)' },
    { letter: 'ಇ', sound: 'i', desc: 'Ili (Rat)' },
    { letter: 'ಈ', sound: 'ee', desc: 'Eerulli (Onion)' },
    { letter: 'ಉ', sound: 'u', desc: 'Uguru (Nail)' },
    { letter: 'ಊ', sound: 'oo', desc: 'Oota (Meal)' },
    { letter: 'ಎ', sound: 'e', desc: 'Ele (Leaf)' },
    { letter: 'ಏ', sound: 'ae', desc: 'Aeni (Ladder)' },
    { letter: 'ಐ', sound: 'ai', desc: 'Aidu (Five)' },
    { letter: 'ಒ', sound: 'o', desc: 'Onde (One)' },
  ]
};

export default function AlphabetGridUI({ skill, title }: { skill: string; title: string }) {
  const { user, updateProgress, completeModule } = useAuth();
  const router = useRouter();
  const [leveledUp, setLeveledUp] = useState(false);
  const [newTier, setNewTier] = useState('');
  const lang = user?.learningLanguage || 'tamil';
  
  const letters = ALPHABETS[lang] || ALPHABETS['tamil'];
  const [activeLetter, setActiveLetter] = useState<number | null>(null);

  const handlePress = (index: number) => {
    setActiveLetter(index);
    // In a real app, this is where we would trigger expo-av to play the sound.
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSub}>Tap any letter to hear its sound and translation.</Text>

      {activeLetter !== null && (
        <Animated.View entering={FadeIn} style={styles.activeDisplayCard}>
          <Text style={styles.activeLetterText}>{letters[activeLetter].letter}</Text>
          <View style={styles.activeDetailsBox}>
            <Text style={styles.activeSoundText}>/{letters[activeLetter].sound}/</Text>
            <Text style={styles.activeDescText}>{letters[activeLetter].desc}</Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.grid}>
        {letters.map((item, index) => {
          const isActive = activeLetter === index;
          return (
            <Pressable 
              key={index} 
              style={[styles.gridItem, isActive && styles.gridItemActive]} 
              onPress={() => handlePress(index)}
            >
              <Text style={[styles.itemLetter, isActive && styles.itemLetterActive]}>{item.letter}</Text>
              <Text style={[styles.itemSound, isActive && styles.itemSoundActive]}>{item.sound}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.completeBtn} onPress={async () => {
        updateProgress(20);
        const result = await completeModule('foundations');
        if (result?.leveledUp) {
          setLeveledUp(true);
          setNewTier(result.newTier);
        } else {
          router.replace('/(tabs)');
        }
      }}>
        <Text style={styles.completeBtnText}>Complete Lesson</Text>
      </Pressable>

      {leveledUp && (
        <View style={{ marginTop: 20, padding: 20, backgroundColor: '#FEF3C7', borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: '#F59E0B' }}>
          <Text style={{ fontSize: 40 }}>🎉</Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>Level Up!</Text>
          <Text style={{ fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 16 }}>All 4 modules done! Welcome to <Text style={{ fontWeight: 'bold', color: '#10B981' }}>{newTier}</Text>!</Text>
          <Pressable style={[styles.completeBtn, { backgroundColor: '#F59E0B' }]} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.completeBtnText}>Start {newTier} Phase 🚀</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  activeDisplayCard: {
    backgroundColor: '#10B981',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  activeLetterText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  activeDetailsBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeSoundText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  activeDescText: {
    fontSize: 16,
    color: '#D1FAE5',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    maxWidth: isDesktop ? 600 : '100%',
  },
  gridItem: {
    width: isDesktop ? 100 : 80,
    height: isDesktop ? 100 : 80,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  gridItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    transform: [{ scale: 1.05 }],
  },
  itemLetter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
  },
  itemLetterActive: {
    color: '#10B981',
  },
  itemSound: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  itemSoundActive: {
    color: '#059669',
  },
  completeBtn: {
    marginTop: 40,
    backgroundColor: '#1F2937',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
  },
  completeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
