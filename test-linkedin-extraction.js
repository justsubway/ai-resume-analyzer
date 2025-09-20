// Simple test script to verify LinkedIn extraction works
// Run with: node test-linkedin-extraction.js

const testUrl = 'https://www.linkedin.com/jobs/view/1234567890'; // Replace with a real LinkedIn job URL

async function testLinkedInExtraction() {
  try {
    console.log('Testing LinkedIn extraction...');
    console.log('URL:', testUrl);
    
    const response = await fetch('http://localhost:5173/api/linkedin-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ LinkedIn extraction successful!');
      console.log('Company:', data.companyName);
      console.log('Title:', data.jobTitle);
      console.log('Description length:', data.jobDescription?.length || 0);
    } else {
      console.log('❌ LinkedIn extraction failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLinkedInExtraction();
