import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Builder, Slice, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
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

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.address));
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
                jetton_name: JETTON_NAME,
                jetton_description: JETTON_DESCRIPTION,
                jetton_symbol: JETTON_SYMBOL,
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
                forward_payload: new Builder().asSlice(),
                forward_ton_amount: 0n,
                response_destination: other.address,
            }
        );
        expect(transferResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonWallet.address,
            deploy: false,
            success: true,
            op: 0x0f8a7ea5,
        });
        expect(transferResult.transactions).toHaveTransaction({
            from: jettonWallet.address,
            to: otherJettonWallet.address,
            deploy: true,
            success: true,
            op: 0x178d4519,
        });

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337") - toNano("228"));

        let otherJettonWalletData = await otherJettonWallet.getGetWalletData();
        expect(otherJettonWalletData.balance).toEqual(toNano("228"));
    });
});
