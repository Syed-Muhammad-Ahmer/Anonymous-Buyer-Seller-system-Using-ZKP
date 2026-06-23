import { useState, useEffect } from 'react';
import WalletConnection from './components/WalletConnection';
import CreateOrderForm from './components/CreateOrderForm';
import MatchOrders from './components/MatchOrders';
import LiveTransactions from './components/LiveTransactions';

export type LogEntry = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
};

export type Order = {
  id: string;
  itemId: string;
  price: number;
  isBuyer: boolean;
  commitment: string;
  status: 'Active' | 'Matched' | 'Cancelled';
  owner: string;
  salt?: number;
};

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('zk_orders');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('zk_orders', JSON.stringify(orders));
  }, [orders]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="app-container">
      <header className="animate-in" style={{ animationDelay: '0.1s' }}>
        <div className="logo">ZK Marketplace</div>
        <WalletConnection />
      </header>

      <main className="dashboard-grid">
        <section className="glass-panel animate-in" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create Order</h2>
          <CreateOrderForm addLog={addLog} orders={orders} setOrders={setOrders} />
        </section>

        <section className="glass-panel animate-in" style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Match Orders</h2>
            <MatchOrders addLog={addLog} orders={orders} setOrders={setOrders} />
          </div>

          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Live Transactions</h2>
            <LiveTransactions logs={logs} />
          </div>
        </section>

        <section className="glass-panel animate-in" style={{ animationDelay: '0.4s', gridColumn: '1 / -1', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Anonymous Commitment Pool</h2>
            {orders.length > 0 && (
              <button 
                className="btn-outline" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
                onClick={() => {
                  setOrders([]);
                  addLog('Cleared commitment pool', 'info');
                }}
              >
                Clear Pool
              </button>
            )}
          </div>
          
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No active anonymous commitments found on-chain.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Commitment Hash</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Item ID (Secret)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Price (MNT)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Owner</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                        {o.commitment}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: o.isBuyer ? 'rgba(99, 102, 241, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                          color: o.isBuyer ? '#818cf8' : '#f472b6'
                        }}>
                          {o.isBuyer ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', color: o.status === 'Active' ? 'var(--text-muted)' : 'var(--success-color)' }}>
                          {o.status === 'Active' ? '🔒 Shielded (ZK-Hidden)' : `🔓 Revealed (${o.itemId})`}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: o.status === 'Active' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {o.status === 'Active' ? '🔒 Shielded' : `🔓 Settled (${o.price} MNT)`}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {o.owner.slice(0, 6)}...{o.owner.slice(-4)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: o.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                          color: o.status === 'Active' ? 'var(--success-color)' : 'var(--text-muted)'
                        }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
