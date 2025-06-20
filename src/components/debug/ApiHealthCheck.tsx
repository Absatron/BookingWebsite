import React, { useEffect, useState } from 'react';
import { config } from '../../lib/config';

const ApiHealthCheck = () => {
  const [status, setStatus] = useState('checking...');
  const [details, setDetails] = useState({});

  useEffect(() => {
    const checkApi = async () => {
      try {
        console.log('🔍 Checking API health at:', `${config.apiUrl}/health`);
        
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus('✅ API is healthy');
          setDetails(data);
        } else {
          setStatus(`❌ API returned ${response.status}`);
          setDetails({ error: response.statusText });
        }
      } catch (error) {
        console.error('API Health Check Error:', error);
        setStatus('❌ API connection failed');
        setDetails({ 
          error: error.message,
          apiUrl: config.apiUrl,
          environment: import.meta.env.MODE,
          viteApiUrl: import.meta.env.VITE_API_URL,
        });
      }
    };

    checkApi();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>API Health:</strong> {status}</div>
      <div><strong>API URL:</strong> {config.apiUrl}</div>
      <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
      <div><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'not set'}</div>
      {Object.keys(details).length > 0 && (
        <details>
          <summary>Details</summary>
          <pre>{JSON.stringify(details, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default ApiHealthCheck;
