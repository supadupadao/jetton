import { Builder, toNano } from '@ton/core';
import { JettonMaster } from '../wrappers/JettonMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonMaster = provider.open(await JettonMaster.fromInit(provider.sender().address!!));

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

    await provider.waitForDeploy(jettonMaster.address);

    await jettonMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'JettonInit',
            query_id: 0n,
            jetton_name: new Builder().storeStringTail('Jetton name').asSlice(),
            jetton_description: new Builder().storeStringTail('Long' + ' long '.repeat(1) + 'description').asSlice(),
            jetton_symbol: new Builder().storeStringTail('SMBL').asSlice(),
            max_supply: toNano(1337),
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
