import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import StoryAdventure from '../../components/practice/StoryAdventure';

export default function StoryScreen() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();

  // Format the country id into a title for the AI prompt
  let title = 'India';
  if (missionId === 'usa') title = 'USA';
  else if (missionId === 'uk') title = 'United Kingdom';
  else if (missionId === 'dubai') title = 'Dubai';

  return (
    <View style={styles.container}>
      <StoryAdventure countryId={missionId || 'india'} title={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
