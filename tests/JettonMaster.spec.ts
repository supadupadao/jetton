import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, Dictionary, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import { OP_CODES , SYSTEM_CELL, ERROR_CODES} from './constants/constants';

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

        const deployResult = await jettonMaster.send(
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
                mint_amount: null
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: true,
            op: OP_CODES.JettonInit,
        });
        expect(deployResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonInitOk,
        });
    });

    it('should mint multiple jettons per wallet', async () => {
        const jettonMasterSameNonce = blockchain.openContract(await JettonMaster.fromInit(deployer.address, 0n));;
        expect(jettonMasterSameNonce.address).toEqualAddress(jettonMaster.address);

        const jettonMasterDiffNonce = blockchain.openContract(await JettonMaster.fromInit(deployer.address, 1n));;
        expect(jettonMasterDiffNonce.address).not.toEqualAddress(jettonMaster.address);
    });

    it('should handle big strings', async () => {
        const LONG_JETTON_NAME = JETTON_NAME.repeat(100);
        const LONG_JETTON_DESCRIPTION = JETTON_DESCRIPTION.repeat(20);
        const LONG_JETTON_SYMBOL = JETTON_SYMBOL.repeat(200);

        expect(LONG_JETTON_NAME.length).toBeGreaterThan(1024);
        expect(LONG_JETTON_DESCRIPTION.length).toBeGreaterThan(1024);
        expect(LONG_JETTON_SYMBOL.length).toBeGreaterThan(1024);

        const otherJettonMaster = blockchain.openContract(await JettonMaster.fromInit(other.address, 0n));
        await otherJettonMaster.send(
            other.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        const deployResult = await otherJettonMaster.send(
            other.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonInit',
                query_id: 0n,
                jetton_name: beginCell().storeStringRefTail(LONG_JETTON_NAME).asCell().asSlice(),
                jetton_description: beginCell().storeStringRefTail(LONG_JETTON_DESCRIPTION).asCell().asSlice(),
                jetton_symbol: beginCell().storeStringRefTail(LONG_JETTON_SYMBOL).asCell().asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
                mint_amount: null
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: other.address,
            to: otherJettonMaster.address,
            success: true,
            op: OP_CODES.JettonInit,
        });
        expect(deployResult.transactions).toHaveTransaction({
            from: otherJettonMaster.address,
            to: other.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonInitOk,
        });
        let metadataResult = await otherJettonMaster.getGetJettonData();
        let jettonContent = metadataResult.jetton_content.beginParse();
        expect(jettonContent.loadUint(8)).toEqual(0);
        let metadataDict = jettonContent.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        expect(
            metadataDict.get(59089242681608890680090686026688704441792375738894456860693970539822503415433n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringRefTail(LONG_JETTON_NAME).endCell()
        );
        expect(
            metadataDict.get(82961397245523513629401799123410942652413991882008909918554405086738284660097n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringRefTail(LONG_JETTON_SYMBOL).endCell()
        );
        expect(
            metadataDict.get(90922719342317012409671596374183159143637506542604000676488204638996496437508n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringRefTail(LONG_JETTON_DESCRIPTION).endCell()
        );
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

        // Parse jetton metadata
        let jettonContent = jettonMasterMetadata.jetton_content.beginParse();
        expect(jettonContent.loadUint(8)).toEqual(0);
        let metadataDict = jettonContent.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        expect(
            metadataDict.get(59089242681608890680090686026688704441792375738894456860693970539822503415433n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(JETTON_NAME).endCell()
        );
        expect(
            metadataDict.get(82961397245523513629401799123410942652413991882008909918554405086738284660097n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(JETTON_SYMBOL).endCell()
        );
        expect(
            metadataDict.get(90922719342317012409671596374183159143637506542604000676488204638996496437508n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(JETTON_DESCRIPTION).endCell()
        );

        // expect(jettonMasterMetadata.jetton_wallet_code); // TODO validate wallet code
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
                jetton_name: beginCell().storeStringTail(JETTON_NAME).asSlice(),
                jetton_description: beginCell().storeStringTail(JETTON_DESCRIPTION).asSlice(),
                jetton_symbol: beginCell().storeStringTail(JETTON_SYMBOL).asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
                mint_amount: null
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonInit,
            exitCode: ERROR_CODES.JettonInitialized,
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
                jetton_name: beginCell().storeStringTail(JETTON_NAME).asSlice(),
                jetton_description: beginCell().storeStringTail(JETTON_DESCRIPTION).asSlice(),
                jetton_symbol: beginCell().storeStringTail(JETTON_SYMBOL).asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
                mint_amount: null
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: other.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonInit,
            exitCode: ERROR_CODES.InvalidOwner,
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
                key: "name",
                value: beginCell().storeStringTail(UPDATED_JETTON_NAME).asSlice()
            }
        );
        expect(nameUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
        });

        // Jetton description
        const descriptionUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "description",
                value: beginCell().storeStringTail(UPDATED_JETTON_DESCRIPTION).asSlice()
            }
        );
        expect(descriptionUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
        });

        // Jetton symbol
        const symbolUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "symbol",
                value: beginCell().storeStringTail(UPDATED_JETTON_SYMBOL).asSlice()
            }
        );
        expect(symbolUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
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
                value: beginCell().storeCoins(UPDATED_JETTON_MAX_SUPPLY).asSlice()
            }
        );
        expect(maxSupplyUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
            exitCode: ERROR_CODES.InvalidAmount
        });

        // Checks
        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.mintable).toEqual(true); 

        let jettonContent = jettonMasterMetadata.jetton_content.beginParse();
        expect(jettonContent.loadUint(8)).toEqual(0);
        
        let metadataDict = jettonContent.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        expect(
            metadataDict.get(59089242681608890680090686026688704441792375738894456860693970539822503415433n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(UPDATED_JETTON_NAME).endCell()
        );
        expect(
            metadataDict.get(82961397245523513629401799123410942652413991882008909918554405086738284660097n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(UPDATED_JETTON_SYMBOL).endCell()
        );
        expect(
            metadataDict.get(90922719342317012409671596374183159143637506542604000676488204638996496437508n)
        ).toEqualCell(
            beginCell().storeUint(0, 8).storeStringTail(UPDATED_JETTON_DESCRIPTION).endCell()
        );
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
            op: OP_CODES.JettonMint,
        });
        expect(mintResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: jettonWallet.address,
            success: true,
            deploy: true,
            op: OP_CODES.JettonTransferInternal,
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
            op: OP_CODES.JettonMint,
            exitCode: ERROR_CODES.InvalidOwner,
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
            op: OP_CODES.ProvideWalletAddress,
        });
        expect(discoverResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: OP_CODES.TakeWalletAddress,
            body: beginCell()
                .storeUint(OP_CODES.TakeWalletAddress, 32)
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
            op: OP_CODES.ProvideWalletAddress,
        });
        expect(discoverResult.transactions).toHaveTransaction({
            from: jettonMaster.address,
            to: deployer.address,
            success: true,
            deploy: false,
            op: OP_CODES.TakeWalletAddress,
            body: beginCell()
                .storeUint(OP_CODES.TakeWalletAddress, 32)
                .storeUint(0, 64)
                .storeAddress(otherJettonWallet.address)
                .storeAddress(other.address)
                .endCell()
        });
    });

    it('should return system cell', async () => {
        let systemCell = await jettonMaster.getTactSystemCell();
        expect(systemCell).toEqualCell(SYSTEM_CELL);
    });
    
});
