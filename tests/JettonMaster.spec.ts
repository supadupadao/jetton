import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import '@ton/test-utils';

const SYSTEM_CELL = Cell.fromBase64('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');

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
            op: 0x133701,
        });
        expect(deployResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: 0x133702,
        });
    });

    it('should correct build wallet address', async () => {
        let walletAddressData = await jettonMaster.getGetWalletAddress(deployer.address);
        expect(walletAddressData.toString()).toEqual(jettonWallet.address.toString());

        let otherWalletAddressData = await jettonMaster.getGetWalletAddress(other.address);
        expect(otherWalletAddressData.toString()).toEqual(otherJettonWallet.address.toString());
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
            op: 0x133701,
            exitCode: 6903,
        });
    });

    it('should not double init', async () => {
        const deployResult = await jettonMaster.send(
            other.getSender(),
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
            from: other.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: 0x133701,
            exitCode: 132,
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
            op: 0x133703,
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
            op: 0x133703,
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
            op: 0x133703,
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
            op: 0x133703,
        });

        // Checks
        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.mintable).toEqual(false);
        // TODO metadata
    });

    it('should mint tokens', async () => {
        const mintResult = await jettonMaster.send(
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
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: 0x133704,
        });
        expect(mintResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: jettonWallet.address,
            success: true,
            deploy: true,
            op: 0x178d4519,
        });

        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.total_supply).toEqual(toNano("1337"));

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });

    it('should not mint tokens not owner', async () => {
        const mintResult = await jettonMaster.send(
            other.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonMint',
                query_id: 0n,
                amount: toNano("1337"),
                destination: other.address,
            }
        );
        expect(mintResult.transactions).toHaveTransaction({
            from: other.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: 0x133704,
            exitCode: 132,
        });
    });

    it('should discover address', async () => {
        let discoverResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'ProvideWalletAddress',
                query_id: 0n,
                owner_address: other.address,
                include_address: false,
            }
        );
        expect(discoverResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: 0x2c76b973,
        });
        expect(discoverResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: 0xd1735400,
            body: beginCell()
                .storeUint(0xd1735400, 32)
                .storeUint(0, 64)
                .storeAddress(otherJettonWallet.address)
                .storeAddress(null)
                .endCell()
        });
    });

    it('should discover include address', async () => {
        let discoverResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'ProvideWalletAddress',
                query_id: 0n,
                owner_address: other.address,
                include_address: true,
            }
        );
        expect(discoverResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: 0x2c76b973,
        });
        expect(discoverResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: 0xd1735400,
            body: beginCell()
                .storeUint(0xd1735400, 32)
                .storeUint(0, 64)
                .storeAddress(otherJettonWallet.address)
                .storeAddress(other.address)
                .endCell()
        });
    });

    it('should return system cell', async () => {
        let systemCell = await jettonMaster.getGetTactSystemCell();
        expect(systemCell).toEqualCell(SYSTEM_CELL);
    });
});
