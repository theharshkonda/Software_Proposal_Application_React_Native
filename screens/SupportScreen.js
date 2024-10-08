import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  BackHandler, // Import BackHandler
} from 'react-native';
import {
  List,
  TextInput,
  Button,
  Avatar,
  Appbar,
  Text,
} from 'react-native-paper';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { auth, database } from './firebase.config';
import { signOut } from 'firebase/auth';

export default function SupportScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = ref(database, 'chats');

    const unsubscribe = onValue(
      chatsRef,
      snapshot => {
        const data = snapshot.val();
        if (data) {
          const chatList = Object.entries(data).map(([key, value]) => ({
            id: key,
            lastMessage: value.messages
              ? Object.values(value.messages).pop()
              : null,
          }));
          setChats(chatList);
        } else {
          setChats([]);
        }
        setLoading(false);
      },
      error => {
        console.error('Error fetching chats:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const messagesRef = ref(database, `chats/${selectedChat.id}/messages`);
      const unsubscribe = onValue(messagesRef, snapshot => {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
          }));
          setMessages(
            messageList.sort((a, b) => b.timestamp - a.timestamp),
          );
        } else {
          setMessages([]);
        }
      });

      return () => unsubscribe();
    }
  }, [selectedChat]);

  // Back handler logic
  useEffect(() => {
    const handleBackPress = () => {
      if (selectedChat) {
        setSelectedChat(null); // Navigate back to chat list
        return true; // Prevent the default back button behavior
      }
      return false; // Default behavior if no chat is selected
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [selectedChat]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedChat && auth.currentUser) {
      try {
        const messageRef = ref(database, `chats/${selectedChat.id}/messages`);
        await push(messageRef, {
          text: newMessage,
          senderId: auth.currentUser.uid,
          senderEmail: auth.currentUser.email,
          timestamp: serverTimestamp(),
        });
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const renderChatItem = ({ item }) => {
    return (
      <List.Item
        title={item.lastMessage?.senderEmail || 'Unknown User'}
        description={item.lastMessage?.text || 'No messages yet'}
        onPress={() => setSelectedChat(item)}
        titleStyle={styles.blackText}
        descriptionStyle={styles.blackText}
        left={() => (
          <Avatar.Text
            size={48}
            label={
              item.lastMessage?.senderEmail?.charAt(0).toUpperCase() || 'U'
            }
            style={styles.avatar}
          />
        )}
      />
    );
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === auth.currentUser?.uid;
    const messageTime = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUser : styles.otherUser,
        ]}
      >
        {!isCurrentUser && (
          <Avatar.Text
            size={32}
            label={item.senderEmail.charAt(0).toUpperCase()}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.currentUserBubble
              : styles.otherUserBubble,
          ]}
        >
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.senderEmail}</Text>
          )}
          <Text style={styles.messageText}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>{messageTime}</Text>
        </View>
        {isCurrentUser && (
          <Avatar.Icon size={32} icon="account" style={styles.messageAvatar} />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#6200ee" style={styles.loading} />
    );
  }

  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Support Chats" />
          <Appbar.Action icon="logout" onPress={handleSignOut} />
        </Appbar.Header>
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          style={styles.chatList}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => setSelectedChat(null)} />
        <Appbar.Content
          title={selectedChat.lastMessage?.senderEmail || 'Chat'}
        />
      </Appbar.Header>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          style={styles.input}
          mode="outlined"
          textColor='black'
          outlineColor="#E0E0E0"
          activeOutlineColor="#6200ee"
        />
        <Button
          onPress={sendMessage}
          mode="contained"
          style={styles.sendButton}
          icon="send"
          textColor='white'
          contentStyle={{ flexDirection: 'row-reverse' }}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatList: {
    flex: 1,
    backgroundColor: 'white',
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  blackText: {
    color: 'black',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'white',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  currentUser: {
    alignSelf: 'flex-end',
  },
  otherUser: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    backgroundColor: '#6200ee',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  currentUserBubble: {
    backgroundColor: '#E1F5FE',
    borderTopRightRadius: 0,
    marginRight: 8,
  },
  otherUserBubble: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 0,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    color: 'black',
  },
  timestamp: {
    fontSize: 10,
    color: '#757575',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#6200ee',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
    elevation: 8,
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'white',
  },
  sendButton: {
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    borderRadius: 24,
    padding: 8,
  },
});