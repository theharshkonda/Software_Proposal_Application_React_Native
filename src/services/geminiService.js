// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '@env';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

// Constants for company details
const COMPANY_NAME = "Cehpoint E-Learning & Cyber Security Solutions";
const COMPANY_TAGLINE = "A Secure Choice for Your Career and Our World";

// Helper function to format current date
const formatCurrentDate = () => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date().toLocaleDateString('en-US', options);
};

// Helper function to format the AI response text
const formatResponse = (text) => {
  return text
    // .replace(/\*\s/g, '• ') // Replace asterisks with bullet points
    // .replace(/\-\s/g, '- ') // Ensure consistent dash formatting
    // .replace(/\n\n/g, '\n') // Remove extra line breaks
    // .replace(/([A-Z][A-Za-z\s]+):/g, '\n$1:\n') // Add line breaks around section headers
    .trim();
};

// Helper function to parse the AI-generated quotation
const parseQuotation = (text) => {
  const lines = text.split('\n');
  const services = [];
  let totalCost = 0;

  lines.forEach(line => {
    const match = line.match(/^(.+):\s*₹([\d,]+)/);
    if (match) {
      const name = match[1].trim();
      const cost = parseInt(match[2].replace(/,/g, ''), 10);
      services.push({ name, cost });
      totalCost += cost;
    }
  });

  return { services, totalCost };
};

// Function to generate a detailed professional quotation
export const generateQuotation = async (businessInfo, clientDetails) => {
  const currentDate = formatCurrentDate(); // Get current date for the quotation

  // Define the prompt for AI to generate the quotation
  const prompt = `
  Generate a detailed professional quotation from ${COMPANY_NAME} for a ${businessInfo} business.
  
  Structure the quotation as follows:
  1. Company letterhead section with:
     - ${COMPANY_NAME}
     - ${COMPANY_TAGLINE}
     - Date: ${currentDate}
     - Quotation Reference Number: CEH-${Math.floor(1000 + Math.random() * 9000)}

  2. Client Information section for:
     - Client Name: ${clientDetails.clientName}
     - Company Name: ${clientDetails.companyName}
     - Address: ${clientDetails.address}
     - Phone Number: ${clientDetails.phoneNumber}
     - Email: ${clientDetails.email}

  3. Service Breakdown with clear pricing tables for:
     - Cybersecurity Solutions
     - E-Learning Implementation
     - Software Development
     - IT Infrastructure
     
  Requirements:
  - All prices should be in INR with proper formatting (e.g., ₹1,50,000)
  - Include GST calculations
  - Separate one-time costs from recurring costs
  - Add payment terms and conditions
  - Include service level agreements
  - Valid for 30 days clause
  
  Make sure all services are properly categorized and priced according to Indian market rates. Present each service on a new line in the format 'Service Name: ₹Price'.`;

  try {
    // Generate content using AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const formattedResponse = formatResponse(response.text());
    
    // Parse the formatted response into the required structure
    const parsedQuotation = parseQuotation(formattedResponse);
    
    return {
      ...parsedQuotation,
      rawContent: formattedResponse // Include the full formatted response for reference
    };
  } catch (error) {
    console.error('Error generating quotation:', error);
    throw error;
  }
};

// Function to generate a professional business proposal
export const generateProposal = async (businessInfo) => {
  const currentDate = formatCurrentDate(); // Get current date for the proposal

  // Define the prompt for AI to generate the proposal
  const prompt = `
  Generate a professional business proposal for ${COMPANY_NAME} (${COMPANY_TAGLINE}).
  The client is in the following business/profession: ${businessInfo}.
  They need tailored services, including cybersecurity, IT services, and software development solutions at Indian rates.

  Please structure the proposal in the following format:
  1. Start with a formal introduction of ${COMPANY_NAME}
  2. Create sections with clear headings for:
     - Executive Summary
     - Identified Business Needs
     - Our Proposed Solutions
     - Benefits of Partnership
     - Why Choose ${COMPANY_NAME}
     - Next Steps

  Important formatting requirements:
  - Use clear section headings
  - Use bullet points instead of asterisks
  - Use proper indentation for sub-points
  - Highlight key benefits and advantages
  - Include specific examples relevant to ${businessInfo}
  - Format all pricing in INR with proper comma separation

  Emphasize our expertise in:
  - Cybersecurity solutions
  - E-Learning platforms
  - Software development
  - IT infrastructure management`;

  try {
    // Generate content using AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return formatResponse(response.text()); // Return formatted proposal
  } catch (error) {
    console.error('Error generating proposal:', error);
    throw error;
  }
};
