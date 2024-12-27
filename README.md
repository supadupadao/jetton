# TON Jetton contract on Tact

ℹ️ Jetton implementation for The Open Network written in Tact language. Metadata is fully decentralized, it means that full token metadata is stored on-chain.

⚠️ <b>Warning!</b> This contract is not 100% tested and I would not recommend using it in production yet.

❤️ I'll be very grateful for any kind of contribution: code, docs, issues, bug reports, github stars or whatever

<!-- # Deploy TODO -->

# Development

This is default Tact blueprint project with default commands:

- `npm run build` - build project and compile contracts
- `npm test` - run contracts tests
- `npx blueprint run` - execute script from `/scripts` directory

# Docs

## Project structure

- `contracts` - source code of all the smart contracts
- - `jetton` - entrypoints of jetton contracts with dependencies (traits) specified
- - - `master.tact` - jetton master contract entrypoint
- - - `wallet.tact` - jetton wallet contract entrypoint
- - `teps` - traits with [TEPs](https://github.com/ton-blockchain/TEPs/) realization
- - - `messages` - API messages for TEP traits
- - - - `discoverable` -  messages related to the tep89 "discoverable" trait
- - - - `jettonStandard` -  messages related to the tep74 jettons standard
- - - `tep64.tact` - trait implementation of [TEP 64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
- - - `tep74.tact` - trait implementation of [TEP 74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- - - `tep89.tact` - trait implementation of [TEP 89](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md)
- - `consts.tact` - project constants
- - `errors.tact` - custom project error codes (exit codes)
- - `messages.tact` - contracts API messages

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
</table>
