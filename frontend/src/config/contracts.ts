/**
 * Smart Contract Configuration for MediVault
 *
 * Update CONTRACT_ADDRESS after deploying to a new network.
 */

// Deployed MedicalRecord contract address on Sepolia testnet
export const CONTRACT_ADDRESS = '0xCbcd472a3BbD563267020895af671D75b0F03D60';

// MedicalRecord contract ABI
export const CONTRACT_ABI = [
  // Write Functions
  {
    inputs: [
      { internalType: 'externalEuint32', name: 'encBloodPressure', type: 'bytes32' },
      { internalType: 'externalEuint32', name: 'encHeartRate', type: 'bytes32' },
      { internalType: 'externalEuint32', name: 'encGlucose', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'submitRecord',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'viewer', type: 'address' },
      { internalType: 'uint8', name: 'metricMask', type: 'uint8' },
    ],
    name: 'grantAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'viewer', type: 'address' },
      { internalType: 'uint8', name: 'metricMask', type: 'uint8' },
    ],
    name: 'revokeAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Read Functions
  {
    inputs: [{ internalType: 'address', name: 'patient', type: 'address' }],
    name: 'getRecord',
    outputs: [
      { internalType: 'euint32', name: '', type: 'bytes32' },
      { internalType: 'euint32', name: '', type: 'bytes32' },
      { internalType: 'euint32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'patient', type: 'address' }],
    name: 'hasRecord',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'patient', type: 'address' }],
    name: 'getLastUpdated',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'address', name: 'viewer', type: 'address' },
    ],
    name: 'getAccess',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RecordUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
      { indexed: true, internalType: 'address', name: 'viewer', type: 'address' },
      { indexed: false, internalType: 'uint8', name: 'permissions', type: 'uint8' },
    ],
    name: 'AccessChanged',
    type: 'event',
  },
] as const;

// Metric bitmask constants
export const METRICS = {
  BLOOD_PRESSURE: 1,
  HEART_RATE: 2,
  GLUCOSE: 4,
  ALL: 7,
} as const;

export const METRIC_NAMES = {
  1: 'Blood Pressure',
  2: 'Heart Rate',
  4: 'Glucose Level',
} as const;
