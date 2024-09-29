// https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

import "@stdlib/ownable";
import "./tep64.tact";
import "./tep89.tact";
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
trait TEP74JettonMaster with TEP64Metadata, DiscoverWalletAddress {
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
    // Jetton name field in metadata
    jetton_name: String;
    // Jetton description field in metadata
    jetton_description: String;
    // Jetton symbol field in metadata
    jetton_symbol: String;

    receive(msg: JettonBurnInternal){
        let ctx = context();
        let init = self.discover_wallet_state_init(myAddress(), msg.sender);
        let wallet_address = contractAddress(init);
        nativeThrowUnless(ERROR_CODE_INVALID_OWNER, ctx.sender == wallet_address);
        send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: msg.toCell()
            }
        );
    }

    get fun get_jetton_data(): JettonMasterData {
        let jetton_content = self.jetton_master_metadata(self.jetton_name, self.jetton_description, self.jetton_symbol);
        return
            JettonMasterData{
                total_supply: self.current_supply,
                mintable: (self.max_supply - self.current_supply) > 0,
                owner: self.owner,
                jetton_content: jetton_content,
                jetton_wallet_code: self.jetton_wallet_code
            };
    }

    get fun get_wallet_address(owner: Address): Address {
        let init = self.discover_wallet_state_init(myAddress(), owner);
        return contractAddress(init);
    }
}
struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    code: Cell;
}
trait TEP74JettonWallet with Ownable, DiscoverWalletAddress {
    const GAS_CONSUMPTION: Int = ton("0.01");
    const MIN_BALANCE: Int = ton("0.01");
    master: Address;
    owner: Address;
    jetton_wallet_code: Cell;
    jetton_wallet_system: Cell;
    balance: Int;

    receive(msg: JettonTransfer){
        let ctx = context();
        self.requireOwner();
        self.balance = self.balance - msg.amount;
        nativeThrowUnless(ERROR_CODE_NOT_ENOUGH_BALANCE, self.balance >= 0);
        nativeThrowUnless(ERROR_CODE_NEED_FEE,
            ((((ctx.readForwardFee() * 2) + (2 * self.GAS_CONSUMPTION)) + self.MIN_BALANCE) + msg.forward_ton_amount) <
                ctx.value
        );
        let init = self.discover_wallet_state_init(self.master, msg.destination);
        let to = contractAddress(init);
        send(SendParameters{
                to: to,
                value: 0,
                mode: SendRemainingValue,
                bounce: true,
                code: init.code,
                data: init.data,
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
            let init = self.discover_wallet_state_init(self.master, msg.from);
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
        return
            JettonWalletData{
                balance: self.balance,
                owner: self.owner,
                master: self.master,
                code: self.jetton_wallet_code
            };
    }
}