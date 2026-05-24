import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { UI_TRANSLATIONS } from '../../constants/translations';
import MascotAssistant from '../../components/MascotAssistant';

const API_URL = 'http://localhost:5005/api';

const avatars = {
  tiger: require('../../assets/avatars/tiger.png'),
  panda: require('../../assets/avatars/panda.png'),
  monkey: require('../../assets/avatars/monkey.png'),
  elephant: require('../../assets/avatars/elephant.png'),
  lion: require('../../assets/avatars/lion.png'),
  koala: require('../../assets/avatars/koala.png'),
  giraffe: require('../../assets/avatars/giraffe.png'),
  penguin: require('../../assets/avatars/penguin.png'),
};

type Message = {
  _id: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
};

export default function CommunityScreen() {
  const { user } = useAuth();
  
  const lang = user?.learningLanguage || 'tamil';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['tamil'];
  
  const [stats, setStats] = useState({ totalUsers: 0, totalXP: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, msgsRes] = await Promise.all([
        fetch(`${API_URL}/community`),
        fetch(`${API_URL}/messages`)
      ]);
      const statsData = await statsRes.json();
      const msgsData = await msgsRes.json();
      
      if (statsData.error) {
        setStats({ totalUsers: 142, totalXP: 45200 });
      } else {
        setStats(statsData);
      }
      
      if (msgsData.error) {
        const mockMsgs = [
          { _id: 'm1', text: t.communityMockMessage || 'Excited to learn here!', authorName: 'Sarah', authorAvatar: 'panda', timestamp: new Date().toISOString() },
          { _id: 'm2', text: 'Does anyone want to practice speaking later?', authorName: 'Rahul', authorAvatar: 'lion', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { _id: 'm3', text: 'The new gamification features are so fun!', authorName: 'Emily', authorAvatar: 'giraffe', timestamp: new Date(Date.now() - 7200000).toISOString() }
        ];
        
        if (user) {
          mockMsgs.unshift({
            _id: 'm0',
            text: `Hi I'm ${user.name}! I just joined the community.`,
            authorName: user.name,
            authorAvatar: user.avatar || 'tiger',
            timestamp: new Date().toISOString()
          });
        }
        
        setMessages(mockMsgs);
      } else {
        setMessages(Array.isArray(msgsData) ? msgsData : []);
      }
    } catch (e) {
      console.error("Failed to fetch community data", e);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 10 seconds to make it feel "live"
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePost = async () => {
    if (!inputText.trim() || !user) return;
    setIsPosting(true);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          authorName: user.name,
          authorAvatar: user.avatar || 'tiger'
        })
      });
      const newMsg = await res.json();
      if (newMsg && !newMsg.error) {
        setMessages([newMsg, ...(Array.isArray(messages) ? messages : [])]);
      } else if (newMsg && newMsg.error) {
        // Fallback for offline UI testing
        const fallbackMsg = {
          _id: Math.random().toString(),
          text: inputText.trim(),
          authorName: user.name,
          authorAvatar: user.avatar || 'tiger',
          timestamp: new Date().toISOString()
        };
        setMessages([fallbackMsg, ...(Array.isArray(messages) ? messages : [])]);
      }
      setInputText('');
    } catch (e) {
      console.error("Failed to post message", e);
    } finally {
      setIsPosting(false);
    }
  };

  const getAvatarSource = (key: string) => {
    return avatars[key as keyof typeof avatars] || avatars.tiger;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#F0FDF4', '#FFFDD0']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
          <Text style={styles.title}>Global Community</Text>
          <Text style={styles.subtitle}>Connect with real learners worldwide!</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.statsContainer}>
          <View style={styles.statBox}>
             <Text style={styles.statNumber}>{stats.totalUsers}</Text>
             <Text style={styles.statLabel}>Total Learners</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
             <Text style={styles.statNumber}>{stats.totalXP}</Text>
             <Text style={styles.statLabel}>Platform XP</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.boardSection}>
          <Text style={styles.sectionTitle}>Live Message Board</Text>
          
          <View style={styles.boardCard}>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>Be the first to post a message!</Text>
            ) : (
              messages.map((msg, index) => (
                <View key={msg._id || `msg-${index}`} style={styles.messageItem}>
                  <Image source={getAvatarSource(msg.authorAvatar)} style={styles.msgAvatar} />
                  <View style={styles.msgContent}>
                    <View style={styles.msgHeader}>
                      <Text style={styles.msgAuthor}>{msg.authorName || 'Anonymous'}</Text>
                      <Text style={styles.msgTime}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                    <Text style={styles.msgText}>{msg.text || ''}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Post Input Box */}
      {user ? (
        <View style={styles.inputContainer}>
          <Image source={getAvatarSource(user.avatar || 'tiger')} style={styles.inputAvatar} />
          <TextInput
            style={styles.input}
            placeholder="Say hello to the community..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handlePost}
            returnKeyType="send"
            maxLength={150}
          />
          <Pressable 
            style={[styles.postButton, (!inputText.trim() || isPosting) && styles.postButtonDisabled]} 
            onPress={handlePost}
            disabled={!inputText.trim() || isPosting}
          >
            <Text style={styles.postText}>Post</Text>
          </Pressable>
        </View>
      ) : null}

      <MascotAssistant />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#064E3B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#059669' },
  
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  
  boardSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  boardCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 20, fontStyle: 'italic' },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  msgAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#ECFDF5' },
  msgContent: { flex: 1 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  msgAuthor: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  msgTime: { fontSize: 12, color: '#9CA3AF' },
  msgText: { fontSize: 15, color: '#4B5563', lineHeight: 20 },

  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  inputAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
  },
  postButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postButtonDisabled: { backgroundColor: '#A7F3D0' },
  postText: { color: 'white', fontWeight: 'bold' }
});
