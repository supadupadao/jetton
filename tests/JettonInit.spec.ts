import { Blockchain, SandboxContract, TreasuryContract  } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import { JettonWallet } from '../build/Jetton/tact_JettonWallet';
import { JettonMaster } from '../build/Jetton/tact_JettonMaster';
import { OP_CODES , SYSTEM_CELL, ERROR_CODES} from './constants/constants';

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

    // handle the init and optional minting
    const initializeJettonMaster = async (mintAmount: bigint | null) => {
        const initValue = mintAmount && mintAmount > 0n ? toNano("1") : toNano("0.05");

        // Send the JettonInit message with the mintAmount
        const deployResult = await jettonMaster.send(
            deployer.getSender(),
            {
                value: initValue,
            },
            {
                $$type: 'JettonInit',
                query_id: 0n,
                jetton_name: beginCell().storeStringTail(JETTON_NAME).asSlice(),
                jetton_description: beginCell().storeStringTail(JETTON_DESCRIPTION).asSlice(),
                jetton_symbol: beginCell().storeStringTail(JETTON_SYMBOL).asSlice(),
                max_supply: JETTON_MAX_SUPPLY,
                mint_amount: mintAmount, // Pass the mint amount as a parameter
            }
        );      
        
        // Verify the deployment transactions
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
    
        // If mintAmount is specified and greater than 0, validate the minting logic
        if (mintAmount && mintAmount > 0n) {
            expect(deployResult.transactions).toHaveTransaction({
                from: jettonMaster.address,
                to: jettonWallet.address,
                deploy: true,
                success: true,
                op: OP_CODES.JettonTransferInternal,
            });
        }
    };

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        other = await blockchain.treasury("other");

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.address));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, deployer.address));
        otherJettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, other.address));
    });


    it('should correct build wallet address', async () => {
        await initializeJettonMaster(10n);

        let walletAddressData = await jettonMaster.getGetWalletAddress(deployer.address);
        expect(walletAddressData.toString()).toEqual(jettonWallet.address.toString());

        let otherWalletAddressData = await jettonMaster.getGetWalletAddress(other.address);
        expect(otherWalletAddressData.toString()).toEqual(otherJettonWallet.address.toString());
    });

    
    it('should not double init', async () => {

        await initializeJettonMaster(null);

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
        await initializeJettonMaster(null);

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

    it('should init with mint tokens', async () => {
        const mint = 120n
        await initializeJettonMaster(mint);
            
        // Fetch updated wallet data and validate balance
        let jettonWalletData = await jettonWallet.getGetWalletData();
        expect(jettonWalletData.balance).toEqual(mint);
    });    

    it('should init with mint and continue minting outside init', async () => {
        const mint = 120n
        await initializeJettonMaster(mint);
            
        // Fetch updated wallet data and validate balance
        let jettonWalletDataBefore = await jettonWallet.getGetWalletData();
        expect(jettonWalletDataBefore.balance).toEqual(mint);


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
            deploy: false,
            op: OP_CODES.JettonTransferInternal,
        });

        let jettonWalletDataAfter = await jettonWallet.getGetWalletData();
        expect(jettonWalletDataAfter.balance).toEqual(mint + toNano("1337"));
    });

    it('should init with mint 0 new jettons (using non-null value)', async () => {
        const mint = 0n;
        await initializeJettonMaster(mint);
    
        try {
            // Attempt to fetch wallet data , since we didnt proceed with mint, account should be inactive
            await jettonWallet.getGetWalletData();

            // If no error is thrown, the test should fail
            throw new Error('Expected an error when accessing a non-active wallet contract');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Trying to run get method on non-active contract');
            } else {
                throw new Error(`Unexpected error type: ${typeof error}`);
            }
        }
    });
    

    it('should return system cell', async () => {
        await initializeJettonMaster(null);

        let systemCell = await jettonMaster.getTactSystemCell();
        expect(systemCell).toEqualCell(SYSTEM_CELL);
    });
    
});
