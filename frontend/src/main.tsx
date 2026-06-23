import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { mainnet, sepolia } from '@starknet-react/chains';
import {
  StarknetConfig,
  jsonRpcProvider,
  argent,
  braavos,
  useInjectedConnectors
} from '@starknet-react/core';

function Root() {
  const { connectors } = useInjectedConnectors({
    recommended: [
      argent(),
      braavos(),
    ],
    includeRecommended: "always",
  });

  function rpc(chain: any) {
    return {
      nodeUrl: `https://free-rpc.nethermind.io/${chain.network === 'mainnet' ? 'mainnet' : 'sepolia'}-juno/v0_7`
    };
  }

  return (
    <StarknetConfig
      chains={[sepolia, mainnet]}
      provider={jsonRpcProvider({ rpc })}
      connectors={connectors}
    >
      <App />
    </StarknetConfig>
  );
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: 'white' }}>
          <h1>React Crashed!</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
