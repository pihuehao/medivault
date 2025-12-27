/**
 * Custom hook to initialize and manage the Zama FHE instance.
 *
 * The FHE instance is required for:
 * - Creating encrypted inputs (for submitting health metrics)
 * - Generating keypairs for decryption
 * - Creating EIP-712 signatures for decryption requests
 * - Performing user-side decryption
 */

import { useState, useEffect } from 'react';
import { createInstance, initSDK } from '@zama-fhe/relayer-sdk/bundle';

// Sepolia config - use Coprocessor address to match @fhevm/solidity 0.10.0
const SepoliaConfig = {
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  inputVerifierContractAddress: '0x92C920834Ec8941d2C77D188936E1f7A6f49c127',
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  verifyingContractAddressInputVerification: '0x92C920834Ec8941d2C77D188936E1f7A6f49c127',
  chainId: 11155111,
  gatewayChainId: 10901,
  network: 'https://ethereum-sepolia-rpc.publicnode.com',
  relayerUrl: 'https://relayer.testnet.zama.org',
};

/**
 * Hook that initializes and returns the FHE instance.
 */
export function useFheInstance() {
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initFhe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await initSDK();
        const fheInstance = await createInstance(SepoliaConfig);

        if (mounted) {
          setInstance(fheInstance);
        }
      } catch (err: any) {
        console.error('Failed to initialize FHE instance:', err);
        if (mounted) {
          setError(err?.message || 'Failed to initialize encryption service');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initFhe();

    return () => {
      mounted = false;
    };
  }, []);

  return { instance, isLoading, error };
}
