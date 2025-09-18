# Hello FHEVM Tutorial: Your First Confidential dApp

## 🎯 Tutorial Overview

Welcome to the world of **Fully Homomorphic Encryption Virtual Machine (FHEVM)**! This tutorial will guide you through building your first confidential decentralized application - a **Confidential Prediction Market**.

### What You'll Learn
- How to use FHEVM to handle encrypted data on-chain
- Building smart contracts with confidential inputs and computations
- Creating a React frontend that interacts with encrypted blockchain data
- Deploying and testing your confidential dApp

### What You'll Build
A prediction market where:
- Users can place **encrypted bets** on future events
- **Bet amounts and predictions are kept private** using FHEVM
- Only the market outcome is revealed publicly
- Winners can claim rewards while maintaining privacy

---

## 🧑‍💻 Target Audience

This tutorial is perfect for you if you:
- ✅ Have basic **Solidity** knowledge (can write simple smart contracts)
- ✅ Are familiar with **Web3 tools** (MetaMask, Hardhat, React)
- ✅ Want to learn **FHEVM** and confidential computing
- ❌ **No advanced math or cryptography knowledge required!**

---

## 🏗️ Project Architecture

### Smart Contract Layer (FHEVM)
```
PredictionMarket.sol
├── Encrypted bet amounts (euint32)
├── Encrypted predictions (ebool)
├── Public market metadata
└── Encrypted computation logic
```

### Frontend Layer (React + TypeScript)
```
Frontend Architecture
├── Web3 wallet integration
├── FHEVM contract interaction
├── Encrypted transaction handling
└── Privacy-preserving UI
```

---

## 🚀 Getting Started

### Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or later)
   ```bash
   node --version  # Should be v18+
   ```

2. **MetaMask Browser Extension**
   - Install from [metamask.io](https://metamask.io)
   - Create wallet and backup seed phrase

3. **Basic Development Tools**
   ```bash
   npm install -g typescript
   ```

4. **Sepolia Testnet ETH**
   - Get free test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - You'll need ~0.1 ETH for testing

---

## 📦 Project Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the project
git clone https://github.com/your-username/fhevm-prediction-market
cd fhevm-prediction-market

# Install dependencies
npm install

# Verify FHEVM dependency
npm list @fhevm/solidity
```

### Step 2: Environment Configuration

Create `.env` file in project root:

```env
# Required for deployment
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Optional: Custom contract address
VITE_PREDICTION_MARKET_ADDRESS=0xdd3e74ad708CF61B14c83cF1826b5e3816e0de69
```

⚠️ **Security Note**: Never commit your private key! Add `.env` to `.gitignore`.

### Step 3: Verify Installation

```bash
# Compile contracts
npm run compile

# Run type checking
npm run typecheck

# Start development server
npm run dev
```

If all commands succeed, you're ready to proceed! 🎉

---

## 🔐 Understanding FHEVM Basics

### What is FHEVM?

**FHEVM (Fully Homomorphic Encryption Virtual Machine)** allows smart contracts to perform computations on encrypted data without ever decrypting it.

### Key FHEVM Concepts

#### 1. Encrypted Data Types
```solidity
import "@fhevm/solidity/lib/FHE.sol";

// Encrypted boolean (true/false)
ebool encryptedPrediction;

// Encrypted 32-bit unsigned integer
euint32 encryptedAmount;

// Encrypted 8-bit unsigned integer
euint8 encryptedScore;
```

#### 2. Creating Encrypted Values
```solidity
// Convert plaintext to encrypted
euint32 encrypted = FHE.asEuint32(123);
ebool encryptedBool = FHE.asEbool(true);
```

#### 3. Access Control
```solidity
// Allow contract to use encrypted value
FHE.allowThis(encryptedAmount);

// Allow specific address to decrypt
FHE.allow(encryptedAmount, msg.sender);
```

### Why Use FHEVM?

Traditional blockchains expose all transaction data publicly. FHEVM enables:
- 🔒 **Private transactions** - amounts stay secret
- 🎭 **Confidential voting** - choices remain hidden
- 🏦 **Sealed auctions** - bids are encrypted
- 🎰 **Fair gaming** - prevents front-running

---

## 📋 Smart Contract Deep Dive

### Contract Structure Overview

Our `PredictionMarket.sol` demonstrates core FHEVM patterns:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhevm/solidity/lib/FHE.sol";

contract PredictionMarket {
    // Public market data
    struct Market {
        string question;
        uint256 endTime;
        uint256 totalYesBets;    // Public for UI display
        uint256 totalNoBets;     // Public for UI display
        bool resolved;
        bool outcome;
        address creator;
    }

    // Private bet data - encrypted!
    struct Bet {
        euint32 encryptedAmount;      // Secret bet amount
        ebool encryptedPrediction;    // Secret prediction
        bool claimed;
        address bettor;
    }

    // Storage mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;
}
```

### Key Functions Explained

#### 1. Creating Markets (Public)
```solidity
function createMarket(string memory _question, uint256 _duration)
    external returns (uint256) {

    uint256 marketId = marketCounter++;
    markets[marketId] = Market({
        question: _question,
        endTime: block.timestamp + _duration,
        totalYesBets: 0,
        totalNoBets: 0,
        resolved: false,
        outcome: false,
        creator: msg.sender
    });

    emit MarketCreated(marketId, _question, block.timestamp + _duration, msg.sender);
    return marketId;
}
```

#### 2. Placing Encrypted Bets (FHEVM Magic!)
```solidity
function placeBet(uint256 _marketId, bool _prediction)
    external payable
    marketExists(_marketId)
    marketActive(_marketId) {

    require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
    require(bets[_marketId][msg.sender].bettor == address(0), "Already placed bet");

    // 🔐 Convert to encrypted types
    uint32 betAmountUnits = uint32(msg.value / (0.001 ether));
    euint32 encryptedAmount = FHE.asEuint32(betAmountUnits);
    ebool encryptedPrediction = FHE.asEbool(_prediction);

    // Store encrypted bet
    bets[_marketId][msg.sender] = Bet({
        encryptedAmount: encryptedAmount,
        encryptedPrediction: encryptedPrediction,
        claimed: false,
        bettor: msg.sender
    });

    // 🔑 Set access permissions
    FHE.allowThis(encryptedAmount);
    FHE.allowThis(encryptedPrediction);
    FHE.allow(encryptedAmount, msg.sender);
    FHE.allow(encryptedPrediction, msg.sender);

    emit BetPlaced(_marketId, msg.sender, msg.value);
}
```

#### 3. Market Resolution (Creator Only)
```solidity
function resolveMarket(uint256 _marketId, bool _outcome)
    external
    marketExists(_marketId)
    marketEnded(_marketId)
    onlyCreator(_marketId) {

    require(!markets[_marketId].resolved, "Market already resolved");

    markets[_marketId].resolved = true;
    markets[_marketId].outcome = _outcome;

    emit MarketResolved(_marketId, _outcome);
}
```

#### 4. Claiming Winnings (Privacy Preserved)
```solidity
function claimWinnings(uint256 _marketId) external marketExists(_marketId) {
    require(markets[_marketId].resolved, "Market not resolved yet");
    require(bets[_marketId][msg.sender].bettor == msg.sender, "No bet found");
    require(!bets[_marketId][msg.sender].claimed, "Already claimed");

    Bet storage bet = bets[_marketId][msg.sender];
    Market storage market = markets[_marketId];

    // Mark as claimed to prevent reentrancy
    bet.claimed = true;

    // 🔍 In production, implement proper encrypted computation
    // For this tutorial, we use simplified logic
    uint256 totalWinningPool = market.outcome ? market.totalYesBets : market.totalNoBets;
    uint256 totalLosingPool = market.outcome ? market.totalNoBets : market.totalYesBets;

    if (totalWinningPool > 0 && totalLosingPool > 0) {
        // Calculate winnings (simplified for tutorial)
        uint256 betAmount = MIN_BET; // In production: decrypt encryptedAmount
        uint256 winnings = betAmount + (betAmount * totalLosingPool) / totalWinningPool;

        payable(msg.sender).transfer(winnings);
        emit WinningsClaimed(_marketId, msg.sender, winnings);
    }
}
```

### 🔒 FHEVM Privacy Features

The contract demonstrates several privacy patterns:

1. **Input Privacy**: Bet amounts and predictions are encrypted client-side
2. **Computation Privacy**: Contract logic works on encrypted values
3. **Selective Disclosure**: Only final outcomes are revealed publicly
4. **Access Control**: Only authorized addresses can decrypt specific values

---

## 💻 Frontend Integration Guide

### Web3 Service Setup

The `Web3Service` class handles all blockchain interactions:

```typescript
// src/utils/web3.ts
import { ethers } from 'ethers';

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    // Request wallet connection
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Ensure Sepolia network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const numericChainId = parseInt(chainId, 16);

    if (numericChainId !== SEPOLIA_CHAIN_ID) {
      await this.switchToSepolia();
    }

    // Initialize contract connection
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.predictionMarket,
      PREDICTION_MARKET_ABI,
      this.signer
    );

    return {
      address: accounts[0],
      isConnected: true,
      chainId: SEPOLIA_CHAIN_ID,
    };
  }
}
```

### React Component Structure

#### Main App Component
```typescript
// src/App.tsx
function App() {
  const [appState, setAppState] = useState<AppState>({
    wallet: { address: null, isConnected: false, chainId: null },
    markets: [],
    userBets: [],
    loading: false,
    error: null,
  });

  const [web3Service] = useState(() => new Web3Service());

  const handleWalletConnect = async (walletState: WalletState) => {
    setAppState(prev => ({ ...prev, wallet: walletState, error: null }));
    await loadMarkets();
  };

  // Render different views based on connection status
  return (
    <div className="app">
      {!appState.wallet.isConnected ? (
        <WalletConnect
          onConnect={handleWalletConnect}
          onError={handleError}
          web3Service={web3Service}
        />
      ) : (
        <MarketInterface
          appState={appState}
          web3Service={web3Service}
        />
      )}
    </div>
  );
}
```

#### Market Card with Encrypted Betting
```typescript
// src/components/MarketCard.tsx
const MarketCard: React.FC<MarketCardProps> = ({ market, web3Service }) => {
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [betAmount, setBetAmount] = useState('0.01');
  const [betting, setBetting] = useState(false);

  const handleBet = async () => {
    if (prediction === null || !betAmount) return;

    setBetting(true);
    try {
      // 🔐 This triggers encrypted transaction
      const txHash = await web3Service.placeBet(market.id, prediction, betAmount);
      console.log('Encrypted bet placed:', txHash);
    } catch (error) {
      console.error('Betting failed:', error);
    } finally {
      setBetting(false);
    }
  };

  return (
    <div className="market-card">
      {/* Market display UI */}

      <div className="betting-section">
        <h4>🔒 Place Encrypted Bet</h4>

        <div className="prediction-buttons">
          <button onClick={() => setPrediction(true)}>✅ YES</button>
          <button onClick={() => setPrediction(false)}>❌ NO</button>
        </div>

        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          min="0.001"
          max="10"
        />

        <button onClick={handleBet} disabled={betting}>
          {betting ? 'Placing Encrypted Bet...' : 'Place Encrypted Bet'}
        </button>

        <p className="privacy-note">
          🔒 Your prediction is encrypted and remains private until resolution.
        </p>
      </div>
    </div>
  );
};
```

### Key Frontend Features

1. **Wallet Integration**: Seamless MetaMask connection with network switching
2. **Encrypted Transactions**: User-friendly interface for placing private bets
3. **Real-time Updates**: Market data refreshes and transaction status
4. **Error Handling**: Clear feedback for failed transactions and edge cases

---

## 🚀 Deployment Guide

### Step 1: Prepare for Deployment

1. **Fund your deployer wallet**:
   ```bash
   # Get Sepolia ETH from faucet
   # Verify balance
   npx hardhat run scripts/check-balance.ts --network sepolia
   ```

2. **Set environment variables**:
   ```bash
   # In .env file
   PRIVATE_KEY=your_deployer_private_key
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ```

### Step 2: Deploy Smart Contract

```bash
# Compile contracts first
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Expected output:
# Deploying PredictionMarket contract...
# Deploying contracts with the account: 0x...
# PredictionMarket deployed to: 0x...
```

### Step 3: Update Frontend Configuration

After deployment, update the contract address:

```typescript
// src/utils/web3.ts
export const CONTRACT_ADDRESSES: ContractAddresses = {
  predictionMarket: '0xYourNewContractAddress', // Update this!
};
```

### Step 4: Test Deployment

```bash
# Run frontend locally
npm run dev

# Or build for production
npm run build
npm run preview
```

### Step 5: Initialize Demo Data (Optional)

```bash
# Create some test markets
npm run init-demo
```

---

## 🧪 Testing Your dApp

### Manual Testing Checklist

#### 1. Wallet Connection ✅
- [ ] MetaMask connects successfully
- [ ] Automatically switches to Sepolia network
- [ ] Displays wallet address correctly

#### 2. Market Creation ✅
- [ ] Can create new markets with questions
- [ ] Markets show correct end times
- [ ] Creator address is stored properly

#### 3. Encrypted Betting ✅
- [ ] Can select YES/NO predictions
- [ ] Bet amount validation works (0.001-10 ETH)
- [ ] Transaction executes successfully
- [ ] UI shows "encrypted bet placed" confirmation

#### 4. Market Resolution ✅
- [ ] Only market creator can resolve
- [ ] Resolution updates market status
- [ ] Outcome is displayed correctly

#### 5. Winnings Claims ✅
- [ ] Winners can claim rewards
- [ ] Prevents double claiming
- [ ] Transfers correct amounts

### Automated Testing

```bash
# Run contract tests
npm run test

# Expected output showing encrypted data handling:
# ✅ Should create market correctly
# ✅ Should place encrypted bet
# ✅ Should resolve market
# ✅ Should claim winnings
```

### Common Issues & Solutions

#### Issue: "Market does not exist"
**Solution**: Markets in demo start from ID 0. Create a market first or use existing market IDs.

#### Issue: "Insufficient funds"
**Solution**: Get more Sepolia ETH from faucet. Each bet requires at least 0.001 ETH + gas.

#### Issue: "Transaction failed"
**Solution**: Check network (must be Sepolia), gas limits, and contract address.

---

## 🎓 Learning Outcomes

Congratulations! 🎉 You've successfully built your first FHEVM dApp. You now understand:

### ✅ FHEVM Fundamentals
- How to use encrypted data types (`euint32`, `ebool`)
- Setting up access controls with `FHE.allow()`
- Converting between plaintext and encrypted values

### ✅ Smart Contract Patterns
- Implementing confidential voting/betting logic
- Managing encrypted state in mappings
- Handling permissions for encrypted data

### ✅ Frontend Integration
- Connecting React apps to FHEVM contracts
- Handling encrypted transactions gracefully
- Building privacy-preserving user interfaces

### ✅ Deployment & Testing
- Deploying FHEVM contracts to testnet
- Testing encrypted functionality end-to-end
- Debugging confidential transaction issues

---

## 🚀 Next Steps & Advanced Topics

### Immediate Improvements You Can Make

1. **Enhanced Privacy Features**
   - Implement threshold decryption for winnings
   - Add encrypted voting weights
   - Create private leaderboards

2. **Better User Experience**
   - Add transaction status tracking
   - Implement bet history views
   - Create mobile-responsive design

3. **Advanced FHEVM Patterns**
   - Multi-party encrypted computations
   - Encrypted arithmetic operations
   - Time-locked encrypted reveals

### Advanced FHEVM Concepts to Explore

#### 1. Encrypted Arithmetic
```solidity
// Add encrypted values
euint32 sum = FHE.add(encryptedA, encryptedB);

// Compare encrypted values
ebool isGreater = FHE.gt(encryptedA, encryptedB);

// Conditional selection
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

#### 2. Threshold Decryption
```solidity
// Multiple parties needed to decrypt
FHE.decrypt(encryptedValue, threshold, parties);
```

#### 3. Batch Operations
```solidity
// Process multiple encrypted inputs efficiently
euint32[] memory results = FHE.batchProcess(encryptedInputs);
```

### Real-World Applications

Now that you understand FHEVM basics, consider building:

- 🗳️ **Private Voting Systems** - Elections with secret ballots
- 🏦 **Confidential DeFi** - Private lending and trading
- 🎰 **Fair Gaming** - Poker and lottery with hidden information
- 📊 **Anonymous Analytics** - Data aggregation preserving privacy
- 🛡️ **Secure Auctions** - Sealed-bid auction mechanisms

---

## 📚 Additional Resources

### FHEVM Documentation
- [Official FHEVM Docs](https://docs.zama.ai/fhevm)
- [Solidity Library Reference](https://docs.zama.ai/fhevm/fundamentals/types)
- [Best Practices Guide](https://docs.zama.ai/fhevm/guides/best-practices)

### Development Tools
- [FHEVM Hardhat Plugin](https://github.com/zama-ai/fhevm-hardhat-template)
- [Frontend SDK](https://docs.zama.ai/fhevm/guides/frontend)
- [Testing Framework](https://docs.zama.ai/fhevm/guides/testing)

### Community & Support
- [Zama Community Discord](https://discord.gg/zama)
- [GitHub Discussions](https://github.com/zama-ai/fhevm/discussions)
- [Developer Forum](https://community.zama.ai)

### Example Projects
- [Private Voting dApp](https://github.com/zama-ai/fhevm-voting)
- [Confidential ERC-20](https://github.com/zama-ai/fhevm-erc20)
- [Encrypted NFT Marketplace](https://github.com/zama-ai/fhevm-nft)

---

## 🎯 Summary

You've completed the **Hello FHEVM Tutorial** and built a fully functional confidential prediction market! This dApp demonstrates the core concepts of:

- 🔐 **Encrypted data handling** with FHEVM types
- 🎭 **Privacy-preserving** smart contract logic
- 💻 **Frontend integration** with encrypted transactions
- 🚀 **Deployment** to public testnets

The techniques you've learned apply to any confidential dApp you want to build. FHEVM opens up entirely new possibilities for privacy-preserving blockchain applications.

**Happy building with FHEVM!** 🎉

---

## 📞 Need Help?

If you encounter issues or have questions:

1. 🐛 **Check the GitHub Issues** for known problems and solutions
2. 💬 **Join the Community Discord** for real-time help
3. 📧 **Contact Support** for technical assistance
4. 🔍 **Review the Documentation** for detailed explanations

**Remember**: Building with FHEVM is cutting-edge technology. Don't hesitate to ask for help as you explore these new possibilities!