import React, { useState } from 'react'
import { Market } from '../types'
import { Web3Service } from '../utils/web3'
import { ethers } from 'ethers'

interface MarketCardProps {
  market: Market
  userAddress: string | null
  web3Service: Web3Service
  onError: (error: string) => void
}

const MarketCard: React.FC<MarketCardProps> = ({ market, userAddress, web3Service, onError }) => {
  const [betting, setBetting] = useState(false)
  const [betAmount, setBetAmount] = useState('0.01')
  const [prediction, setPrediction] = useState<boolean | null>(null)
  const [resolving, setResolving] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const isCreator = userAddress?.toLowerCase() === market.creator.toLowerCase()
  const isActive = !market.resolved && Date.now() < market.endTime * 1000
  const hasEnded = Date.now() >= market.endTime * 1000
  const totalBets = BigInt(market.totalYesBets) + BigInt(market.totalNoBets)
  
  const yesPercentage = totalBets > 0n 
    ? Number((BigInt(market.totalYesBets) * 100n) / totalBets)
    : 50

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const formatETH = (wei: string) => {
    return parseFloat(ethers.formatEther(wei)).toFixed(4)
  }

  const handleBet = async () => {
    if (prediction === null || !betAmount) return

    // Validate bet amount locally first
    const amount = parseFloat(betAmount);
    if (amount < 0.001 || amount > 10) {
      onError('Bet amount must be between 0.001 and 10 ETH');
      return;
    }

    setBetting(true)
    onError('') // Clear any previous errors
    try {
      const txHash = await web3Service.placeBet(market.id, prediction, betAmount)
      console.log('Bet placed successfully:', txHash)
      // Show success message
      onError(`✅ Bet placed successfully! Transaction: ${txHash.slice(0, 10)}...`)
      // Reset form
      setPrediction(null)
      setBetAmount('0.01')
    } catch (error: any) {
      console.error('Betting failed:', error)
      let errorMessage = error.message || 'Failed to place bet'
      
      // Handle specific error cases
      if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user'
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance'
      } else if (errorMessage.includes('Market does not exist')) {
        errorMessage = 'Market ID 0 does not exist. Please create a market first.'
      }
      
      onError(errorMessage)
    } finally {
      setBetting(false)
    }
  }

  const handleResolve = async (outcome: boolean) => {
    setResolving(true)
    try {
      await web3Service.resolveMarket(market.id, outcome)
      onError('') // Clear any previous errors
      // Note: In a real app, you'd refresh the market data here
    } catch (error: any) {
      console.error('Resolution failed:', error)
      onError(error.message || 'Failed to resolve market')
    } finally {
      setResolving(false)
    }
  }

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await web3Service.claimWinnings(market.id)
      onError('') // Clear any previous errors
      // Note: In a real app, you'd refresh the market data here
    } catch (error: any) {
      console.error('Claiming failed:', error)
      onError(error.message || 'Failed to claim winnings')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className={`market-card ${market.resolved ? 'resolved' : isActive ? 'active' : 'ended'}`}>
      <div className="market-header">
        <h3>{market.question}</h3>
        <div className="market-status">
          {market.resolved ? (
            <span className={`status-badge ${market.outcome ? 'yes' : 'no'}`}>
              {market.outcome ? '✅ YES' : '❌ NO'}
            </span>
          ) : isActive ? (
            <span className="status-badge active">🟢 Active</span>
          ) : (
            <span className="status-badge ended">⏰ Ended</span>
          )}
        </div>
      </div>

      <div className="market-info">
        <div className="time-info">
          <span>Ends: {formatTime(market.endTime)}</span>
        </div>
        
        <div className="betting-pool">
          <div className="pool-stats">
            <div className="stat">
              <span className="label">Total Pool:</span>
              <span className="value">{formatETH(totalBets.toString())} ETH</span>
            </div>
          </div>
          
          <div className="prediction-bar">
            <div className="prediction-option yes" style={{ width: `${yesPercentage}%` }}>
              <span>YES {yesPercentage}%</span>
            </div>
            <div className="prediction-option no" style={{ width: `${100 - yesPercentage}%` }}>
              <span>NO {100 - yesPercentage}%</span>
            </div>
          </div>
          
          <div className="pool-details">
            <span>YES: {formatETH(market.totalYesBets)} ETH</span>
            <span>NO: {formatETH(market.totalNoBets)} ETH</span>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="betting-section">
          <h4>🔒 Place Encrypted Bet</h4>
          <div className="bet-controls">
            <div className="prediction-buttons">
              <button
                className={`prediction-btn yes ${prediction === true ? 'selected' : ''}`}
                onClick={() => setPrediction(true)}
              >
                ✅ YES
              </button>
              <button
                className={`prediction-btn no ${prediction === false ? 'selected' : ''}`}
                onClick={() => setPrediction(false)}
              >
                ❌ NO
              </button>
            </div>
            
            <div className="amount-input">
              <label>Amount (ETH):</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="0.001"
                max="10"
                step="0.001"
              />
            </div>
            
            <button
              className="bet-button"
              onClick={handleBet}
              disabled={betting || prediction === null || !betAmount}
            >
              {betting ? (
                <>
                  <span className="spinner"></span>
                  Placing Bet...
                </>
              ) : (
                'Place Encrypted Bet'
              )}
            </button>
          </div>
          
          <p className="privacy-note">
            🔒 Your prediction is encrypted and will remain private until market resolution.
          </p>
        </div>
      )}

      {isCreator && hasEnded && !market.resolved && (
        <div className="resolve-section">
          <h4>⚖️ Resolve Market</h4>
          <p>As the market creator, you can resolve the outcome:</p>
          <div className="resolve-buttons">
            <button
              className="resolve-btn yes"
              onClick={() => handleResolve(true)}
              disabled={resolving}
            >
              {resolving ? 'Resolving...' : 'Resolve as YES'}
            </button>
            <button
              className="resolve-btn no"
              onClick={() => handleResolve(false)}
              disabled={resolving}
            >
              {resolving ? 'Resolving...' : 'Resolve as NO'}
            </button>
          </div>
        </div>
      )}

      {market.resolved && (
        <div className="claim-section">
          <h4>💰 Claim Winnings</h4>
          <p>Market resolved: {market.outcome ? 'YES' : 'NO'}</p>
          <button
            className="claim-button"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <>
                <span className="spinner"></span>
                Claiming...
              </>
            ) : (
              'Claim Your Winnings'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default MarketCard