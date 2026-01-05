/**
 * Configuration for the Aptos Counter App
 */

// The address where the module is deployed.
// IMPORTANT: Replace this with your actual deployed account address if different.
// For devnet/local usage, this is often the address of the account that published the module.
export const MODULE_ADDRESS = "0x42"; // e.g. "0x95..."

// The name of the module as defined in the Move code
export const MODULE_NAME = "counter";

// Aptos Network to connect to (devnet, testnet, or mainnet)
export const NETWORK = "devnet";