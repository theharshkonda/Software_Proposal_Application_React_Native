import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  Button,
  Text,
  ActivityIndicator,
  Divider,
  TextInput,
  Surface,
} from 'react-native-paper';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from '@firebase/firestore';
import { getAuth } from '@firebase/auth';
import { generateProposal } from '../src/services/geminiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';

const ProposalScreen = ({ route, navigation }) => {
  const business = route.params?.business;
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState('');
  const [clientDetails, setClientDetails] = useState({
    clientName: '',
    companyName: '',
    address: '',
    phoneNumber: '',
    email: '',
  });
  const auth = getAuth();
  const db = getFirestore();

  const handleNavigate = () => {
    navigation.navigate('Chat');
  };

  useEffect(() => {
    const fetchProposals = async () => {
      if (auth.currentUser) {
        const q = query(
          collection(db, 'proposals'),
          where('userId', '==', auth.currentUser.uid),
          where('status', '==', 'accepted'),
        );
        const querySnapshot = await getDocs(q);
        const fetchedProposals = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProposals(fetchedProposals);
        setLoading(false);
      }
    };

    const generateDynamicProposal = async () => {
      try {
        const result = await generateProposal(business);
        console.log(result);
        setProposal(result);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchProposals();
    generateDynamicProposal();
  }, [business, auth.currentUser]);

  const renderFormattedContent = content => {
    if (!content) return null;
    return (
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    );
  };

  const renderClientDetailsForm = () => (
    <Surface style={styles.clientDetailsForm}>
      <Text style={styles.formHeader}>Client Details</Text>
      {['clientName', 'companyName', 'address', 'phoneNumber', 'email'].map(
        field => (
          <TextInput
            key={field}
            mode="outlined"
            label={field.split(/(?=[A-Z])/).join(' ')}
            value={clientDetails[field]}
            onChangeText={text =>
              setClientDetails({ ...clientDetails, [field]: text })
            }
            style={styles.input}
            keyboardType={
              field === 'phoneNumber'
                ? 'phone-pad'
                : field === 'email'
                ? 'email-address'
                : 'default'
            }
          />
        ),
      )}
    </Surface>
  );

  const renderProposal = ({ item }) => (
    <Surface style={styles.proposalItem}>
      <View style={styles.proposalHeader}>
        <Icon name="file-document" size={24} color="#2196F3" />
        <Text style={styles.proposalTitle}>{item.title}</Text>
      </View>
      <Divider style={styles.miniDivider} />
      <View style={styles.proposalDetails}>
        <Text style={styles.statusText}>
          Status: <Text style={styles.statusValue}>{item.status}</Text>
        </Text>
        <Text style={styles.quotationText}>
          Quotation: <Text style={styles.quotationValue}>${item.quotation}</Text>
        </Text>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Surface style={styles.headerSection}>
          <Text style={styles.title}>Accepted Proposals</Text>
          <Icon name="check-circle" size={24} color="#4CAF50" />
        </Surface>

        <FlatList
          data={proposals}
          renderItem={renderProposal}
          keyExtractor={item => item.id}
          style={styles.proposalList}
          scrollEnabled={false}
        />

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.companyHeader}>
              <Icon name="office-building" size={24} color="#2196F3" />
              <Text style={styles.companyName}>
                Generated Proposal for {business?.name}
              </Text>
            </View>
            {renderFormattedContent(proposal)}
            {renderClientDetailsForm()}
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="contained"
              onPress={() =>
                navigation.navigate('Quotation', { business, clientDetails })
              }
              style={styles.actionButton}
              icon="calculator"
            >
              Generate Quotation
            </Button>
            <Button
              mode="outlined"
              onPress={handleNavigate}
              style={styles.actionButton}
              icon="chat"
            >
              Contact Sales
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const markdownStyles = {
  heading1: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    color: '#2196F3',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  bullet_list: {
    marginLeft: 16,
  },
  bullet_list_icon: {
    color: '#2196F3',
  },
  bullet_list_content: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#1e90ff',
  },
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 120, // Add padding to prevent bottom tab overlap
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor:'white',
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  proposalList: {
    marginBottom: 16,
  },
  proposalItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  proposalDetails: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  quotationText: {
    fontSize: 16,
  },
  quotationValue: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  miniDivider: {
    marginVertical: 8,
    backgroundColor: '#e0e0e0',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  proposalContent: {
    marginTop: 12,
  },
  section: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 14,
    marginLeft: 16,
    color: '#34495e',
    lineHeight: 24,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  clientDetailsForm: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  formHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  actions: {
    justifyContent: 'space-around',
    padding: 16,
    flexDirection: 'column',
  },
  actionButton: {
    marginVertical: 8,
    width: '100%',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  // New additional styles for enhanced visual hierarchy
  proposalStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // Form field styling enhancements
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ff1744',
    marginTop: 4,
  },
  // Button enhancements
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  // Card enhancements
  cardHeader: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // Status indicators
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusAccepted: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  statusRejected: {
    backgroundColor: '#FF5252',
  },
});

export default ProposalScreen;