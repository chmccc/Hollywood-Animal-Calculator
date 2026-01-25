import { useState, useCallback } from 'react'
import { AppProvider } from './context/AppContext'
import { ScriptGeneratorProvider, useScriptGeneratorContext } from './context/ScriptGeneratorContext'
import Header from './components/common/Header'
import TabNav from './components/common/TabNav'
import SynergyTab from './components/synergy/SynergyTab'
import GeneratorTab from './components/generator/GeneratorTab'
import AdvertisersTab from './components/advertisers/AdvertisersTab'
import PinnedScriptsTab from './components/pinned/PinnedScriptsTab'

function AppContent() {
  const [currentTab, setCurrentTab] = useState('synergy')
  const [transferData, setTransferData] = useState(null)
  const { pinnedScripts } = useScriptGeneratorContext()

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
    <div className="main-wrapper">
      <Header />
      <TabNav 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
        pinnedCount={pinnedScripts.length}
      />
      
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
        {currentTab === 'pinned' && (
          <PinnedScriptsTab onTransferToAdvertisers={handleTransferToAdvertisers} />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <ScriptGeneratorProvider>
        <AppContent />
      </ScriptGeneratorProvider>
    </AppProvider>
  )
}

export default App
