import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import RotateDeviceOverlay from './components/RotateDeviceOverlay';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <RotateDeviceOverlay />
  </React.StrictMode>
);
