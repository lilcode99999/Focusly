import React from 'react';
import { Tab } from '@/popup/App';
import AppIcon, { AppIconName } from '@/components/common/AppIcon';
import './TabBar.css';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: Tab; label: string; icon: AppIconName }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'focus', label: 'Focus', icon: 'timer' },
    { id: 'library', label: 'Library', icon: 'book' },
    { id: 'notes', label: 'Notes', icon: 'file' },
    { id: 'insights', label: 'Insights', icon: 'bar-chart' },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <AppIcon className="tab-icon" name={tab.icon} size={17} />
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default TabBar;
