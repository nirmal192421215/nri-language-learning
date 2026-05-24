import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
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

type LeaderboardUser = {
  _id: string;
  name: string;
  avatar: string;
  xp: number;
  level: string;
};

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      const data = await res.json();
      if (data && data.error) {
        const mockLeaderboard = [
          { _id: '2', name: 'Priya', avatar: 'panda', xp: 21100, level: 'Intermediate - Level 8' },
          { _id: '3', name: 'Karthik', avatar: 'tiger', xp: 18500, level: 'Beginner - Level 12' },
          { _id: '4', name: 'Meera', avatar: 'elephant', xp: 15200, level: 'Beginner - Level 10' },
          { _id: '5', name: 'Rahul', avatar: 'monkey', xp: 12000, level: 'Beginner - Level 6' }
        ];
        
        if (user) {
          mockLeaderboard.push({
            _id: user.email || '1',
            name: user.name,
            avatar: user.avatar || 'tiger',
            xp: user.xp > 0 ? user.xp : 25400, // Show realistic XP
            level: user.level || 'Pro - Level 5'
          });
        } else {
          mockLeaderboard.push({ _id: '1', name: 'Arjun', avatar: 'lion', xp: 25400, level: 'Pro - Level 5' });
        }
        
        setLeaderboard(mockLeaderboard.sort((a, b) => b.xp - a.xp));
      } else {
        setLeaderboard(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  const getAvatarSource = (key: string) => {
    return avatars[key as keyof typeof avatars] || avatars.tiger;
  };

  // Helper to extract tier (e.g. "Beginner", "Intermediate")
  const getTier = (levelStr: string) => {
    if (!levelStr) return 'Bronze';
    return levelStr.split(' - ')[0];
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ECFDF5', '#F0FDF4']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Compete with real learners worldwide!</Text>
        </Animated.View>

        <View style={styles.board}>
          {leaderboard.map((lbUser, index) => {
            // Check if this row belongs to the currently logged in user
            const isCurrentUser = user && user.name === lbUser.name;
            const rank = index + 1;

            return (
              <Animated.View 
                key={lbUser._id || `lb-${index}`} 
                entering={FadeInUp.delay(index * 50).springify()}
                style={[styles.row, isCurrentUser && styles.currentUserRow]}
              >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rank, rank <= 3 && styles.rankTop]}>#{rank}</Text>
                </View>
                
                <Image source={getAvatarSource(lbUser.avatar)} style={styles.avatarImage} />
                
                <View style={styles.userInfo}>
                  <Text style={[styles.name, isCurrentUser && styles.currentUserName]}>
                    {lbUser.name} {isCurrentUser && '(You)'}
                  </Text>
                  <Text style={styles.tier}>{getTier(lbUser.level)} League</Text>
                </View>

                <Text style={styles.xp}>{lbUser.xp} XP</Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      <MascotAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#065F46', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#4B5563', marginBottom: 30 },
  board: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.02)',
    elevation: 2
  },
  currentUserRow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 2
  },
  rankContainer: { width: 45, alignItems: 'center', marginRight: 10 },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#9CA3AF' },
  rankTop: { color: '#F59E0B', fontSize: 22 },
  
  avatarImage: {
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: '#F3F4F6',
    marginRight: 12
  },

  userInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  currentUserName: { color: '#059669' },
  tier: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  xp: { fontSize: 16, fontWeight: 'bold', color: '#10B981' }
});
