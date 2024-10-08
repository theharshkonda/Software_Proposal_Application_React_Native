import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { firestore } from '../firebase.config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { generateQuotation } from '../src/services/geminiService';
import { getAuth } from 'firebase/auth';
import { db } from './firebase.config';
import Markdown from 'react-native-markdown-display';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export default function QuotationScreen({ route }) {
  const { business, clientDetails } = route.params;
  const [quotation, setQuotation] = useState(null);
  const [quotationDocId, setQuotationDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const result = await generateQuotation(business, clientDetails);
        setQuotation(result);
        setLoading(false);

        // Save to Firestore
        const quotationsCollectionRef = collection(db, 'quotations');
        const docRef = await addDoc(quotationsCollectionRef, {
          business,
          quotation: result.rawContent,
          clientDetails,
          timestamp: new Date(),
        });
        console.log('Quotation saved to database with ID:', docRef.id);
        setQuotationDocId(docRef.id);
      } catch (error) {
        console.error('Error generating or saving quotation:', error);
        setError('Failed to generate or save quotation');
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [business, clientDetails]);

  const handleAcceptQuotation = async () => {
    if (!quotationDocId) {
      Alert.alert('Error', 'No quotation available to accept.');
      return;
    }

    try {
      const quotationDocRef = doc(db, 'quotations', quotationDocId);
      await updateDoc(quotationDocRef, {
        accepted: true,
        acceptedAt: new Date(),
      });
      Alert.alert('Success', 'You have accepted the quotation!');
    } catch (error) {
      console.error('Error accepting the quotation:', error);
      Alert.alert('Error', 'Failed to accept the quotation.');
    }
  };

  const generatePDF = async () => {
    if (!quotation) {
      Alert.alert('Error', 'No quotation available to generate PDF.');
      return;
    }

    try {
      const formattedContent = md.render(quotation.rawContent);
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quotation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { background-color: #0066cc; color: white; padding: 20px; }
            .company-name { font-size: 24px; margin-bottom: 5px; }
            .quote-info { display: flex; justify-content: space-between; }
            .client-info { background-color: #0066cc; color: white; padding: 20px; margin-top: 20px; }
            .services { margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Cehpoint E-Learning & Cyber Security Solutions</div>
            <div>A Secure Choice for Your Career and Our World</div>
            <div class="quote-info">
              <div>Quote No. CEH-${Math.floor(1000 + Math.random() * 9000)}</div>
              <div>Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="client-info">
            <h2>Client Information</h2>
            <p>Client Name: ${clientDetails.clientName}</p>
            <p>Company Name: ${clientDetails.companyName}</p>
            <p>Address: ${clientDetails.address}</p>
            <p>Phone Number: ${clientDetails.phoneNumber}</p>
            <p>Email: ${clientDetails.email}</p>
          </div>
          <div class="services">
            <h2>Quotation Details</h2>
            ${formattedContent}
          </div>
          <div class="footer">
            <p>This quotation is valid for 30 days from the date of issue.</p>
            <p>Authorized Signature: _______________________</p>
          </div>
        </body>
      </html>
      `;

      const options = {
        html,
        fileName: `Quotation-${clientDetails.companyName}-${Date.now()}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      
      if (Platform.OS === 'android') {
        const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/quotation_${clientDetails.companyName}.pdf`;
        await RNFetchBlob.fs.cp(file.filePath, downloadPath);
        Alert.alert('Success', `PDF saved to: ${downloadPath}`);
      } else {
        Alert.alert('Success', `PDF saved to: ${file.filePath}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to download PDF.');
    }
  };

  // Markdown styles
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

  // Function to render formatted content
  const renderFormattedContent = content => {
    if (!content) return null;
    return <Markdown style={markdownStyles}>{content}</Markdown>;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
        <Button onPress={() => setLoading(true)}>Retry</Button>
      </View>
    );
  }

  if (!quotation) {
    return (
      <View style={styles.centered}>
        <Text>No quotation available. Please try again later.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Your Quotation
          </Text>
          {renderFormattedContent(quotation.rawContent)}
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleAcceptQuotation}>Accept Quotation</Button>
          <Button onPress={generatePDF}>Download PDF</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    color: 'black'
  },
  content: {
    whiteSpace: 'pre-wrap',
  },
});