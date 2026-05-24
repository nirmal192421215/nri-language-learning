import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Learn', icon: '📚', route: '/' },
    { name: 'Games', icon: '🎮', route: '/games' },
    { name: 'Community', icon: '🌍', route: '/two' },
    { name: 'Leaderboard', icon: '🏆', route: '/leaderboard' },
    { name: 'Culture', icon: '🏛️', route: '/culture' },
    { name: 'Profile', icon: '👤', route: '/profile' }
  ];

  return (
    <View style={styles.sidebarContainer}>
      {/* Brand */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandIcon}>🌿</Text>
        <Text style={styles.brandText}>NRI Lang</Text>
      </View>

      {/* Nav Links */}
      <View style={styles.navContainer}>
        {navItems.map((item, idx) => {
          const isActive = pathname === item.route;
          return (
            <Pressable 
              key={idx} 
              onPress={() => router.push(item.route as any)}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Stats Section */}
      {user && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🔥</Text>
            <View>
              <Text style={styles.statValue}>{user.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⭐</Text>
            <View>
              <Text style={styles.statValue}>{user.xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>
      )}

      {/* Logout */}
      <Pressable onPress={async () => {
        await logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          router.replace('/');
        }
      }} style={styles.logoutButton}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 250,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: 30,
    paddingHorizontal: 15,
    paddingBottom: 30,
    height: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  brandIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065F46',
  },
  navContainer: {
    gap: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  navIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  navTextActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  logoutIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  }
});
