// https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

import "@stdlib/ownable";
import "./tep64.tact";
import "../messages.tact";
import "../errors.tact";
import "../consts.tact";
struct JettonMasterData {
    total_supply: Int;
    mintable: Bool;
    owner: Address;
    jetton_content: Cell;
    jetton_wallet_code: Cell;
}
// TON jetton standard. Trait for jetton master
trait TEP74JettonMaster with TEP64Metadata {
    // Maximum tokens can be minted
    max_supply: Int;
    // Current tokens minted
    current_supply: Int;
    // Administrator of token. Who can mint new tokens
    owner: Address;
    // Initial code of jetton wallet
    jetton_wallet_code: Cell;
    // System cell of jetton wallet contract (Tact feature)
    jetton_wallet_system: Cell;

    get fun get_jetton_data(): JettonMasterData {
        return
            JettonMasterData{
                total_supply: self.current_supply,
                mintable: (self.max_supply - self.current_supply) > 0,
                owner: self.owner,
                jetton_content: self.jetton_master_metadata(),
                jetton_wallet_code: self.jetton_wallet_code
            };
    }

    get fun get_wallet_address(owner: Address): Address {
        let data = beginCell().storeRef(self.jetton_wallet_system).storeUint(0, 1).storeAddress(myAddress()
        ).storeAddress(owner).endCell();
        let init = StateInit{code: self.jetton_wallet_code, data: data};
        return contractAddress(init);
    }
}
struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    code: Cell;
}
trait TEP74JettonWallet with Ownable {
    const GAS_CONSUMPTION: Int = ton("0.01");
    const MIN_BALANCE: Int = ton("0.01");
    master: Address;
    owner: Address;
    code: Cell;
    balance: Int;

    fun packJettonWalletData(master: Address, owner: Address, code: Cell): Cell {
        return beginCell().storeAddress(master).storeAddress(owner).storeRef(code).endCell();
    }

    fun calculateJettonWalletStateInit(master: Address, owner: Address, code: Cell): Cell {
        return
            beginCell().storeUint(0, 2).storeRef(code).storeRef(self.packJettonWalletData(master, owner, code)
            ).storeUint(0, 1).endCell();
    }

    fun calculateJettonWalletAddress(stateInit: Cell): Slice {
        return beginCell().storeUint(4, 3).storeInt(0, 8).storeUint(stateInit.hash(), 256).endCell().beginParse();
    }

    fun calculateUserJettonWalletAddress(master: Address, owner: Address, code: Cell): Slice {
        return self.calculateJettonWalletAddress(self.calculateJettonWalletStateInit(master, owner, code));
    }

    receive(msg: JettonTransfer){
        let ctx = context();
        self.requireOwner();
        self.balance = self.balance - msg.amount;
        nativeThrowUnless(ERROR_CODE_NOT_ENOUGH_BALANCE, self.balance >= 0);
        nativeThrowUnless(ERROR_CODE_NEED_FEE,
            ((((ctx.readForwardFee() * 2) + (2 * self.GAS_CONSUMPTION)) + self.MIN_BALANCE) + msg.forward_ton_amount) <
                ctx.value
        );
        /*
        master: Address;
        owner: Address;
        code: Cell;
        balance: Int = 0;
        */
        let data = self.packJettonWalletData(self.master, msg.destination, self.code);
        let to = self.calculateUserJettonWalletAddress(self.master, msg.destination, self.code);
        send(SendParameters{
                to: to.loadAddress(),
                value: 0,
                mode: SendRemainingValue,
                // bounce: true,
                code: self.code,
                data: data,
                body: JettonTransferInternal{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    from: self.owner,
                    response_destination: msg.response_destination,
                    forward_ton_amount: msg.forward_ton_amount,
                    forward_payload: msg.forward_payload
                }.toCell()
            }
        );
    }

    receive(msg: JettonTransferInternal){
        let ctx = context();
        if (ctx.sender != self.master) {
            let init = StateInit{
                code: self.code,
                data: beginCell().storeAddress(self.master).storeAddress(msg.from).endCell()
            };
            nativeThrowUnless(ERROR_CODE_INVALID_OWNER, contractAddress(init) == ctx.sender);
        }
        self.balance = self.balance + msg.amount;
        nativeThrowUnless(ERROR_CODE_NOT_ENOUGH_BALANCE, self.balance >= 0);
        let msgValue: Int = ctx.value;
        msgValue =
            (msgValue - self.GAS_CONSUMPTION) - (self.MIN_BALANCE - min(self.MIN_BALANCE, myBalance() - ctx.value));
        if (msg.forward_ton_amount > 0) {
            msgValue = (msgValue - msg.forward_ton_amount) - ctx.readForwardFee();
            send(SendParameters{
                    to: self.owner,
                    value: msg.forward_ton_amount,
                    mode: SendPayGasSeparately,
                    bounce: false,
                    body: JettonTransferNotification{
                        query_id: msg.query_id,
                        amount: msg.amount,
                        sender: msg.from,
                        forward_payload: msg.forward_payload
                    }.toCell()
                }
            );
        }
        if (msgValue > 0) {
            send(SendParameters{
                    to: msg.response_destination,
                    bounce: false,
                    value: msgValue,
                    mode: SendIgnoreErrors,
                    body: Excesses{query_id: msg.query_id}.toCell()
                }
            );
        }
    }

    bounced(src: bounced<JettonTransferInternal>){
        self.balance = self.balance + src.amount;
    }

    receive(msg: JettonBurn){
        let ctx = context();
        self.requireOwner();
        nativeThrowUnless(ERROR_CODE_NEED_FEE,
            ctx.value > ((self.GAS_CONSUMPTION + self.GAS_CONSUMPTION) + ctx.readForwardFee())
        );
        self.balance = self.balance - msg.amount;
        nativeThrowUnless(ERROR_CODE_NOT_ENOUGH_BALANCE, self.balance >= 0);
        send(SendParameters{
                to: self.master,
                value: 0,
                bounce: true,
                mode: SendRemainingValue,
                body: JettonBurnInternal{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    sender: self.owner,
                    response_destination: msg.response_destination
                }.toCell()
            }
        );
    }

    bounced(src: bounced<JettonBurnInternal>){
        self.balance = self.balance + src.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{balance: self.balance, owner: self.owner, master: self.master, code: self.code};
    }
}