import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Dynamic API routing interceptor for production deployments
axios.interceptors.request.use((config) => {
  const prodApiUrl = import.meta.env.VITE_API_URL;
  if (prodApiUrl && config.url && config.url.includes('localhost:8001')) {
    const cleanProdUrl = prodApiUrl.endsWith('/') ? prodApiUrl.slice(0, -1) : prodApiUrl;
    config.url = config.url.replace('http://localhost:8001', cleanProdUrl);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
