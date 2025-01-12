import { Cell } from '@ton/core';

//Wallet System Cell
export const SYSTEM_CELL = Cell.fromBase64('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');

export const OP_CODES = {
    JettonTransfer: 0x0f8a7ea5,            // Message for transferring Jettons
    JettonTransferInternal: 0x178d4519,    // Internal Jetton transfer
    JettonTransferNotification: 0x7362d09c,// Notification for a completed transfer
    JettonBurn: 0x595f07bc,                // Burn Jettons
    JettonBurnInternal: 0x7bdd97de,        // Internal Jetton burn
    Excesses: 0xd53276db,                  // Handle excess balances
    ProvideWalletAddress: 0x2c76b973,      // Request a Jetton wallet address
    TakeWalletAddress: 0xd1735400,         // Respond with a Jetton wallet address
    JettonInit: 0x133701,                  // Initialize the Jetton
    JettonInitOk: 0x133702,                // Confirm Jetton initialization
    JettonSetParameter: 0x133703,          // Set Jetton parameters
    JettonMint: 0x133704,                  // Mint new Jettons
};

export const ERROR_CODES = {
    InvalidOwner: 132,                     // Default Tact error code for invalid owner
    NotEnoughBalance: 6901,                // Jetton wallet balance doesn't have enough tokens
    NeedFee: 6902,                         // Need more TONs in request for fee
    JettonInitialized: 6903,               // Jetton already initialized
    MaxSupplyExceeded: 6904,               // Jetton max supply exceeded
    InvalidAmount: 6905,                   // Invalid transfer amount (e.g., zero tokens)
    MintingAlreadyDisabled: 6906,          // Minting already disabled
    MintingDisabled: 6907,                 // Minting is disabled
};