import React, { useState } from 'react'
import { Web3Service } from '../utils/web3'

interface CreateMarketProps {
  web3Service: Web3Service
  onError: (error: string) => void
  onSuccess: () => void
}

const CreateMarket: React.FC<CreateMarketProps> = ({ web3Service, onError, onSuccess }) => {
  const [question, setQuestion] = useState('')
  const [duration, setDuration] = useState('7') // days
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      onError('Please enter a question')
      return
    }

    if (!duration || parseFloat(duration) <= 0) {
      onError('Please enter a valid duration')
      return
    }

    setCreating(true)
    try {
      const durationInSeconds = Math.floor(parseFloat(duration) * 24 * 60 * 60)
      await web3Service.createMarket(question.trim(), durationInSeconds)
      
      // Reset form
      setQuestion('')
      setDuration('7')
      
      onSuccess()
    } catch (error: any) {
      console.error('Market creation failed:', error)
      onError(error.message || 'Failed to create market')
    } finally {
      setCreating(false)
    }
  }

  const predefinedQuestions = [
    "Will Bitcoin reach $150,000 by the end of 2026?",
    "Will Ethereum switch to proof-of-stake successfully?",
    "Will the next US presidential election have record voter turnout?",
    "Will there be a major breakthrough in quantum computing by 2026?",
    "Will any country ban cryptocurrency completely in 2026?",
  ]

  return (
    <div className="create-market">
      <div className="create-market-card">
        <h2>➕ Create New Market</h2>
        <p>Create a new prediction market with encrypted betting</p>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="question">Market Question</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter a clear, binary question (Yes/No answer)"
              maxLength={200}
              rows={3}
              required
            />
            <div className="char-count">{question.length}/200</div>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (days)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0.1"
              max="365"
              step="0.1"
              required
            />
            <div className="help-text">
              How long should this market be open for betting?
            </div>
          </div>

          <button
            type="submit"
            className="create-button"
            disabled={creating || !question.trim() || !duration}
          >
            {creating ? (
              <>
                <span className="spinner"></span>
                Creating Market...
              </>
            ) : (
              'Create Market'
            )}
          </button>
        </form>

        <div className="predefined-questions">
          <h3>💡 Suggested Questions</h3>
          <p>Click any question below to use it:</p>
          <div className="questions-list">
            {predefinedQuestions.map((q, index) => (
              <button
                key={index}
                className="question-suggestion"
                onClick={() => setQuestion(q)}
                type="button"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="market-tips">
          <h3>📝 Tips for Good Markets</h3>
          <ul>
            <li>✅ Ask clear, binary questions (Yes/No)</li>
            <li>✅ Set specific timeframes and criteria</li>
            <li>✅ Ensure the outcome will be verifiable</li>
            <li>✅ Avoid subjective or ambiguous questions</li>
            <li>⚠️ Remember: You'll need to resolve the market manually</li>
          </ul>
        </div>

        <div className="privacy-features">
          <h3>🔒 Privacy Features</h3>
          <div className="feature-list">
            <div className="feature">
              <span className="icon">🔐</span>
              <div>
                <strong>Encrypted Bets</strong>
                <p>All bets are encrypted using FHEVM technology</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">👁️‍🗨️</span>
              <div>
                <strong>Private Predictions</strong>
                <p>No one can see individual predictions until resolution</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">⚡</span>
              <div>
                <strong>Instant Settlement</strong>
                <p>Automated payouts after market resolution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateMarket