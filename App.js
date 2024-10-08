import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ActivityIndicator, Provider as PaperProvider} from 'react-native-paper';
import {onAuthStateChanged} from 'firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {View, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {auth} from './screens/firebase.config';

import BusinessInfoScreen from './screens/BusinessInfoScreen';
import ProposalScreen from './screens/ProposalScreen';
import QuotationScreen from './screens/QuotationScreen';
import SupportScreen from './screens/SupportScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Business') {
            iconName = focused ? 'business' : 'business-center';
          } else if (route.name === 'Proposal') {
            iconName = focused ? 'assignment' : 'assignment';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: 'lightgray',
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen
        name="Business"
        component={BusinessInfoScreen}
        options={{ tabBarLabel: 'Business' }}
      />
      <Tab.Screen
        name="Proposal"
        component={ProposalScreen}
        options={{ tabBarLabel: 'Proposal' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isSupport, setIsSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '215528592295-leuk6eac4copg6tf08lrs5v5q5uc0p2m.apps.googleusercontent.com',
      offlineAccess: true,
    });

    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setIsSupport(user?.email === 'support@abc.com');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <ActivityIndicator
        color="black"
        size={24}
        style={{flex: 1, justifyContent: 'center'}}
      />
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            isSupport ? (
              <Stack.Screen
                name="Support"
                component={SupportScreen}
                options={{headerShown: false}}
              />
            ) : (
              <>
                <Stack.Screen
                  name="Main"
                  component={MainTabs}
                  options={{headerShown: false}}
                />
                <Stack.Screen name="Quotation" component={QuotationScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
              </>
            )
          ) : (
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{title: 'Login / Sign Up'}}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});