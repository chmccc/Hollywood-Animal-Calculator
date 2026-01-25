import Button from './Button';

function TabNav({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'generator', label: 'Script Generator' },
    { id: 'synergy', label: 'SE Compatibility' },
    { id: 'advertisers', label: 'Best Advertisers' }
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
