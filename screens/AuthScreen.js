import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getDatabase, ref, set, get, serverTimestamp } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [animation] = useState(new Animated.Value(0));
  const [logoAnimation] = useState(new Animated.Value(0));
  const [showPassword, setShowPassword] = useState(false);

  const auth = getAuth();
  const database = getDatabase();
  const navigation = useNavigation();

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const storeUserData = async (userId, email, userType) => {
    try {
      const userData = JSON.stringify({
        userId,
        email,
        userType,
        isLoggedIn: true,
      });
      await AsyncStorage.setItem('userData', userData);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const saveUserToDatabase = async (uid, email) => {
    const userType = email === 'support@abc.com' ? 'support' : 'client';
    try {
      await set(ref(database, `users/${uid}`), {
        email,
        userType,
        createdAt: serverTimestamp(),
      });
      return userType;
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  };

  const handleAuthentication = async () => {
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userSnapshot = await get(ref(database, `users/${userCredential.user.uid}`));
        const userData = userSnapshot.val();
        if (userData) {
          await storeUserData(userCredential.user.uid, email, userData.userType);
        } else {
          throw new Error('User data not found');
        }
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userType = await saveUserToDatabase(userCredential.user.uid, email);
        await storeUserData(userCredential.user.uid, email, userType);
      }

      navigation.replace(email === 'support@abc.com' ? 'Support' : 'Main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const formAnimation = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: animation,
  };

  const logoStyle = {
    transform: [
      {
        scale: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }),
      },
    ],
    opacity: logoAnimation,
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Image
              source={require('../assets/background.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={[styles.formContainer, formAnimation]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.gradient}>
              <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join Us'}</Text>
              <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? "eye-slash" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuthentication}>
                <LinearGradient
                  colors={['#4481eb', '#04befe']}
                  style={styles.gradient}>
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'Login' : 'Sign Up'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(prev => !prev)}>
                <Text style={styles.switchButtonText}>
                  {isLogin
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Login'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
  },
  formContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 27.5,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    borderRadius: 27.5,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;