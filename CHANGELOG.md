# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.8.0](https://github.com/finn-wa/grocy-trolley/compare/v2.7.0...v2.8.0) (2022-07-16)

### Features

- add grocy product barcode api ([0d48fdb](https://github.com/finn-wa/grocy-trolley/commit/0d48fdb843708bd8107f826d4b8ba8e15e3f0cfe))
- interactive grocer product/store search ([cb32037](https://github.com/finn-wa/grocy-trolley/commit/cb32037cbba0c1a329433ca1833d851dbb6060bf))

### Bug Fixes

- catch duplicate unit quanitity conversion error (closes [#100](https://github.com/finn-wa/grocy-trolley/issues/100)) ([dbfb0c0](https://github.com/finn-wa/grocy-trolley/commit/dbfb0c088d237d94069bdeed3a0b037235fbdd56))
- fix Grocy patchProduct bug (closes [#67](https://github.com/finn-wa/grocy-trolley/issues/67)) ([39c6603](https://github.com/finn-wa/grocy-trolley/commit/39c6603618fc7f6ce349194ed8080659b94cf893))
- fix shopping list type (note can be nullable) ([68b73fa](https://github.com/finn-wa/grocy-trolley/commit/68b73fac514a573a7efa514ae984e0c64e3de8d6))
- fix up product parsing ([66b5196](https://github.com/finn-wa/grocy-trolley/commit/66b5196b050b3ec6f4e5f2054ede2a09b3d79297))
- fixes for schemas and types ([9290299](https://github.com/finn-wa/grocy-trolley/commit/92902994e66e8693035bd033387fda2ccc354f80))
- improve error handling in rest service ([5ad8c67](https://github.com/finn-wa/grocy-trolley/commit/5ad8c67d33007c21b548578a230422a66ed5671b))

## [2.7.0](https://github.com/finn-wa/grocy-trolley/compare/v2.6.0...v2.7.0) (2022-07-16)

### Features

- add novel and highly optimised getEnvVar function 😎 ([e4290f1](https://github.com/finn-wa/grocy-trolley/commit/e4290f107757808906636b01cc8e9bf388e8870d))
- set up grocer user agent for export feature ([#90](https://github.com/finn-wa/grocy-trolley/issues/90)) ([dd34021](https://github.com/finn-wa/grocy-trolley/commit/dd34021e35b160ddffda44fdeae7371025974bea))

### Bug Fixes

- fix grocer search service, add schema ([b5802fb](https://github.com/finn-wa/grocy-trolley/commit/b5802fba74911d077370fb0ed64c785f7ef506b7))
- fix lint issues and upgrade packages ([7b9a804](https://github.com/finn-wa/grocy-trolley/commit/7b9a80469b07a939c2687ad2115aaeb537ac8935))
- unsure why I went down the playwright road for that ([7b54883](https://github.com/finn-wa/grocy-trolley/commit/7b54883732ec78ad3d49f2401d2a70a03ae73870))

## [2.6.0](https://github.com/finn-wa/grocy-trolley/compare/v2.5.0...v2.6.0) (2022-07-16)

### Features

- add schema to FoodstuffsCart stuff ([4aa65e0](https://github.com/finn-wa/grocy-trolley/commit/4aa65e0b20a942d75829d6b73e553c2e78d76602))
- some stuff for countdown receipt import ([74c8f17](https://github.com/finn-wa/grocy-trolley/commit/74c8f17290bb2d660eeade213513490f103944aa))

### Bug Fixes

- update taggun types ([acd79e2](https://github.com/finn-wa/grocy-trolley/commit/acd79e2e6beb0aba1ecc70ccba7ac1f1c7185563))

## [2.5.0](https://github.com/finn-wa/grocy-trolley/compare/v2.4.0...v2.5.0) (2022-07-16)

### Features

- add countdown rest service ([03acb1c](https://github.com/finn-wa/grocy-trolley/commit/03acb1c8f65ad0d3ab6090205dd5c4a48a1004c5))
- add JSON Type Def generators and some countdown services ([0b6336f](https://github.com/finn-wa/grocy-trolley/commit/0b6336fa03f9c45bedc8093a722da37970006c18))
- improve generator and typechecks ([031f597](https://github.com/finn-wa/grocy-trolley/commit/031f597dafc82886c4c4b1da6ecb6ecd57fc7085))
- reconfigure rest service for ajv integration ([5f831e2](https://github.com/finn-wa/grocy-trolley/commit/5f831e2a72a68482b6d69274c9db73680d55be7e))
- Some snapshot stuff... might use JSON TypeDef instead ([720aafd](https://github.com/finn-wa/grocy-trolley/commit/720aafd7630e5c2aaa6d04f98a01d3260085cbe2))

### Bug Fixes

- fix jtd-infer bug ([6e8d427](https://github.com/finn-wa/grocy-trolley/commit/6e8d4270baee5cc48410e7751d638f66257f0061))

## [2.4.0](https://github.com/finn-wa/grocy-trolley/compare/v2.3.0...v2.4.0) (2022-07-16)

### Features

- allow undefined env vars ([841300c](https://github.com/finn-wa/grocy-trolley/commit/841300cfdfc5a4beda7301c523080b3b86b23714))
- specify required vars ([d5a2739](https://github.com/finn-wa/grocy-trolley/commit/d5a2739add20d0372f66afe6288642eb84b64d1d))

## [2.3.0](https://github.com/finn-wa/grocy-trolley/compare/v2.2.0...v2.3.0) (2022-07-16)

### Features

- add input-file option for import receipt command ([6fe19c4](https://github.com/finn-wa/grocy-trolley/commit/6fe19c45fad18eb14c45b50d36388c6ce318746d))
- add stock command to CLI and add cart as a stock source ([800a85c](https://github.com/finn-wa/grocy-trolley/commit/800a85c2529f1e8c864e2aea0daebbfb6fac9e2a))
- prompt-based search ([a6d5a49](https://github.com/finn-wa/grocy-trolley/commit/a6d5a49dfd7b605a2450cf35184c78c2889f2fe1))

### Bug Fixes

- fix bug, add lint script ([1e34819](https://github.com/finn-wa/grocy-trolley/commit/1e34819fc76caea9d53221dd040cf9cb07b2ab62))
- fix ESLint issues ([23b86c8](https://github.com/finn-wa/grocy-trolley/commit/23b86c81b1a67093e8012f1aa94abe458c8402c1))
- fix longstanding list bug (closes [#53](https://github.com/finn-wa/grocy-trolley/issues/53)) and add unit tests for list service ([c91b017](https://github.com/finn-wa/grocy-trolley/commit/c91b01706dba8bf90e36b1dfa5e130527e1a2ac8))
- handle discrepancy between list and cart products in metadata (closes [#43](https://github.com/finn-wa/grocy-trolley/issues/43)) ([6532f89](https://github.com/finn-wa/grocy-trolley/commit/6532f896729178eea950b872789561829ef11eac))

## [2.2.0](https://github.com/finn-wa/grocy-trolley/compare/v2.1.1...v2.2.0) (2022-07-16)

### Features

- allow search service to search without credentials ([b2e4dc7](https://github.com/finn-wa/grocy-trolley/commit/b2e4dc75b893e52aaae12833576f07d7bf0590bf))
- extend launch options, add test file for cart ([14089b6](https://github.com/finn-wa/grocy-trolley/commit/14089b652d0218cccb3bbf1ed58061bc92871475))
- fun with types in env.ts, search without credentials, allow multiselect for shop (partially addresses [#10](https://github.com/finn-wa/grocy-trolley/issues/10)) ([a693ef8](https://github.com/finn-wa/grocy-trolley/commit/a693ef8f46f8fc766004b038be8956b7d0acfbfd))
- general clean up, allow env path override ([ef7236a](https://github.com/finn-wa/grocy-trolley/commit/ef7236a7f1fe64b31402596fa77d737670156da1))
- import from list mainly working ([8fdb5e5](https://github.com/finn-wa/grocy-trolley/commit/8fdb5e52d7ba369739f5f765ebab9a50790eaf2a))

### Bug Fixes

- fix blocked requests by saving client headers (closes [#40](https://github.com/finn-wa/grocy-trolley/issues/40)) ([6f44128](https://github.com/finn-wa/grocy-trolley/commit/6f4412861fd0265cf467371e9fc53dcba64a9dbe))
- fix typecheck task ([49075a5](https://github.com/finn-wa/grocy-trolley/commit/49075a53319762f902c45bb3664b445009d5bc06))
- only use anon search agent for shopping list exporter ([7fd65f9](https://github.com/finn-wa/grocy-trolley/commit/7fd65f98acbfaf917088c902aa2f1bcd3a597d7d))
- use playwright ([7881774](https://github.com/finn-wa/grocy-trolley/commit/7881774d10c142a4de1e1f68960dd01a8ff423e3))
- use playwright to perform fetch requests in a browser context to circumvent Cloudflare ([7ed2b35](https://github.com/finn-wa/grocy-trolley/commit/7ed2b3567a2efafed2ea9e5281f68821d5cb0d54))

### [2.1.1](https://github.com/finn-wa/grocy-trolley/compare/v2.1.0...v2.1.1) (2022-07-16)

## [2.1.0](https://github.com/finn-wa/grocy-trolley/compare/v2.0.0...v2.1.0) (2022-07-16)

### Features

- improve ProductService, make ParentProductService ([c6cf520](https://github.com/finn-wa/grocy-trolley/commit/c6cf520626a56717dbce36de18316865ef409564))

## [2.0.0](https://github.com/finn-wa/grocy-trolley/compare/v1.5.0...v2.0.0) (2022-07-16)

### ⚠ BREAKING CHANGES

- CLI now has top-level commands with positional arguments

### Features

- add shopping list exporter and clean up commander flow ([2444c2d](https://github.com/finn-wa/grocy-trolley/commit/2444c2d853f288d847cf12c801d828f1b5827a55))
- automatically add unit conversions to products ([a2b31d6](https://github.com/finn-wa/grocy-trolley/commit/a2b31d6cd931533e85ae9a6baf83348b536aeb4c))
- show prices of child products, add colours ([a429814](https://github.com/finn-wa/grocy-trolley/commit/a429814891d81a92becd123af60406faf04feffc))

### Bug Fixes

- clear dangling lists ([b9b2e04](https://github.com/finn-wa/grocy-trolley/commit/b9b2e040b40dc8ca1e9a21c0229ffe92cdf7ecbd))
- update metadata on import of existing product ([cafc9a1](https://github.com/finn-wa/grocy-trolley/commit/cafc9a1fdb8c4848ec7807738b13a08db2b54d1b))

## [1.5.0](https://github.com/finn-wa/grocy-trolley/compare/v1.4.0...v1.5.0) (2022-07-16)

### Features

- add CLI options ([b3d1304](https://github.com/finn-wa/grocy-trolley/commit/b3d130465e9eec4f289f1395f93a86312314ce43))
- add log message for adding stock ([5d038a5](https://github.com/finn-wa/grocy-trolley/commit/5d038a5f199eae16fed36de9a743ed5fec353ab2))
- find children of parent products ([bbb787d](https://github.com/finn-wa/grocy-trolley/commit/bbb787d1c536fe7d1c7f8dd70406308cdf068976))

### Bug Fixes

- add .nvmrc and fix typecheck problems ([0ddf01d](https://github.com/finn-wa/grocy-trolley/commit/0ddf01d507ba37c41f943bccf890e1b668cc2df6))
- add cache dir to git to avoid ENOENT ([168af54](https://github.com/finn-wa/grocy-trolley/commit/168af54f2ab3486c1f44600b604eff4b22b39a62))
- restrict parent product search to products in the same category ([b097cef](https://github.com/finn-wa/grocy-trolley/commit/b097cefd020fb4125940eda15731ccf22dd03436))

## [1.4.0](https://github.com/finn-wa/grocy-trolley/compare/v1.3.0...v1.4.0) (2022-07-16)

### Features

- add OCR receipt scanner ([55f0bfe](https://github.com/finn-wa/grocy-trolley/commit/55f0bfe4628bfa2b4241323aab09f39e444acfed))
- receipt import working ([d8405bf](https://github.com/finn-wa/grocy-trolley/commit/d8405bff9479258f069726b65fb15babb323bcba))

### Bug Fixes

- bug fixes ([867081b](https://github.com/finn-wa/grocy-trolley/commit/867081b0dc474d8d7e14e83b4908912c1bb9002f))
- separate importers, fix taggun ([5e78fd5](https://github.com/finn-wa/grocy-trolley/commit/5e78fd5a3246dd4fd0f877c81ca40eebc46a925d))

## [1.3.0](https://github.com/finn-wa/grocy-trolley/compare/v1.2.0...v1.3.0) (2022-07-16)

### Features

- add barcodebuddy crawler ([480423e](https://github.com/finn-wa/grocy-trolley/commit/480423ee3daf91eef8dec0ad7dd4f7b2f2fedd59))
- add trace loglevel ([f78e7b2](https://github.com/finn-wa/grocy-trolley/commit/f78e7b2f924210ccd2c34d79fa8ac36cb566227a))
- barcode buddy imports ([0a0dff3](https://github.com/finn-wa/grocy-trolley/commit/0a0dff3c9c5e64174c7ddd7883f337828fb42902))

### Bug Fixes

- stock and unit fixes, parent product resolution ([f8832e2](https://github.com/finn-wa/grocy-trolley/commit/f8832e2132998a9b479d65dd09be18088cf75127))

## [1.2.0](https://github.com/finn-wa/grocy-trolley/compare/v1.1.0...v1.2.0) (2022-07-16)

### Features

- adding to stock works :O ([5578346](https://github.com/finn-wa/grocy-trolley/commit/55783463aaa1871043b152dddffa82ee73735e53))
- prompts & interactive list import ([3d8c3e3](https://github.com/finn-wa/grocy-trolley/commit/3d8c3e3a1ded6ac5e26780eceb7de7faef52c3d4))

## [1.1.0](https://github.com/finn-wa/grocy-trolley/compare/v1.0.0...v1.1.0) (2022-07-16)

### Features

- importing past orders works ([d11f89b](https://github.com/finn-wa/grocy-trolley/commit/d11f89ba7a63947916af7c62692d9085f3c79d34))

## [1.0.0](https://github.com/finn-wa/grocy-trolley/compare/v0.0.2...v1.0.0) (2022-07-16)

### Features

- importing from cart ([ea674a9](https://github.com/finn-wa/grocy-trolley/commit/ea674a9a8256f9a162fe48463ef88572c21223ba))

### 0.0.2 (2022-07-16)
