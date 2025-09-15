import React, { useState } from 'react'
import { Web3Service } from '../utils/web3'
import { WalletState } from '../types'

interface WalletConnectProps {
  onConnect: (walletState: WalletState) => void
  onError: (error: string) => void
  web3Service: Web3Service
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onError, web3Service }) => {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    
    try {
      const walletState = await web3Service.connectWallet()
      onConnect(walletState)
    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      onError(error.message || 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="wallet-connect">
      <div className="wallet-connect-card">
        <h2>Connect Your Wallet</h2>
        <p>Connect with MetaMask to start making confidential predictions</p>
        
        <div className="wallet-features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <div>
              <h3>Private Predictions</h3>
              <p>Your bets are encrypted using FHEVM technology</p>
            </div>
          </div>
          
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <div>
              <h3>Instant Betting</h3>
              <p>Place bets instantly on any market</p>
            </div>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <div>
              <h3>Fair Payouts</h3>
              <p>Transparent and automated reward distribution</p>
            </div>
          </div>
        </div>

        <button 
          className="connect-button"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              🦊 Connect MetaMask
            </>
          )}
        </button>

        <div className="connection-requirements">
          <h3>Requirements:</h3>
          <ul>
            <li>✅ MetaMask browser extension installed</li>
            <li>✅ Connected to Sepolia testnet</li>
            <li>✅ Test ETH for transaction fees</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default WalletConnect