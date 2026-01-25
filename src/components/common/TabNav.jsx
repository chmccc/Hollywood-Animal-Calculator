import Button from './Button';

function TabNav({ currentTab, onTabChange, pinnedCount = 0 }) {
  const tabs = [
    { id: 'generator', label: 'Script Generator' },
    { id: 'synergy', label: 'SE Compatibility' },
    { id: 'advertisers', label: 'Advertising' },
    { id: 'pinned', label: pinnedCount > 0 ? `Pinned Scripts (${pinnedCount})` : 'Pinned Scripts' }
  ];

  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <Button
          key={tab.id}
          size="md"
          active={currentTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          title={tab.label}
        />
      ))}
    </nav>
  );
}

export default TabNav;
