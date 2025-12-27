import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useFheInstance } from '../../hooks/useFheInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contracts';
import { METRIC_LABELS, METRIC_ICONS, METRIC_RANGES, MetricType } from '../../types';
import './RecordSubmit.css';

export function RecordSubmit() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { instance: fheInstance, isLoading: fheLoading, error: fheError } = useFheInstance();

  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateMetric = (value: string, type: MetricType): boolean => {
    const num = parseInt(value);
    const range = METRIC_RANGES[type];
    return !isNaN(num) && num >= range.min && num <= range.max;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!isConnected || !address) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    if (!fheInstance) {
      setStatus({ type: 'error', message: fheError || 'FHE encryption is still initializing' });
      return;
    }

    if (!walletClient) {
      setStatus({ type: 'error', message: 'Wallet not ready' });
      return;
    }

    // Validate all metrics
    if (!validateMetric(bloodPressure, 'bloodPressure')) {
      setStatus({ type: 'error', message: 'Blood pressure must be between 70-200 mmHg' });
      return;
    }
    if (!validateMetric(heartRate, 'heartRate')) {
      setStatus({ type: 'error', message: 'Heart rate must be between 40-200 BPM' });
      return;
    }
    if (!validateMetric(glucoseLevel, 'glucoseLevel')) {
      setStatus({ type: 'error', message: 'Glucose level must be between 50-400 mg/dL' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create encrypted inputs
      const input = fheInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(parseInt(bloodPressure));
      input.add32(parseInt(heartRate));
      input.add32(parseInt(glucoseLevel));

      const { handles, inputProof } = await input.encrypt();

      // Create contract instance
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Submit encrypted health record
      const tx = await contract.submitRecord(
        handles[0],
        handles[1],
        handles[2],
        inputProof
      );

      setStatus({ type: 'success', message: 'Submitting health record...' });
      await tx.wait();

      setStatus({ type: 'success', message: 'Health record submitted successfully!' });
      setBloodPressure('');
      setHeartRate('');
      setGlucoseLevel('');
    } catch (err: any) {
      console.error('Submit error:', err);
      setStatus({ type: 'error', message: `Failed to submit: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fheLoading) {
    return (
      <div className="record-submit loading">
        <div className="spinner"></div>
        <p>Initializing encryption...</p>
      </div>
    );
  }

  return (
    <div className="record-submit">
      <h2>{METRIC_ICONS.heartRate} Submit Health Record</h2>
      <p className="description">
        Your health metrics are encrypted before being stored on the blockchain.
        Only you control who can view them.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="metric-input">
          <label>
            {METRIC_ICONS.bloodPressure} {METRIC_LABELS.bloodPressure}
          </label>
          <input
            type="number"
            value={bloodPressure}
            onChange={(e) => setBloodPressure(e.target.value)}
            placeholder="e.g., 120"
            min={METRIC_RANGES.bloodPressure.min}
            max={METRIC_RANGES.bloodPressure.max}
            disabled={isSubmitting}
          />
          <span className="hint">Normal: 90-120 mmHg</span>
        </div>

        <div className="metric-input">
          <label>
            {METRIC_ICONS.heartRate} {METRIC_LABELS.heartRate}
          </label>
          <input
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder="e.g., 72"
            min={METRIC_RANGES.heartRate.min}
            max={METRIC_RANGES.heartRate.max}
            disabled={isSubmitting}
          />
          <span className="hint">Normal: 60-100 BPM</span>
        </div>

        <div className="metric-input">
          <label>
            {METRIC_ICONS.glucoseLevel} {METRIC_LABELS.glucoseLevel}
          </label>
          <input
            type="number"
            value={glucoseLevel}
            onChange={(e) => setGlucoseLevel(e.target.value)}
            placeholder="e.g., 95"
            min={METRIC_RANGES.glucoseLevel.min}
            max={METRIC_RANGES.glucoseLevel.max}
            disabled={isSubmitting}
          />
          <span className="hint">Normal (fasting): 70-100 mg/dL</span>
        </div>

        <button type="submit" disabled={isSubmitting || !isConnected}>
          {isSubmitting ? 'Encrypting & Submitting...' : 'Submit Encrypted Record'}
        </button>
      </form>

      {status && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
