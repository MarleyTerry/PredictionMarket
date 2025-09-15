import React from 'react'
import { Market } from '../types'
import { Web3Service } from '../utils/web3'
import MarketCard from './MarketCard'

interface MarketListProps {
  markets: Market[]
  loading: boolean
  userAddress: string | null
  web3Service: Web3Service
  onError: (error: string) => void
  onRefresh: () => void
}

const MarketList: React.FC<MarketListProps> = ({
  markets,
  loading,
  userAddress,
  web3Service,
  onError,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="market-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading markets...</p>
        </div>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="market-list">
        <div className="empty-state">
          <h2>📊 No Markets Yet</h2>
          <p>Be the first to create a prediction market!</p>
          <button onClick={onRefresh} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="market-list">
      <div className="market-list-header">
        <h2>📊 Prediction Markets</h2>
        <button onClick={onRefresh} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
      
      <div className="markets-grid">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            userAddress={userAddress}
            web3Service={web3Service}
            onError={onError}
          />
        ))}
      </div>
    </div>
  )
}

export default MarketList