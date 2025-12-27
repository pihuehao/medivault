import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, METRICS } from '../../config/contracts';
import './AccessControl.css';

export function AccessControl() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [viewerAddress, setViewerAddress] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState({
    bloodPressure: false,
    heartRate: false,
    glucoseLevel: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const calculateMask = (): number => {
    let mask = 0;
    if (selectedMetrics.bloodPressure) mask |= METRICS.BLOOD_PRESSURE;
    if (selectedMetrics.heartRate) mask |= METRICS.HEART_RATE;
    if (selectedMetrics.glucoseLevel) mask |= METRICS.GLUCOSE;
    return mask;
  };

  const handleGrantAccess = async () => {
    if (!isConnected || !walletClient) {
      setStatus({ type: 'error', message: 'Please connect your wallet' });
      return;
    }

    if (!ethers.isAddress(viewerAddress)) {
      setStatus({ type: 'error', message: 'Invalid Ethereum address' });
      return;
    }

    const mask = calculateMask();
    if (mask === 0) {
      setStatus({ type: 'error', message: 'Please select at least one metric' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.grantAccess(viewerAddress, mask);
      setStatus({ type: 'success', message: 'Granting access...' });
      await tx.wait();

      setStatus({ type: 'success', message: 'Access granted successfully!' });
      setViewerAddress('');
      setSelectedMetrics({ bloodPressure: false, heartRate: false, glucoseLevel: false });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!isConnected || !walletClient) {
      setStatus({ type: 'error', message: 'Please connect your wallet' });
      return;
    }

    if (!ethers.isAddress(viewerAddress)) {
      setStatus({ type: 'error', message: 'Invalid Ethereum address' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.revokeAccess(viewerAddress, METRICS.ALL);
      setStatus({ type: 'success', message: 'Revoking access...' });
      await tx.wait();

      setStatus({ type: 'success', message: 'Access revoked successfully!' });
      setViewerAddress('');
    } catch (err: any) {
      setStatus({ type: 'error', message: `Failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="access-control">
      <h2>🔐 Manage Access</h2>
      <p className="description">
        Control who can view your encrypted health data.
        Grant access to doctors, hospitals, or insurance providers.
      </p>

      <div className="input-group">
        <label>Viewer Address (Doctor/Hospital)</label>
        <input
          type="text"
          value={viewerAddress}
          onChange={(e) => setViewerAddress(e.target.value)}
          placeholder="0x..."
          disabled={isSubmitting}
        />
      </div>

      <div className="metrics-selection">
        <label>Select Metrics to Share:</label>
        <div className="checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedMetrics.bloodPressure}
              onChange={(e) => setSelectedMetrics(prev => ({ ...prev, bloodPressure: e.target.checked }))}
              disabled={isSubmitting}
            />
            🩸 Blood Pressure
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedMetrics.heartRate}
              onChange={(e) => setSelectedMetrics(prev => ({ ...prev, heartRate: e.target.checked }))}
              disabled={isSubmitting}
            />
            💓 Heart Rate
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedMetrics.glucoseLevel}
              onChange={(e) => setSelectedMetrics(prev => ({ ...prev, glucoseLevel: e.target.checked }))}
              disabled={isSubmitting}
            />
            🍬 Glucose Level
          </label>
        </div>
      </div>

      <div className="button-group">
        <button
          className="grant-btn"
          onClick={handleGrantAccess}
          disabled={isSubmitting || !isConnected}
        >
          {isSubmitting ? 'Processing...' : 'Grant Access'}
        </button>
        <button
          className="revoke-btn"
          onClick={handleRevokeAccess}
          disabled={isSubmitting || !isConnected}
        >
          Revoke All Access
        </button>
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
