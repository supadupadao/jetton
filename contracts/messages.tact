message(0x0f8a7ea5) JettonTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}
message(0x178d4519) JettonTransferInternal {
    query_id: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}
message(0x7362d09c) JettonTransferNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}
message(0x595f07bc) JettonBurn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address;
    custom_payload: Cell?;
}
message(0x7bdd97de) JettonBurnInternal {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address;
}
message(0xd53276db) Excesses {
    query_id: Int as uint64;
}
message(0x133701) JettonInit {
    query_id: Int as uint64;
    jetton_name: String;
    jetton_description: String;
    jetton_symbol: String;
    max_supply: Int as coins;
}
message(0x133702) JettonInitOk {
    query_id: Int as uint64;
}
message(0x133703) JettonSetParameter {
    key: String;
    value: Slice;
}