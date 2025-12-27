import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'MediVault',
  projectId: 'medivault-fhe-health-records',
  chains: [sepolia],
  ssr: false,
});
