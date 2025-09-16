import React, { useState } from 'react'
import { Web3Service } from './utils/web3'
import { WalletState, Market, AppState } from './types'
import WalletConnect from './components/WalletConnect'
import MarketList from './components/MarketList'
import CreateMarket from './components/CreateMarket'
import './App.css'

function App() {
  const [appState, setAppState] = useState<AppState>({
    wallet: {
      address: null,
      isConnected: false,
      chainId: null,
    },
    markets: [],
    userBets: [],
    loading: false,
    error: null,
  })

  const [web3Service] = useState(() => new Web3Service())
  const [activeTab, setActiveTab] = useState<'markets' | 'create' | 'my-bets'>('markets')

  const handleWalletConnect = async (walletState: WalletState) => {
    setAppState(prev => ({
      ...prev,
      wallet: walletState,
      error: null,
    }))

    // Load initial data after wallet connection
    await loadMarkets()
  }

  const loadMarkets = async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true }))
      
      const totalMarkets = await web3Service.getTotalMarkets()
      const markets: Market[] = []

      // Only load markets if they exist on the blockchain
      for (let i = 0; i < totalMarkets; i++) {
        const marketData = await web3Service.getMarket(i)
        markets.push({
          id: i,
          question: marketData[0],
          endTime: Number(marketData[1]),
          totalYesBets: marketData[2].toString(),
          totalNoBets: marketData[3].toString(),
          resolved: marketData[4],
          outcome: marketData[5],
          creator: marketData[6],
        })
      }

      setAppState(prev => ({
        ...prev,
        markets,
        loading: false,
      }))
    } catch (error) {
      console.error('Failed to load markets:', error)
      setAppState(prev => ({
        ...prev,
        error: 'Failed to load markets',
        loading: false,
      }))
    }
  }

  const handleError = (error: string) => {
    setAppState(prev => ({ ...prev, error }))
  }

  const clearError = () => {
    setAppState(prev => ({ ...prev, error: null }))
  }

  if (!appState.wallet.isConnected) {
    return (
      <div className="app">
        <div className="app-container">
          <header className="app-header">
            <h1>🔮 Confidential Prediction Market</h1>
            <p>Make encrypted predictions and bet with privacy using FHEVM</p>
          </header>
          
          <WalletConnect 
            onConnect={handleWalletConnect}
            onError={handleError}
            web3Service={web3Service}
          />
          
          {appState.error && (
            <div className="error-message">
              <p>❌ {appState.error}</p>
              <button onClick={clearError}>Dismiss</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>🔮 Confidential Prediction Market</h1>
          <div className="wallet-info">
            <span>Connected: {appState.wallet.address?.slice(0, 6)}...{appState.wallet.address?.slice(-4)}</span>
          </div>
        </header>

        <nav className="app-nav">
          <button 
            className={activeTab === 'markets' ? 'active' : ''}
            onClick={() => setActiveTab('markets')}
          >
            📊 Markets
          </button>
          <button 
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Market
          </button>
          <button 
            className={activeTab === 'my-bets' ? 'active' : ''}
            onClick={() => setActiveTab('my-bets')}
          >
            💰 My Bets
          </button>
        </nav>

        <main className="app-main">
          {appState.error && (
            <div className="error-message">
              <p>❌ {appState.error}</p>
              <button onClick={clearError}>Dismiss</button>
            </div>
          )}

          {activeTab === 'markets' && (
            <MarketList 
              markets={appState.markets}
              loading={appState.loading}
              userAddress={appState.wallet.address}
              web3Service={web3Service}
              onError={handleError}
              onRefresh={loadMarkets}
            />
          )}

          {activeTab === 'create' && (
            <CreateMarket 
              web3Service={web3Service}
              onError={handleError}
              onSuccess={() => {
                setActiveTab('markets')
                loadMarkets()
              }}
            />
          )}

          {activeTab === 'my-bets' && (
            <div className="my-bets">
              <h2>My Bets</h2>
              <p>Your betting history and winnings will appear here.</p>
              <div className="coming-soon">
                🚧 Coming Soon - View your encrypted bets and claim winnings
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
