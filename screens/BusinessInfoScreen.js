import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { TextInput, Button, Surface, Title, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BusinessInfoScreen({ navigation }) {
  const [business, setBusiness] = useState('');

  const handleSubmit = () => {
    navigation.navigate('Proposal', { business });
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
    >
      <Surface style={styles.container}>
        <View style={styles.header}>
          <Icon name="briefcase-outline" size={40} color="#3498db" />
          <Title style={styles.title}>Business Information</Title>
        </View>
        <Paragraph style={styles.description}>
          Please provide details about your business to receive a customized proposal.
        </Paragraph>
        <TextInput
          label="Tell us about your business"
          value={business}
          onChangeText={setBusiness}
          mode="outlined"
          multiline
          numberOfLines={6}
          textColor='black'
          style={styles.input}
          theme={{ colors: { primary: '#3498db' } }}
        />
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.button}
          labelStyle={styles.buttonText}
          icon="arrow-right"
        >
          Get Proposal
        </Button>
      </Surface>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 24,
    margin: 16,
    borderRadius: 10,
    elevation: 4,
    opacity: 0.95,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#2c3e50',
  },
  description: {
    marginBottom: 24,
    fontSize: 16,
    
    color: '#34495e',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#ecf0f1',
    color:'black'
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});