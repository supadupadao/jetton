import "../teps/tep74.tact";

@interface("org.ton.jetton.wallet")
contract JettonWallet with TEP74JettonWallet {
    master: Address;
    owner: Address;
    jetton_wallet_code: Cell;
    jetton_wallet_system: Cell;
    balance: Int = 0;
    init(master: Address, owner: Address){
        self.master = master;
        self.owner = owner;
        let init = initOf JettonWallet(master, master);
        let data = init.data.beginParse();
        self.jetton_wallet_code = init.code;
        self.jetton_wallet_system = data.loadRef();
    }
}