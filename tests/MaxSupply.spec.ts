import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, Dictionary, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import { OP_CODES , SYSTEM_CELL , ERROR_CODES } from './constants/constants';

import '@ton/test-utils';

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
            op: OP_CODES.JettonTransferInternal,
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
            exitCode: ERROR_CODES.InvalidAmount,
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
            exitCode: ERROR_CODES.MaxSupplyExceeded,
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
            exitCode: ERROR_CODES.InvalidAmount
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
