message(0x133701) JettonInit {
    query_id: Int as uint64;
    jetton_name: Slice;
    jetton_description: Slice;
    jetton_symbol: Slice;
    max_supply: Int as coins;
}
message(0x133702) JettonInitOk {
    query_id: Int as uint64;
}
message(0x133703) JettonSetParameter {
    key: String;
    value: Slice;
}
message(0x133704) JettonMint {
    query_id: Int as uint64;
    destination: Address;
    amount: Int as coins;
}