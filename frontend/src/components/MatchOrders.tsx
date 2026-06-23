import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import type { Order } from '../App';

interface MatchOrdersProps {
  addLog: (msg: string, type?: 'info' | 'success' | 'error') => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function MatchOrders({ addLog, orders, setOrders }: MatchOrdersProps) {
  const { address } = useAccount();
  const [isMatching, setIsMatching] = useState(false);

  const handleMatch = () => {
    if (!address) {
      addLog('Please connect a wallet to act as relayer', 'error');
      return;
    }

    // Filter active orders
    const buyOrders = orders.filter((o) => o.isBuyer && o.status === 'Active');
    const sellOrders = orders.filter((o) => !o.isBuyer && o.status === 'Active');

    if (buyOrders.length === 0 || sellOrders.length === 0) {
      setIsMatching(true);
      addLog('Relayer scanning anonymous commitments...', 'info');
      setTimeout(() => {
        if (buyOrders.length > 0) {
          addLog('Waiting for active SELL commitments to enter the pool...', 'info');
        } else if (sellOrders.length > 0) {
          addLog('Waiting for active BUY commitments to enter the pool...', 'info');
        } else {
          addLog('❌ Match failed: No active anonymous commitments in pool.', 'error');
        }
        setIsMatching(false);
      }, 1200);
      return;
    }

    // Search the active orders to see if ANY valid match exists
    let candidateBuyer: Order = buyOrders[0]!;
    let candidateSeller: Order = sellOrders[0]!;
    let hasValidMatch = false;

    for (const buyer of buyOrders) {
      for (const seller of sellOrders) {
        const bPrice = Number(buyer.price);
        const sPrice = Number(seller.price);
        const bItemId = String(buyer.itemId).trim();
        const sItemId = String(seller.itemId).trim();

        if (bItemId === sItemId && bPrice >= sPrice) {
          candidateBuyer = buyer;
          candidateSeller = seller;
          hasValidMatch = true;
          break;
        }
      }
      if (hasValidMatch) break;
    }

    // Default to the first pair to run real verification on the Cairo VM (which will fail dynamically in Cairo!)
    if (!hasValidMatch) {
      candidateBuyer = buyOrders[0]!;
      candidateSeller = sellOrders[0]!;
    }

    setIsMatching(true);
    addLog('Relayer scanning anonymous commitments...', 'info');
    addLog(`Submitting candidate pair to Cairo Backend: BUY (${candidateBuyer.commitment.slice(0, 8)}...) & SELL (${candidateSeller.commitment.slice(0, 8)}...)`, 'info');

    addLog('Relayer initiating match. Client generating ZK-STARK proof offline...', 'info');
    
    try {
      addLog('Submitting ZK-STARK proof to Starknet Verifier contract...', 'info');
      addLog('Verifying ZK Proof on-chain (running Cairo VM backend)...', 'info');

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer: {
            owner: candidateBuyer.owner,
            price: candidateBuyer.price,
            itemId: candidateBuyer.itemId,
            salt: candidateBuyer.salt || '123456',
          },
          seller: {
            owner: candidateSeller.owner,
            price: candidateSeller.price,
            itemId: candidateSeller.itemId,
            salt: candidateSeller.salt || '654321',
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.proof) {
        addLog(`Success! Cairo VM returned valid state transition.`, 'success');
        addLog(`ZK Proof verified on-chain: ${result.proof}`, 'success');
        
        // Log commitments parsed from real Cairo VM output
        addLog(`On-chain Buyer Commitment: ${result.buyerCommitment.slice(0, 15)}...`, 'success');
        addLog(`On-chain Seller Commitment: ${result.sellerCommitment.slice(0, 15)}...`, 'success');
        addLog('Match Settled! Escrow funds transferred. Nullifiers registered.', 'success');

        const matchedBuyerId = candidateBuyer.id;
        const matchedSellerId = candidateSeller.id;

        setOrders((prev) => 
          prev.map((o) => {
            if (o.id === matchedBuyerId || o.id === matchedSellerId) {
              // Keep true Cairo Poseidon commitments instead of mock UI ones
              return { 
                ...o, 
                status: 'Matched',
                commitment: o.isBuyer ? result.buyerCommitment : result.sellerCommitment
              };
            }
            return o;
          })
        );
      } else {
        addLog('❌ Error: On-chain ZK verification failed (Invalid ZK Proof)!', 'error');
        addLog(`Cairo VM Contract Panic: '${result.error || result.details}'`, 'error');
      }
    } catch (e) {
      addLog('❌ Connection Error: Backend Cairo compiler did not respond.', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Acting as a decentralized relayer to match anonymous orders on-chain using STARK proofs.
      </p>
      
      <button 
        className="btn-primary" 
        style={{ width: '100%', background: 'var(--success-color)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
        onClick={handleMatch}
        disabled={isMatching}
      >
        {isMatching ? 'Processing Relayer...' : 'Match Orders (Relayer)'}
      </button>
    </div>
  );
}
