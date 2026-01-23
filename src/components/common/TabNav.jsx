function TabNav({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'generator', label: 'Script Generator' },
    { id: 'synergy', label: 'SE Compatibility' },
    { id: 'advertisers', label: 'Best Advertisers' }
  ];

  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TabNav;
