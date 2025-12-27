import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import { RecordSubmit } from './components/records/RecordSubmit';
import { AccessControl } from './components/permissions/AccessControl';
import './App.css';

const queryClient = new QueryClient();

type Tab = 'submit' | 'access';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('submit');

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🏥</span>
          <div className="logo-text">
            <h1>MediVault</h1>
            <span className="tagline">Privacy-First Health Records</span>
          </div>
        </div>
        <ConnectButton />
      </header>

      <main className="main">
        <div className="hero">
          <h2>Your Health Data, Your Control</h2>
          <p>
            Store your health metrics with military-grade encryption.
            Powered by Fully Homomorphic Encryption (FHE) on Ethereum.
          </p>
        </div>

        <nav className="tabs">
          <button
            className={activeTab === 'submit' ? 'active' : ''}
            onClick={() => setActiveTab('submit')}
          >
            📊 Submit Record
          </button>
          <button
            className={activeTab === 'access' ? 'active' : ''}
            onClick={() => setActiveTab('access')}
          >
            🔐 Manage Access
          </button>
        </nav>

        <div className="content">
          {activeTab === 'submit' && <RecordSubmit />}
          {activeTab === 'access' && <AccessControl />}
        </div>

        <section className="features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <h3>End-to-End Encrypted</h3>
            <p>Your data is encrypted before it ever leaves your device</p>
          </div>
          <div className="feature">
            <span className="feature-icon">⛓️</span>
            <h3>Blockchain Secured</h3>
            <p>Immutable storage on Ethereum for tamper-proof records</p>
          </div>
          <div className="feature">
            <span className="feature-icon">👤</span>
            <h3>Patient Controlled</h3>
            <p>You decide who can access your health information</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Built with Zama FHE on Ethereum Sepolia</p>
        <p className="disclaimer">
          This is a demo application. Do not store real medical data.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
