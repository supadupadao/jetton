import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import { OP_CODES } from './constants/opCodes';
import '@ton/test-utils';

const JETTON_NAME = "Test jetton";
const JETTON_DESCRIPTION = "Test jetton description. Test jetton description. Test jetton description";
const JETTON_SYMBOL = "TSTJTN";
const JETTON_MAX_SUPPLY = toNano("100500");

describe('JettonMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let other: SandboxContract<TreasuryContract>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let jettonWallet: SandboxContract<JettonWallet>;
    let otherJettonWallet: SandboxContract<JettonWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        other = await blockchain.treasury("other");

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.address, 0n));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, deployer.address));
        otherJettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, other.address));

        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonInit',
                query_id: 0n,
                jetton_name: beginCell().storeStringTail(JETTON_NAME).asSlice(),
                jetton_description: beginCell().storeStringTail(JETTON_DESCRIPTION).asSlice(),
                jetton_symbol: beginCell().storeStringTail(JETTON_SYMBOL).asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
            }
        );
        await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonMint',
                query_id: 0n,
                amount: toNano("1337"),
                destination: deployer.address,
            }
        );
    });

    it('should transfer tokens', async () => {
        const transferResult = await jettonWallet.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonTransfer',
                query_id: 0n,
                amount: toNano("228"),
                destination: other.address,
                custom_payload: null,
                forward_payload: beginCell().asSlice(),
                forward_ton_amount: 1n,
                response_destination: other.address,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: false,
            success: true,
            op: OP_CODES.JettonTransfer,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: jettonWallet.address,
            to: otherJettonWallet.address,
            deploy: true,
            success: true,
            op: OP_CODES.JettonTransferInternal,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: otherJettonWallet.address,
            to: other.address,
            op: OP_CODES.JettonTransferNotification,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: otherJettonWallet.address,
            to: other.address,
            success: true,
            op: OP_CODES.Excesses,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337") - toNano("228"));

        let otherJettonWalletData = await otherJettonWallet.getGetWalletData();
        expect(otherJettonWalletData.balance).toEqual(toNano("228"));
    });

    it('should not transfer tokens not owner', async () => {
        const transferResult = await jettonWallet.send(
            other.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonTransfer',
                query_id: 0n,
                amount: toNano("228"),
                destination: other.address,
                custom_payload: null,
                forward_payload: beginCell().asSlice(),
                forward_ton_amount: 0n,
                response_destination: other.address,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: other.address,
            to: jettonWallet.address,
            deploy: false,
            success: false,
            op: OP_CODES.JettonTransfer,
            exitCode: 132,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });

    it('should not transfer tokens not enough amount', async () => {
        const transferResult = await jettonWallet.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonTransfer',
                query_id: 0n,
                amount: toNano("100500"),
                destination: other.address,
                custom_payload: null,
                forward_payload: beginCell().asSlice(),
                forward_ton_amount: 0n,
                response_destination: other.address,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: false,
            success: false,
            op: OP_CODES.JettonTransfer,
            exitCode: 6901,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });

    it('should burn tokens', async () => {
        const transferResult = await jettonWallet.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonBurn',
                query_id: 0n,
                amount: toNano("1337"),
                response_destination: deployer.address,
                custom_payload: null,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: false,
            success: true,
            op: OP_CODES.JettonBurn,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: jettonWallet.address,
            to: jettonMaster.address,
            deploy: false,
            success: true,
            op: OP_CODES.JettonBurnInternal,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            deploy: false,
            success: true,
            op: OP_CODES.JettonBurnInternal,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("0"));
    });

    it('should not burn tokens not owner', async () => {
        const transferResult = await jettonWallet.send(
            other.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonBurn',
                query_id: 0n,
                amount: toNano("228"),
                response_destination: deployer.address,
                custom_payload: null,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: other.address,
            to: jettonWallet.address,
            deploy: false,
            success: false,
            op: OP_CODES.JettonBurn,
            exitCode: 132,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });

    it('should not burn tokens not enough amount', async () => {
        const transferResult = await jettonWallet.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonBurn',
                query_id: 0n,
                amount: toNano("100500"),
                response_destination: deployer.address,
                custom_payload: null,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: false,
            success: false,
            op: OP_CODES.JettonBurn,
            exitCode: 6901,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });
});
