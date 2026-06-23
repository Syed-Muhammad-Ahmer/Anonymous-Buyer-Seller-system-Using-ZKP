import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import type { Order } from '../App';

interface CreateOrderFormProps {
  addLog: (msg: string, type?: 'info' | 'success' | 'error') => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function CreateOrderForm({ addLog, setOrders }: CreateOrderFormProps) {
  const { address } = useAccount();
  const [itemId, setItemId] = useState('42');
  const [price, setPrice] = useState('1000');
  const [isBuyer, setIsBuyer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      addLog('Please connect your wallet first', 'error');
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      addLog('Please enter a valid price', 'error');
      return;
    }

    setIsSubmitting(true);
    addLog(`Generating ZK Commitment for ${isBuyer ? 'Buy' : 'Sell'} Order...`);
    
    // Call the Cairo ZK backend for the Poseidon commitment
    try {
      const salt = Math.floor(Math.random() * 1000000); // Generate a random secret salt
      const res = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: address,
          itemId: itemId,
          price: priceNum,
          salt: salt
        })
      });

      if (!res.ok) throw new Error("Backend Cairo execution failed");

      const data = await res.json();
      const commitment = data.commitment;
      
      addLog(`Success! Escrow ${isBuyer ? 'locked' : 'registered'} on-chain.`, 'success');
      addLog(`Commitment Hash: ${commitment.slice(0, 15)}...`);
      addLog(`ZK proof generated (Cairo): ${data.proof}`);
      
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        itemId,
        price: priceNum,
        isBuyer,
        commitment,
        status: 'Active',
        owner: address,
        salt: salt, // Store salt locally (in localStorage) to use for matching later
      };

      setOrders((prev) => [...prev, newOrder]);
    } catch (err) {
      addLog('❌ ZK Commitment generation failed (Check Cairo Prover)', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Order Type</label>
        <select 
          value={isBuyer ? 'buy' : 'sell'} 
          onChange={(e) => setIsBuyer(e.target.value === 'buy')}
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      <div className="form-group">
        <label>Item ID (Secret)</label>
        <input 
          type="number" 
          value={itemId} 
          onChange={(e) => setItemId(e.target.value)} 
          placeholder="e.g. 42"
          required
        />
      </div>

      <div className="form-group">
        <label>Price</label>
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          placeholder="e.g. 1000"
          required
        />
      </div>

      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Register Order Anonymously'}
      </button>
    </form>
  );
}
