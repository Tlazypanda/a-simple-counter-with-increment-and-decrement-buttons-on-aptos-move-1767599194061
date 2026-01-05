import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { NETWORK } from "./constants";

// Initialize the Aptos client with the specific network configuration
const config = new AptosConfig({ network: Network.DEVNET }); // Change to TESTNET or MAINNET as needed
export const aptos = new Aptos(config);