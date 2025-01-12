import "@stdlib/deploy";
import "@stdlib/ownable";
import "./wallet.tact";
import "../teps/tep74.tact";
import "../teps/tep89.tact";
import "../messages.tact";
import "../errors.tact";

@interface("org.ton.jetton.master")
contract JettonMaster with TEP74JettonMaster, TEP89JettonDiscoverable, Deployable, OwnableTransferable {
    // Maximum tokens can be minted
    max_supply: Int = 0;
    // Current tokens minted
    current_supply: Int = 0;
    // Is token mintable
    mintable: Bool = true;
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
    
    init(owner: Address, nonce: Int){
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
        
        self.metadata.set("name", msg.jetton_name);
        self.metadata.set("description", msg.jetton_description);
        self.metadata.set("symbol", msg.jetton_symbol);
        self.max_supply = msg.max_supply > 0 ? msg.max_supply : 0;
        self.notify(JettonInitOk{query_id: msg.query_id}.toCell());
        self.deployed = true;


         // Mint tokens during initialization
        if (msg.mint_amount != null && msg.mint_amount!! > 0) {
             // The mint operation
            self.mint(msg.mint_amount!!, self.owner, msg.query_id);
        }
    }

    
    receive(msg: JettonMint) {
        nativeThrowIf(ERROR_CODE_MINTING_DISABLED, !self.mintable); // Reject mint if minting is disabled
        nativeThrowUnless(ERROR_CODE_INVALID_AMOUNT, msg.amount > 0); // Reject mint with amount <= 0
        self.requireOwner();

        // The mint operation
        self.mint(msg.amount, msg.destination, msg.query_id);
    }

    fun mint(amount: Int, destination: Address, query_id: Int) {
        // Ensure the new supply does not exceed the max supply
        if (self.max_supply > 0) {
            nativeThrowIf(ERROR_MAX_SUPPLY_EXCEEDED, (self.current_supply + amount) > self.max_supply);
        }

        // Prepare wallet initialization
        let init = self.discover_wallet_state_init(myAddress(), destination);
        let to = contractAddress(init);

        // Send minting transaction
        send(SendParameters{
            to: to,
            value: 0,
            mode: SendRemainingValue,
            code: init.code,
            data: init.data,
            bounce: true,
            body: JettonTransferInternal{
                query_id: query_id,
                amount: amount,
                from: myAddress(),
                response_destination: destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell()
        });

        // Update the current supply
        self.current_supply += amount;
    }


    receive(msg: JettonSetParameter) {
        self.requireOwner(); // Ensure only the current owner can update parameters
        
        // Update max supply
        if (msg.key == "max_supply") {
            //Cannot set max supply to 0 through this method
            let new_max_supply = msg.value.loadCoins();
            nativeThrowIf(ERROR_CODE_INVALID_AMOUNT, new_max_supply <= self.max_supply);

            self.max_supply = new_max_supply;
            return;
        }else if(msg.key == "mintable"){
            // Once mintable is set to false, it cannot be changed back to true
            nativeThrowIf(ERROR_CODE_MINTING_ALREADY_DISABLED, !self.mintable);

            self.mintable = msg.value.loadBool();
            return;
        }
        
        self.metadata.set(msg.key, msg.value); // Update metadata for other keys
    }


    bounced(msg: bounced<JettonTransferInternal>){
        nativeThrowUnless(ERROR_CODE_INVALID_AMOUNT, msg.amount > 0); // Is this needed? Keeping it for consistency
        self.current_supply -= msg.amount;
    }

    // Returns wallet system cell (Tact lang feature)
    get fun tact_system_cell(): Cell {
        return self.jetton_wallet_system;
    }
}