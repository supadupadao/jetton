import { beginCell, Builder, toNano } from '@ton/core';
import { JettonMaster } from '../wrappers/JettonMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonMaster = provider.open(await JettonMaster.fromInit(provider.sender().address!!, 0n));

    await jettonMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(jettonMaster.address, 100, 5000);

    await jettonMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'JettonInit',
            query_id: 0n,
            jetton_name: beginCell().storeStringRefTail('Jetton name').asSlice(),
            jetton_description: beginCell().storeStringRefTail('Long' + ' long '.repeat(100) + 'description').asSlice(),
            jetton_symbol: beginCell().storeStringRefTail('SMBL').asSlice(),
            max_supply: toNano(1337),
            mint_amount: null
        }
    );
    await jettonMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'JettonMint',
            query_id: 0n,
            destination: provider.sender().address!!,
            amount: toNano("10"),
        }
    );
}
