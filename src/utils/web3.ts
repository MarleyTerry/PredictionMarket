import { ethers } from 'ethers';
import { ContractAddresses, WalletState } from '../types';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';

export const CONTRACT_ADDRESSES: ContractAddresses = {
  predictionMarket: import.meta.env.VITE_PREDICTION_MARKET_ADDRESS || '0xdd3e74ad708CF61B14c83cF1826b5e3816e0de69',
};

export const PREDICTION_MARKET_ABI = [
  "function createMarket(string memory _question, uint256 _duration) external returns (uint256)",
  "function placeBet(uint256 _marketId, bool _prediction) external payable",
  "function resolveMarket(uint256 _marketId, bool _outcome) external",
  "function claimWinnings(uint256 _marketId) external",
  "function getMarket(uint256 _marketId) external view returns (string memory question, uint256 endTime, uint256 totalYesBets, uint256 totalNoBets, bool resolved, bool outcome, address creator)",
  "function getBetExists(uint256 _marketId) external view returns (bool exists, bool claimed)",
  "function getTotalMarkets() external view returns (uint256)",
  "function getMarketBettors(uint256 _marketId) external view returns (address[] memory)",
  "event MarketCreated(uint256 indexed marketId, string question, uint256 endTime, address creator)",
  "event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 amount)",
  "event MarketResolved(uint256 indexed marketId, bool outcome)",
  "event WinningsClaimed(uint256 indexed marketId, address indexed winner, uint256 amount)"
];

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numericChainId = parseInt(chainId, 16);

      if (numericChainId !== SEPOLIA_CHAIN_ID) {
        await this.switchToSepolia();
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contract
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESSES.predictionMarket,
        PREDICTION_MARKET_ABI,
        this.signer
      );

      const address = accounts[0];
      console.log('✅ Connected to Sepolia!');

      return {
        address,
        isConnected: true,
        chainId: SEPOLIA_CHAIN_ID,
      };
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  private async switchToSepolia(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [SEPOLIA_RPC_URL],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  async createMarket(question: string, duration: number): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    if (!question || question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }
    if (duration <= 0) {
      throw new Error('Duration must be positive');
    }
    
    const tx = await this.contract.createMarket(question, duration);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async placeBet(marketId: number, prediction: boolean, amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    // Validate inputs
    const amountWei = ethers.parseEther(amount);
    const minBet = ethers.parseEther('0.001');
    const maxBet = ethers.parseEther('10');
    
    if (amountWei < minBet || amountWei > maxBet) {
      throw new Error('Bet amount must be between 0.001 and 10 ETH');
    }
    
    try {
      // Execute transaction directly - allow any contract interaction
      const tx = await this.contract.placeBet(marketId, prediction, {
        value: amountWei,
        gasLimit: 300000
      });
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('PlaceBet error:', error);
      
      // For missing revert data, provide a user-friendly message
      if (error.code === 'CALL_EXCEPTION' && error.message.includes('missing revert data')) {
        throw new Error('Transaction failed - contract may not have this market or function. But transaction was attempted.');
      }
      
      // Allow other errors to pass through with more context
      throw new Error(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  }

  async resolveMarket(marketId: number, outcome: boolean): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.resolveMarket(marketId, outcome);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async claimWinnings(marketId: number): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.claimWinnings(marketId);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async getMarket(marketId: number) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.getMarket(marketId);
  }

  async getTotalMarkets(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const total = await this.contract.getTotalMarkets();
    return Number(total);
  }

  getContract(): ethers.Contract | null {
    return this.contract;
  }
}

declare global {
  interface Window {
    ethereum: any;
  }
}