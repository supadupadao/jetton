
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
