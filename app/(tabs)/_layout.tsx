import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import { useAuth } from '../../context/AuthContext';

function TabBarIcon(props: { name: string, color: any }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color: props.color }]}>{props.name}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
      {isDesktop && <Sidebar />}
      
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#10B981',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: isDesktop ? { display: 'none' } : {
              backgroundColor: '#ffffff',
              borderTopWidth: 0,
              boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.05)',
              height: 80,
              paddingBottom: 20,
              paddingTop: 10,
            },
            tabBarLabelStyle: {
              fontWeight: 'bold',
              fontSize: 12,
            }
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Learn',
              tabBarIcon: ({ color }) => <TabBarIcon name="📚" color={color} />,
            }}
          />
          <Tabs.Screen
            name="games"
            options={{
              title: 'Games',
              tabBarIcon: ({ color }) => <TabBarIcon name="🎮" color={color} />,
            }}
          />
          <Tabs.Screen
            name="two"
            options={{
              title: 'Community',
              tabBarIcon: ({ color }) => <TabBarIcon name="🌍" color={color} />,
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Leaderboard',
              tabBarIcon: ({ color }) => <TabBarIcon name="🏆" color={color} />,
            }}
          />
          <Tabs.Screen
            name="culture"
            options={{
              title: 'Culture',
              tabBarIcon: ({ color }) => <TabBarIcon name="🏛️" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <TabBarIcon name="👤" color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  }
});
