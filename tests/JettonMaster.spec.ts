import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Builder, Slice, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import '@ton/test-utils';

const JETTON_NAME = "Test jetton";
const JETTON_DESCRIPTION = "Test jetton description. Test jetton description. Test jetton description";
const JETTON_SYMBOL = "TSTJTN";
const JETTON_MAX_SUPPLY = toNano("100500");

const UPDATED_JETTON_NAME = "New test jetton";
const UPDATED_JETTON_DESCRIPTION = "New test jetton description. New test jetton description. New test jetton description";
const UPDATED_JETTON_SYMBOL = "NEWJTN";
const UPDATED_JETTON_MAX_SUPPLY = toNano("0");

describe('JettonMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMaster: SandboxContract<JettonMaster>;
    let jettonWallet: SandboxContract<JettonWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.address));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, deployer.address));

        const deployResult = await jettonMaster.send(
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

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: true,
        });
    });

    it('should correct build wallet address', async () => {
        let walletAddressData = await jettonMaster.getGetWalletAddress(deployer.address);
        expect(walletAddressData.toString()).toEqual(jettonWallet.address.toString());
    });

    it('should return correct jetton metadata', async () => {
        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.mintable).toEqual(true);
        expect(jettonMasterMetadata.owner.toString()).toEqual(deployer.address.toString());
        expect(jettonMasterMetadata.total_supply).toEqual(0n);
        expect(jettonMasterMetadata.jetton_content); // TODO parse metadata cell
        expect(jettonMasterMetadata.jetton_wallet_code); // TODO validate wallet code
    });

    it('should not double init', async () => {
        const deployResult = await jettonMaster.send(
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

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
        });
    });

    it('should update jetton parameters', async () => {
        // Jetton name
        const nameUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "jetton_name",
                value: new Builder().storeStringTail(UPDATED_JETTON_NAME).asSlice()
            }
        );
        expect(nameUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
        });

        // Jetton description
        const descriptionUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "jetton_description",
                value: new Builder().storeStringTail(UPDATED_JETTON_DESCRIPTION).asSlice()
            }
        );
        expect(descriptionUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
        });

        // Jetton symbol
        const symbolUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "jetton_symbol",
                value: new Builder().storeStringTail(UPDATED_JETTON_SYMBOL).asSlice()
            }
        );
        expect(symbolUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
        });

        // Jetton max_supply
        const maxSupplyUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: new Builder().storeCoins(UPDATED_JETTON_MAX_SUPPLY).asSlice()
            }
        );
        expect(maxSupplyUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
        });

        // Checks
        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.mintable).toEqual(false);
        // TODO metadata
    })
});
