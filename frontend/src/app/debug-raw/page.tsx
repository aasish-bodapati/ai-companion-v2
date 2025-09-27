'use client';

import { useEffect, useState } from 'react';

export default function DebugRawPage() {
  const [apiResult, setApiResult] = useState('Testing...');
  const [currentUrl, setCurrentUrl] = useState('Loading...');

  useEffect(() => {
    // Show current URL
    setCurrentUrl(window.location.href);
    
    // Test API call
    fetch('http://192.168.1.5:8000/api/v1/health/onboarding/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzU4ODcxMTU3fQ.HTrD2iID2rpMwpYvRgUhEHH1vjBa77NGt5S6lCxSbmg',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      setApiResult('✅ API Call Success: ' + JSON.stringify(data));
    })
    .catch(error => {
      setApiResult('❌ API Call Failed: ' + error.message + ' (Type: ' + error.name + ')');
    });
  }, []);

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '10px', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      fontSize: '14px',
      lineHeight: '1.4'
    }}>
      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize: '14px'
      }}>
        <h1 style={{ fontSize: '18px', marginBottom: '15px' }}>Raw Debug Information</h1>
        
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Environment Check:</h2>
          <p style={{ fontSize: '12px', marginBottom: '5px' }}>API URL: <code style={{ fontSize: '11px', backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>http://192.168.1.5:8000</code></p>
          <p style={{ fontSize: '12px', marginBottom: '5px' }}>Current URL: <code style={{ fontSize: '11px', backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>{currentUrl}</code></p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>API Test:</h2>
          <p style={{ fontSize: '12px', color: apiResult.includes('✅') ? 'green' : 'red', wordBreak: 'break-all' }}>{apiResult}</p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Expected:</h2>
          <p style={{ fontSize: '12px', color: 'green', marginBottom: '5px' }}>API URL should be: http://192.168.1.5:8000</p>
          <p style={{ fontSize: '12px', color: 'green', marginBottom: '5px' }}>API should return: {`{"completed": true}`}</p>
        </div>
      </div>
    </div>
  );
}
