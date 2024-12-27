import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Address, toNano } from '@ton/core';
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
    let jettonWallet2: SandboxContract<JettonWallet>;

    beforeAll(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        other = await blockchain.treasury("other");

        jettonMaster = blockchain.openContract(await JettonMaster.fromInit(deployer.address));
        jettonWallet = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, deployer.address));
        jettonWallet2 = blockchain.openContract(await JettonWallet.fromInit(jettonMaster.address, other.address));

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

     it('should update jetton master owner', async () => {
            // Jetton name
            const ownerUpdateResult = await jettonMaster.send(
                deployer.getSender(),
                {
                    value: toNano("0.05"),
                },
                {
                    $$type: 'ChangeOwner',
                    queryId: 0n,
                    newOwner: other.address,
                }
            );

            expect(ownerUpdateResult.transactions).toHaveTransaction({
                from: jettonMaster.address,
                to: deployer.address,
                success: true,
                deploy: false,
                //Is OP assigned by the system? can we get it and add it to the test?   
            });
    
            const owner = await jettonMaster.getOwner();
            expect(owner.toRawString()).toEqual(other.address.toRawString());
        });
        
        it('should not mint tokens not owner', async () => {
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
                success: false,
                deploy: false,
                op: 0x133704,
                exitCode: 132,
            });
        });

        it('should mint tokens with new owner', async () => {
            const mintResult = await jettonMaster.send(
                other.getSender(),
                {
                    value: toNano("0.05"),
                },
                {
                    $$type: 'JettonMint',
                    query_id: 0n,
                    amount: toNano("100"),
                    destination: other.address,
                }
            );
            expect(mintResult.transactions).toHaveTransaction({
                from: other.address,
                to: jettonMaster.address,
                success: true,
                deploy: false,
                op: 0x133704,
            });

            expect(mintResult.transactions).toHaveTransaction({
                from: jettonMaster.address,
                to: jettonWallet2.address,
                success: true,
                deploy: true,
                op: 0x178d4519,
            });
    
            let jettonMasterMetadata = await jettonMaster.getGetJettonData();
            expect(jettonMasterMetadata.total_supply).toEqual(toNano("1437"));
    
            let jettonWalletData = await jettonWallet2.getGetWalletData();
            expect(jettonWalletData.balance).toEqual(toNano("100"));
        });

        it('should revoke jetton master owner', async () => {
            const ownerUpdateResult = await jettonMaster.send(
                other.getSender(),
                {
                    value: toNano("0.05"),
                },
                {
                    $$type: 'ChangeOwner',
                    queryId: 0n,
                    newOwner: new Address(0, Buffer.alloc(32)),
                    //Is OP assigned by the system? can we get it and add it to the test?   
                }
            );

            expect(ownerUpdateResult.transactions).toHaveTransaction({
                from: jettonMaster.address,
                to: other.address,
                success: true,
                deploy: false,
            });  

            const owner = await jettonMaster.getOwner(); 
            expect(owner.toRawString()).toEqual(new Address(0, Buffer.alloc(32)).toRawString());
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
});
