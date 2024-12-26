import "./messages/discoverable.tact";
import "../errors.tact";
// Trait for generating jetton wallet state init
trait DiscoverWalletAddress {
    // Initial code of jetton wallet
    jetton_wallet_code: Cell;
    // System cell of jetton wallet contract (Tact feature)
    jetton_wallet_system: Cell;

    fun discover_wallet_state_init(master: Address, owner: Address): StateInit {
        let data = beginCell().storeRef(self.jetton_wallet_system).storeUint(0, 1).storeAddress(master
        ).storeAddress(owner).endCell();
        return StateInit{code: self.jetton_wallet_code, data: data};
    }
}
// Trait for discover jetton wallet address by owner
// https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md
trait TEP89JettonDiscoverable with DiscoverWalletAddress {
    // Initial code of jetton wallet
    jetton_wallet_code: Cell;
    // System cell of jetton wallet contract (Tact feature)
    jetton_wallet_system: Cell;

    receive(msg: ProvideWalletAddress){
        let ctx = context();
        nativeThrowUnless(ERROR_CODE_NEED_FEE, ctx.value >= ton("0.0062")); 
        
        let init = self.discover_wallet_state_init(myAddress(), msg.owner_address);
        let address = contractAddress(init);
        let owner_address: Address? = null;
        if (msg.include_address) {
            owner_address = msg.owner_address;
        }
        send(SendParameters{
                to: ctx.sender,
                value: 0,
                mode: SendRemainingValue,
                body: TakeWalletAddress{
                    query_id: msg.query_id,
                    wallet_address: address,
                    owner_address: owner_address
                }.toCell()
            }
        );
    }
}