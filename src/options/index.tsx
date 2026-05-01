import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import SettingsPage from './SettingsPage';
import './options.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <SettingsPage />
    </SettingsProvider>
  </React.StrictMode>
);