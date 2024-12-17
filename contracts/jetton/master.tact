import "@stdlib/deploy";
import "@stdlib/ownable";
import "./wallet.tact";
import "../teps/tep74.tact";
import "../teps/tep89.tact";
import "../messages.tact";
import "../errors.tact";

@interface("org.ton.jetton.master")
contract JettonMaster with TEP74JettonMaster, TEP89JettonDiscoverable, Deployable, Ownable {
    // Maximum tokens can be minted
    max_supply: Int = ton("21000000");
    // Current tokens minted
    current_supply: Int = 0;
    // Administrator of token. Who can mint new tokens
    owner: Address;
    // Initial code of jetton wallet
    jetton_wallet_code: Cell;
    // System cell of jetton wallet contract (Tact feature)
    jetton_wallet_system: Cell;
    // Jetton metadata
    metadata: OnchainMetadata;
    // Is token initialized (to avoid double init)
    deployed: Bool = false;
    init(owner: Address){
        self.owner = owner;
        let init = initOf JettonWallet(myAddress(), myAddress());
        let data = init.data.beginParse();
        let metadata = newMetadata();
        metadata.set("name", "Default name..".asSlice());
        metadata.set("description", "Jetton default description".asSlice());
        metadata.set("symbol", "JETTON".asSlice());
        self.metadata = metadata;
        self.jetton_wallet_code = init.code;
        self.jetton_wallet_system = data.loadRef();
    }

    receive(msg: JettonInit){
        self.requireOwner();
        nativeThrowIf(ERROR_JETTON_INITIALIZED, self.deployed);
        nativeThrowUnless(ERROR_CODE_INVALID_AMOUNT, msg.max_supply > 0); // Reject invalid max supply

        self.metadata.set("name", msg.jetton_name);
        self.metadata.set("description", msg.jetton_description);
        self.metadata.set("symbol", msg.jetton_symbol);
        self.max_supply = msg.max_supply;
        self.notify(JettonInitOk{query_id: msg.query_id}.toCell());
        self.deployed = true;
    }

    receive(msg: JettonSetParameter){
        self.requireOwner();
        if (msg.key == "max_supply") {
            let new_supply = msg.value.loadCoins();
            nativeThrowUnless(ERROR_CODE_INVALID_AMOUNT, new_supply > 0); // Reject invalid max supply
            
            self.max_supply = new_supply;
            return;
        }
        self.metadata.set(msg.key, msg.value);
    }

    receive(msg: JettonMint){
        nativeThrowUnless(ERROR_CODE_INVALID_AMOUNT, msg.amount > 0); // Reject mint with amount <= 0
        self.requireOwner();

        nativeThrowIf(ERROR_MAX_SUPPLY_EXCEEDED, (self.current_supply + msg.amount) > self.max_supply);
        let init = self.discover_wallet_state_init(myAddress(), msg.destination);
        let to = contractAddress(init);
        send(SendParameters{
                to: to,
                value: 0,
                mode: SendRemainingValue,
                code: init.code,
                data: init.data,
                bounce: true,
                body: JettonTransferInternal{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    from: myAddress(),
                    response_destination: msg.destination,
                    forward_ton_amount: 0,
                    forward_payload: emptySlice()
                }.toCell()
            }
        );
        self.current_supply += msg.amount;
    }

    bounced(msg: bounced<JettonTransferInternal>){
        self.current_supply -= msg.amount;
    }

    // Returns wallet system cell (Tact lang feature)
    get fun get_tact_system_cell(): Cell {
        return self.jetton_wallet_system;
    }
}