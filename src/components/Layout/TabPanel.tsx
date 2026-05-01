import React from 'react';
import './TabPanel.css';

interface TabPanelProps {
  isActive: boolean;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ isActive, children }) => {
  return (
    <div className={`tab-panel ${isActive ? 'active' : ''}`}>
      {children}
    </div>
  );
};

export default TabPanel;