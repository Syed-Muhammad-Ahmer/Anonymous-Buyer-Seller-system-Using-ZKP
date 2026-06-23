import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';

export default function WalletConnection() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : 'Connect Wallet';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className={address ? "btn-outline" : "btn-primary"}
        onClick={() => address ? disconnect() : setIsOpen(!isOpen)}
      >
        {displayAddress}
      </button>

      {isOpen && !address && (
        <div className="wallet-dropdown animate-in" style={{ animationDelay: '0s' }}>
          {connectors.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No wallets found</div>
          ) : (
            connectors.map((connector) => (
              <button
                key={connector.id}
                className="wallet-option"
                onClick={() => {
                  connect({ connector });
                  setIsOpen(false);
                }}
                disabled={!connector.available()}
                style={{ opacity: connector.available() ? 1 : 0.5 }}
              >
                <img 
                  src={typeof connector.icon === 'string' ? connector.icon : connector.icon?.light} 
                  alt={connector.name} 
                  style={{ width: '24px', height: '24px' }} 
                />
                {connector.name} {connector.available() ? '' : '(Not Installed)'}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
