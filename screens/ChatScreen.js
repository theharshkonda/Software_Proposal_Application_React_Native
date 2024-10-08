import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  getDatabase,
  ref,
  onValue,
  push,
  serverTimestamp,
  set,
  child,
} from 'firebase/database';
import {getAuth} from 'firebase/auth';

const ChatScreen = ({route}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const {supportId} = route.params || {};
  const database = getDatabase();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          setUserId(user.uid);
          setUserEmail(user.email);
        } else {
          console.error('User not authenticated');
        }
      } catch (error) {
        console.error('Error retrieving user info:', error);
      }
    };

    getUserInfo();

    const chatId = supportId ? `support_${supportId}` : `user_${userId}`;
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const parsedMessages = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setMessages(parsedMessages.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return () => unsubscribe();
  }, [userId, supportId]);

  const sendMessage = async () => {
    if (message.trim() === '') {
      Alert.alert('Message cannot be empty');
      return;
    }

    try {
      const chatId = supportId ? `support_${supportId}` : `user_${userId}`;
      const messageRef = ref(database, `chats/${chatId}/messages`);
      const participantsRef = ref(database, `chats/${chatId}/participants`);

      await push(messageRef, {
        text: message,
        senderId: userId,
        senderEmail: userEmail,
        timestamp: serverTimestamp(),
      });

      await set(child(participantsRef, userId), true);
      if (supportId) {
        await set(child(participantsRef, supportId), true);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Failed to send message:', error.message);
    }
  };

  const renderMessage = ({item}) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === userId ? styles.sentMessage : styles.receivedMessage,
      ]}>
      <Text style={styles.messageSender}>
        {item.senderId === userId ? 'You' : item.senderEmail}:
      </Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  // return (
  //   <View style={styles.container}>
  //     <FlatList
  //       data={messages}
  //       keyExtractor={item => item.id}
  //       renderItem={renderMessage}
  //       contentContainerStyle={styles.messageList}
  //       inverted // To display the latest messages at the bottom
  //     />
  return (
    <View style={styles.container}>
      <FlatList
  data={[...messages]} // Reverse the messages array
  keyExtractor={item => item.id}
  renderItem={renderMessage}
  contentContainerStyle={styles.messageList}
  inverted={false} // Change this to false
/>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: '80%',
    elevation: 1,
  },
  sentMessage: {
    backgroundColor: '#d1f0d1',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: 10,
    paddingLeft: 8,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen;
