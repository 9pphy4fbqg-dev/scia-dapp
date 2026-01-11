/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_NETWORK: string;
  readonly REACT_APP_TESTNET_CHAIN_ID: string;
  readonly REACT_APP_TESTNET_RPC_URL: string;
  readonly REACT_APP_TESTNET_BSC_SCAN_URL: string;
  readonly REACT_APP_TESTNET_SANCIA_TOKEN_ADDRESS: string;
  readonly REACT_APP_TESTNET_REFERRAL_CENTER_ADDRESS: string;
  readonly REACT_APP_TESTNET_PRIVATE_SALE_CONTRACT_ADDRESS: string;
  readonly REACT_APP_TESTNET_USDT_ADDRESS: string;
  readonly REACT_APP_MAINNET_CHAIN_ID: string;
  readonly REACT_APP_MAINNET_RPC_URL: string;
  readonly REACT_APP_MAINNET_BSC_SCAN_URL: string;
  readonly REACT_APP_MAINNET_SANCIA_TOKEN_ADDRESS: string;
  readonly REACT_APP_MAINNET_REFERRAL_CENTER_ADDRESS: string;
  readonly REACT_APP_MAINNET_PRIVATE_SALE_CONTRACT_ADDRESS: string;
  readonly REACT_APP_MAINNET_USDT_ADDRESS: string;
  readonly REACT_APP_DEPLOYER_ADDRESS: string;
  readonly REACT_APP_BSCSCAN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
