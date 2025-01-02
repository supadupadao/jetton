import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, Dictionary, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import { OP_CODES } from './constants/opCodes';

import '@ton/test-utils';

const SYSTEM_CELL = Cell.fromBase64('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');

const JETTON_NAME = "Test jetton";
const JETTON_DESCRIPTION = "Test jetton description. Test jetton description. Test jetton description";
const JETTON_SYMBOL = "TSTJTN";
const JETTON_MAX_SUPPLY = toNano("0");

describe('MaxSupply - Unlimited', () => {
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
                jetton_name: beginCell().storeStringTail(JETTON_NAME).asSlice(),
                jetton_description: beginCell().storeStringTail(JETTON_DESCRIPTION).asSlice(),
                jetton_symbol: beginCell().storeStringTail(JETTON_SYMBOL).asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
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

    

    it('should correct build wallet address', async () => {
        let walletAddressData = await jettonMaster.getGetWalletAddress(deployer.address);
        expect(walletAddressData.toString()).toEqual(jettonWallet.address.toString());

        let otherWalletAddressData = await jettonMaster.getGetWalletAddress(other.address);
        expect(otherWalletAddressData.toString()).toEqual(otherJettonWallet.address.toString());
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
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonInit,
            exitCode: 6903,
        });
    });

    it('should mint tokens', async () => {

        // mint tokens with unlimited supply
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
            op: 0x178d4519,
        });

        let jettonMasterMetadata = await jettonMaster.getGetJettonData();
        expect(jettonMasterMetadata.total_supply).toEqual(toNano("1337"));

        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(toNano("1337"));
    });


    it('should fail to set max supply less than the current supply', async () => { 
        
          // set max_supply to 1337
          const maxSupplyUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: beginCell().storeCoins(toNano("1337")).asSlice()
            }
        );
            expect(maxSupplyUpdateResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: jettonMaster.address,
                success: true,
                deploy: false,
                op: OP_CODES.JettonSetParameter,
            });

        //mint 1337 tokens
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


        // try to set the max_supply to 1330, less than current supply
        const maxSupplyUpdateResult2 = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: beginCell().storeCoins(toNano("1330")).asSlice()
            }
        );
        expect(maxSupplyUpdateResult2.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
            exitCode: 6905,
        });
     
    });


    it('should set max supply and hit the mint limit JettonSetParameter', async () => { 
        //set max_supply to 100
        const maxSupplyUpdateResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: beginCell().storeCoins(toNano("100")).asSlice()
            }
        );
        expect(maxSupplyUpdateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
        });

        //try to mint 100 tokens 
        const mintResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonMint',
                query_id: 0n,
                amount: toNano("100"),
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

        //try to mint 100 tokens more and hit max supply limit
        const mintResult2 = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonMint',
                query_id: 0n,
                amount: toNano("100"),
                destination: deployer.address,
            }
        );
        expect(mintResult2.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonMint,
            exitCode: 6904,
        });


        //try to set max supply to 10, less than current supply
        const maxSupplyUpdateResult2 = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: beginCell().storeCoins(toNano("10")).asSlice()
            }
        );
        expect(maxSupplyUpdateResult2.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: false,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
            exitCode: 6905
        });

        //set max_supply to 200 
        const maxSupplyUpdateResult3 = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonSetParameter',
                key: "max_supply",
                value: beginCell().storeCoins(toNano("200")).asSlice()
            }
        );
        expect(maxSupplyUpdateResult3.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonSetParameter,
        });


        // try to mint 100 tokens more
        const mintResult3 = await jettonMaster.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: 'JettonMint',
                query_id: 0n,
                amount: toNano("100"),
                destination: deployer.address,
            }
        );
        expect(mintResult3.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            success: true,
            deploy: false,
            op: OP_CODES.JettonMint,
        });     
    });

    it('should return system cell', async () => {
        let systemCell = await jettonMaster.getTactSystemCell();
        expect(systemCell).toEqualCell(SYSTEM_CELL);
    });
    
});
