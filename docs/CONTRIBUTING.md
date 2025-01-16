# How to contribute to Jetton

❤️ It's great that you are interested! Thank you for investing your time in this project!

📖 This document is guideline for contributing to this repo. If you are looking for "How to work with jetton" please follow [this](DEVELOPMENT.md) document

ℹ️ The following text is mostly guideline and not rule. Use your best judgment, and feel free to propose changes to this document in a pull request.

-   [How can i contribute](#how-can-i-contrubute)
    -   [Reporting bugs](#reporting-bugs)
    -   [Enhancements proposal](#enhancements-proposal)
    -   [Code contribution](#code-contribution)
        -   [How to build smart contract](#how-to-build-smart-contract)
        -   [How to run tests](#how-to-run-tests)
        -   [Project structure](#project-structure)

## How can i contrubute

### Reporting bugs

We are tracking bugs in [GitHub issues](https://github.com/supadupadao/jetton/issues). If you found an bug, open new issue with "bug" label.

If you think you found vulnerabilty or security related issue, do not open issue, [create vulnerability report](https://github.com/supadupadao/jetton/security).

### Enhancements proposal

We are tracking feature suggestions in [GitHub issues](https://github.com/supadupadao/jetton/issues). if you want to propose new feature, feel free to open issue with "enhancement" label.

### Code contribution

To work with application locally you will need [Node.js](https://nodejs.org/) version 22+.

Here is a list of used dependencies in project:

-   [Tact Lang](https://tact-lang.org) - programming language for TON Blockchain, we using it for writting smart contract code
-   [Typescript](https://www.typescriptlang.org) - programming language we using for testing and scripting smart contracts
-   [Jest](https://jestjs.io) - testing framework
-   [Prettier](https://prettier.io) - for code formatting
-   [Blueprint](https://github.com/ton-org/blueprint) - development environment for TON blockchain for writing, testing, and deploying smart contracts
-   [TON Sandbox](https://github.com/ton-org/sandbox) - local TON emulator we are using for testing smart contract

#### How to build smart contract

```sh
npx blueprint build
```

#### How to run tests

```sh
npx blueprint test
```

#### Project structure

-   `contracts` - source code of all the smart contracts
-   -   `jetton` - entrypoints of jetton contracts with dependencies (traits) specified
-   -   -   `master.tact` - jetton master contract entrypoint
-   -   -   `wallet.tact` - jetton wallet contract entrypoint
-   -   `teps` - traits with [TEPs](https://github.com/ton-blockchain/TEPs/) realization
-   -   -   `messages` - API messages for TEP traits
-   -   -   -   `discoverable` - messages related to the tep89 "discoverable" trait
-   -   -   -   `jettonStandard` - messages related to the tep74 jettons standard
-   -   -   `tep64.tact` - trait implementation of [TEP 64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
-   -   -   `tep74.tact` - trait implementation of [TEP 74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
-   -   -   `tep89.tact` - trait implementation of [TEP 89](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md)
-   -   `consts.tact` - project constants
-   -   `errors.tact` - custom project error codes (exit codes)
-   -   `messages.tact` - contracts API messages

## Styleguide

### Git Commit Message

-   Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) commit format
-   Use the present tense ("feat: add feature" not "feat: added feature")
-   Use the imperative mood ("fix: move file to..." not "fix: moves files...")
-   Use lowercase first letter ("docs: update README.md" not "docs: Update README.md")
-   Limit the first line to 72 characters or less
