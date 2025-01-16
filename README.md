# TON Jetton contract on Tact

[![Build status](https://img.shields.io/github/actions/workflow/status/supadupadao/jetton/ci.yml?label=CI)](https://github.com/supadupadao/jetton/actions/workflows/ci.yml)
[![GitHub License](https://img.shields.io/github/license/supadupadao/jetton)](https://github.com/supadupadao/jetton/blob/master/LICENSE)
[![TON](https://img.shields.io/badge/blockchain-TON-0098EA)](https://ton.org)
[![Tact](https://img.shields.io/badge/lang-Tact-000000)](https://github.com/tact-lang/tact)
[![Work in progress](https://img.shields.io/badge/WORK%20IN%20PROGRESS-DO%20NOT%20USE%20IN%20PRODUCTION-ff0000)](https://github.com/supadupadao/jetton/issues)

ℹ️ Implementation of Jetton standard for The Open Network written in Tact language

⚠️ <b>Warning!</b> This contract is not 100% tested and I would not recommend using it in production yet.

❤️ I'll be very grateful for any kind of contribution: code, docs, issues, bug reports, github stars or whatever

# Features overview

This project implements TON Jetton standard with following TEPs:

-   [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md) - Token Data Standard
-   [TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) - Fungible tokens (Jettons) standard
-   [TEP-89](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md) - Discoverable Jettons Wallets

TEPs logic isolated in corresponding Tact Traits in `contracts/teps` directory.

## On-Chain metadata

Smart contract code allows to store fully decentralized it means that full token metadata is stored on-chain. Also contract ABI has handlers for flexible managing metadata parameters

# Docs

[Read our docs in Gitbook](https://docs.supadupa.space/jetton)

# Development

## Prerequisites

To work with project locally you will need [Node.js](https://nodejs.org/en) version 22+. Clone this repo and run the following command to install dependencies

```
npm i
```

## How to build contract

The following command will compile contract source code. TVM byte code files will be stored in `build/` directory.

```
npm run build
```

## All allowed commands

-   `npm run build` - build project and compile contracts
-   `npm test` - run contracts tests
-   `npx blueprint run` - execute script from `/scripts` directory

# How can i contribute?

We are very appreciate if you want to contribute. Please read out [contributing guideline](docs/CONTRIBUTING.md) document.

If something was unclear in this document please [open issue](https://github.com/supadupadao/jetton/issues) and we will help you.

# How can i process it?

If you want to build application that uses this jetton, read our [development guideline](docs/DEVELOPMENT.md). It describes interaction ways with this jetton.

If something was unclear in this document please [open issue](https://github.com/supadupadao/jetton/issues) and we will help you.

# License

[MIT](https://opensource.org/license/mit)
