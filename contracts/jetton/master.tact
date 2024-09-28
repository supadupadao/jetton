import "@stdlib/deploy";
import "@stdlib/ownable";
import "./wallet.tact";
import "../teps/tep74.tact";
import "../messages.tact";

@interface("org.ton.jetton.master")
contract JettonMaster with TEP74JettonMaster, Deployable, Ownable {
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
    init(owner: Address){
        self.owner = owner;
        let init = initOf JettonWallet(myAddress(), myAddress());
        let data = init.data.beginParse();
        self.jetton_wallet_code = init.code;
        self.jetton_wallet_system = data.loadRef();
    }
}