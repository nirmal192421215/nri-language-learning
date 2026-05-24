import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import MascotAssistant from '../../components/MascotAssistant';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
const avatars = {
  tiger: require('../../assets/avatars/tiger.png'),
  panda: require('../../assets/avatars/panda.png'),
  elephant: require('../../assets/avatars/elephant.png'),
  lion: require('../../assets/avatars/lion.png'),
  koala: require('../../assets/avatars/koala.png'),
  giraffe: require('../../assets/avatars/giraffe.png'),
  penguin: require('../../assets/avatars/penguin.png'),
};

type AvatarKey = keyof typeof avatars;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name === '[object Object]' ? '' : (user?.name || ''));
  const [editAvatar, setEditAvatar] = useState<AvatarKey>((user?.avatar as string) === 'monkey' ? 'tiger' : ((user?.avatar as AvatarKey) || 'tiger'));

  if (!user) return null;

  const currentAvatar = (user.avatar as string) === 'monkey' ? 'tiger' : ((user.avatar as AvatarKey) || 'tiger');

  const handleSave = async () => {
    await updateProfile(editName, editAvatar);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ECFDF5', '#F0FDF4']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify()} style={styles.headerCard}>
          
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }} />
            {!isEditing ? (
              <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>✕ Cancel</Text>
              </Pressable>
            )}
          </View>

          {!isEditing ? (
            <>
              <Image source={avatars[currentAvatar] || avatars['tiger']} style={styles.avatarImage} />
              <Text style={styles.name}>{user.name === '[object Object]' ? 'Student' : user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </>
          ) : (
            <View style={styles.editModeContainer}>
              <Text style={styles.editLabel}>Choose your Avatar:</Text>
              <View style={styles.avatarSelector}>
                {(Object.keys(avatars) as AvatarKey[]).map(key => (
                  <Pressable 
                    key={key} 
                    onPress={() => setEditAvatar(key)}
                    style={[styles.avatarOption, editAvatar === key && styles.avatarOptionSelected]}
                  >
                    <Image source={avatars[key]} style={styles.avatarOptionImg} />
                  </Pressable>
                ))}
              </View>
              
              <Text style={styles.editLabel}>Display Name:</Text>
              <TextInput 
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your Name"
              />

              <Pressable onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          )}

          {!isEditing && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{user.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{user.xp}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {!isEditing && (() => {
          const completedCount = (user.completedModules || []).length;
          const actualProgress = (completedCount / 4) * 100;
          return (
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Learning Progress</Text>
              <View style={styles.card}>
                <View style={styles.levelRow}>
                  <Text style={styles.levelTitle}>Current Level: {user.level}</Text>
                  <Text style={styles.levelPercent}>{actualProgress}%</Text>
                </View>
                <View style={[styles.progressBarBg, { width: '100%' }]}>
                  <View style={[styles.progressBarFill, { width: `${actualProgress}%`, borderTopRightRadius: actualProgress === 100 ? 5 : 0, borderBottomRightRadius: actualProgress === 100 ? 5 : 0 }]} />
                </View>
              </View>
            </Animated.View>
          );
        })()}

        {!isEditing && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={{ marginTop: 40 }}>
            <Pressable onPress={async () => {
              await logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              } else {
                router.replace('/');
              }
            }} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
      <MascotAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    boxShadow: '0px 10px 30px rgba(0,0,0,0.05)',
    elevation: 5,
    marginBottom: 30
  },
  headerTopRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10
  },
  editBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  editBtnText: { color: '#4B5563', fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelBtnText: { color: '#9CA3AF', fontWeight: 'bold' },
  avatarImage: {
    width: 120, height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#10B981',
    marginBottom: 15
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  email: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  
  editModeContainer: { width: '100%', alignItems: 'center' },
  editLabel: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 15, marginBottom: 10, alignSelf: 'flex-start' },
  avatarSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20
  },
  avatarOption: {
    padding: 5,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  avatarOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5'
  },
  avatarOptionImg: {
    width: 60, height: 60, borderRadius: 30
  },
  input: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20
  },
  saveBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 15,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4B5563', paddingHorizontal: 10 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  levelTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  levelPercent: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  progressBarBg: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },
  logoutButton: { backgroundColor: '#FEE2E2', padding: 18, borderRadius: 16, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontSize: 18, fontWeight: 'bold' }
});
