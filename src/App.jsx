import { useState, useCallback } from 'react'
import { AppProvider } from './context/AppContext'
import Header from './components/common/Header'
import TabNav from './components/common/TabNav'
import SynergyTab from './components/synergy/SynergyTab'
import GeneratorTab from './components/generator/GeneratorTab'
import AdvertisersTab from './components/advertisers/AdvertisersTab'

function App() {
  const [currentTab, setCurrentTab] = useState('synergy')
  const [transferData, setTransferData] = useState(null)

  const handleTransferToAdvertisers = useCallback((tagsOrScript, genrePercents = null) => {
    // Handle transfer from generator (script object) or synergy (tag array)
    let tags, percents;
    
    if (tagsOrScript.tags) {
      // It's a script object from generator
      tags = tagsOrScript.tags;
      percents = {};
      tags.filter(t => t.category === 'Genre').forEach(t => {
        percents[t.id] = Math.round((t.percent || 1) * 100);
      });
    } else {
      // It's a tag array from synergy
      tags = tagsOrScript;
      percents = genrePercents || {};
    }
    
    setTransferData({ tags, genrePercents: percents });
    setCurrentTab('advertisers');
  }, []);

  // Clear transfer data when user manually switches tabs
  const handleTabChange = useCallback((tab) => {
    if (tab !== 'advertisers') {
      setTransferData(null);
    }
    setCurrentTab(tab);
  }, []);

  return (
    <AppProvider>
      <div className="main-wrapper">
        <Header />
        <TabNav currentTab={currentTab} onTabChange={handleTabChange} />
        
        <div className="container">
          {currentTab === 'generator' && (
            <GeneratorTab onTransferToAdvertisers={handleTransferToAdvertisers} />
          )}
          {currentTab === 'synergy' && (
            <SynergyTab onTransferToAdvertisers={handleTransferToAdvertisers} />
          )}
          {currentTab === 'advertisers' && (
            <AdvertisersTab 
              initialTags={transferData?.tags} 
              initialGenrePercents={transferData?.genrePercents}
            />
          )}
        </div>
        
        <footer>
          <p>Unofficial Tool for Hollywood Animal</p>
        </footer>
      </div>
    </AppProvider>
  )
}

export default App
