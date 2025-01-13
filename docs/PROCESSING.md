# How to process this jetton

ℹ️ This document describes how to build application based on this jetton. If you are looking for guideline how to contribute to this project, please read [this](CONTRIBUTING.md) document

-   [Definitions](#definitions)
-   [Exit codes](#exit-codes)

## Definitions

According to [TON Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) there are actually 2 smart contracts:

-   **Jetton Master** contract that deploys in single copy for your jetton
-   **Jetton Wallet** contract that deploys for each jetton owner

[Read more about jetton architecture on TON](https://docs.ton.org/develop/dapps/asset-processing/jettons#jetton-architecture)

## Exit codes

[Standard Tact exit codes](https://docs.tact-lang.org/book/exit-codes)

<table>
    <tr>
        <th>Code</th>
        <th>Description</th>
    </tr>
    <tr><td colspan=2>Tact lang exit codes</td></tr>
    <tr>
        <td>132</td>
        <td>
            Invalid owner of contract.</br><i>Occurs when sender wallet is not owner of receiver contract when it is required.</i>
        </td>
    </tr>
    <tr><td colspan=2>Custom exit codes</td></tr>
    <tr>
        <td>6901</td>
        <td>No enough TON on contract balance.</td>
    </tr>
    <tr>
        <td>6902</td>
        <td>No enough TON in message</td>
    </tr>
    <tr>
        <td>6903</td>
        <td>
            Jetton already initialized.<br/><i>Occurs when you send <code>0x133701</code> message to jetton that has been already initialized.</i>
        </td>
    </tr>
    <tr>
        <td>6904</td>
        <td>
            Max supply exceeded.</br><i>Occurs when you try mint more tokens than max_supply parameter allow.</i>
        </td>
    </tr>
    <tr>
        <td>6905</td>
        <td>
            Invalid transfer amount.</br><i>Occurs when you try to send, burn or mint 0 tokens.</i>
        </td>
    </tr>
        <tr>
        <td>6906</td>
        <td>
            Minting already disabled.</br><i>Occurs when you attempt to enable minting after it has been permanently disabled.</i>
        </td>
    </tr>
        <tr>
        <td>6907</td>
        <td>
            Minting is disabled.</br><i>Occurs when you try to mint tokens while the minting functionality is disabled.</i>
        </td>
    </tr>
</table>
