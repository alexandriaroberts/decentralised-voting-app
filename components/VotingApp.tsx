'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const contractABI = [
  'function addProposal(string memory _name) public',
  'function vote(uint _proposalIndex) public',
  'function getProposals() public view returns (tuple(string name, uint256 voteCount)[] memory)',
] as const;

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

interface Proposal {
  name: string;
  voteCount: number;
}

export default function VotingApp() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [newProposal, setNewProposal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      setAccount(null);
      setError('Please connect to MetaMask.');
    }
  }, []);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  const initializeProvider = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        return browserProvider;
      } catch (err) {
        console.error('Provider initialization error:', err);
        setError('Failed to initialize provider');
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const init = async () => {
      const browserProvider = await initializeProvider();
      if (browserProvider) {
        try {
          // Add event listeners
          window.ethereum?.on('accountsChanged', handleAccountsChanged);
          window.ethereum?.on('chainChanged', handleChainChanged);

          // Check if already connected
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            handleAccountsChanged([accounts[0].address]);
            await setupEthereumConnection(browserProvider);
          }
        } catch (err) {
          console.error('Initialization error:', err);
          setError('Failed to initialize the app');
        }
      } else {
        setError('Please install MetaMask to use this DApp');
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged as (...args: unknown[]) => void
        );
        window.ethereum.removeListener(
          'chainChanged',
          handleChainChanged as (...args: unknown[]) => void
        );
      }
    };
  }, [handleAccountsChanged, handleChainChanged, initializeProvider]);

  const setupEthereumConnection = async (
    browserProvider: ethers.BrowserProvider
  ) => {
    try {
      const network = await browserProvider.getNetwork();
      if (network.chainId !== 1337n) {
        // Try to switch to the Hardhat network
        try {
          await window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }], // 1337 in hex
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum?.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x539',
                    chainName: 'Hardhat Local',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Error adding network:', addError);
              setError('Failed to add Hardhat network to MetaMask');
              return;
            }
          } else {
            console.error('Error switching network:', switchError);
            setError('Failed to switch to Hardhat network');
            return;
          }
        }
      }

      const signer = await browserProvider.getSigner();
      const votingContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(votingContract);
      await fetchProposals(votingContract);
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to setup Ethereum connection');
    }
  };

  const connectWallet = async () => {
    try {
      // First ensure provider is initialized
      const browserProvider = await initializeProvider();
      if (!browserProvider) {
        setError('Failed to initialize provider');
        return;
      }

      // Request account access
      try {
        await window.ethereum?.request({
          method: 'eth_requestAccounts',
        });

        // Get the signer and set up the connection
        await setupEthereumConnection(browserProvider);

        // Get the connected account
        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (err) {
        console.error('Connection error:', err);
        setError('Failed to connect wallet');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet');
    }
  };

  const fetchProposals = async (contractToUse = contract) => {
    if (contractToUse) {
      try {
        const fetchedProposals = (await contractToUse.getProposals()) as [
          string,
          bigint
        ][];
        setProposals(
          fetchedProposals.map(([name, voteCount]) => ({
            name,
            voteCount: Number(voteCount),
          }))
        );
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError('Failed to fetch proposals');
      }
    }
  };

  const addProposal = async () => {
    if (contract && newProposal) {
      setIsLoading(true);
      try {
        const tx = await contract.addProposal(newProposal);
        await tx.wait();
        setNewProposal('');
        await fetchProposals();
      } catch (err) {
        console.error('Error adding proposal:', err);
        setError('Failed to add proposal');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const vote = async (proposalIndex: number) => {
    if (contract) {
      setIsLoading(true);
      try {
        const tx = await contract.vote(proposalIndex);
        await tx.wait();
        await fetchProposals();
      } catch (err) {
        console.error('Error voting:', err);
        setError('Failed to vote');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className='w-full max-w-md bg-white/10 backdrop-blur-md border-gray-700'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold text-white'>
          Voting DApp
        </CardTitle>
        <CardDescription className='text-gray-300'>
          {account
            ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
            : 'Please connect your wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!account && (
          <Button onClick={connectWallet} className='w-full mb-4'>
            Connect MetaMask
          </Button>
        )}
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className='space-y-4'>
          <div className='flex space-x-2'>
            <Input
              placeholder='New proposal'
              value={newProposal}
              onChange={(e) => setNewProposal(e.target.value)}
              className='flex-grow bg-gray-800 text-white border-gray-700'
            />
            <Button onClick={addProposal} disabled={isLoading || !account}>
              Add
            </Button>
          </div>
          {proposals.map((proposal, index) => (
            <Card key={index} className='bg-gray-800 border-gray-700'>
              <CardHeader>
                <CardTitle className='text-white'>{proposal.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress
                  value={proposal.voteCount}
                  max={Math.max(...proposals.map((p) => p.voteCount))}
                  className='h-2'
                />
              </CardContent>
              <CardFooter className='flex justify-between'>
                <span className='text-gray-300'>
                  Votes: {proposal.voteCount}
                </span>
                <Button
                  onClick={() => vote(index)}
                  disabled={isLoading || !account}
                  variant='secondary'
                >
                  Vote
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
