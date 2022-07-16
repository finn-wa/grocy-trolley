# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/finn-wa/grocy-trolley/compare/v1.5.0...v2.0.0) (2022-07-16)


### ⚠ BREAKING CHANGES

* CLI now has top-level commands with positional arguments

### Features

* add shopping list exporter and clean up commander flow ([2444c2d](https://github.com/finn-wa/grocy-trolley/commit/2444c2d853f288d847cf12c801d828f1b5827a55))
* automatically add unit conversions to products ([a2b31d6](https://github.com/finn-wa/grocy-trolley/commit/a2b31d6cd931533e85ae9a6baf83348b536aeb4c))
* show prices of child products, add colours ([a429814](https://github.com/finn-wa/grocy-trolley/commit/a429814891d81a92becd123af60406faf04feffc))


### Bug Fixes

* clear dangling lists ([b9b2e04](https://github.com/finn-wa/grocy-trolley/commit/b9b2e040b40dc8ca1e9a21c0229ffe92cdf7ecbd))
* update metadata on import of existing product ([cafc9a1](https://github.com/finn-wa/grocy-trolley/commit/cafc9a1fdb8c4848ec7807738b13a08db2b54d1b))

## [1.5.0](https://github.com/finn-wa/grocy-trolley/compare/v1.4.0...v1.5.0) (2022-07-16)


### Features

* add CLI options ([b3d1304](https://github.com/finn-wa/grocy-trolley/commit/b3d130465e9eec4f289f1395f93a86312314ce43))
* add log message for adding stock ([5d038a5](https://github.com/finn-wa/grocy-trolley/commit/5d038a5f199eae16fed36de9a743ed5fec353ab2))
* find children of parent products ([bbb787d](https://github.com/finn-wa/grocy-trolley/commit/bbb787d1c536fe7d1c7f8dd70406308cdf068976))


### Bug Fixes

* add .nvmrc and fix typecheck problems ([0ddf01d](https://github.com/finn-wa/grocy-trolley/commit/0ddf01d507ba37c41f943bccf890e1b668cc2df6))
* add cache dir to git to avoid ENOENT ([168af54](https://github.com/finn-wa/grocy-trolley/commit/168af54f2ab3486c1f44600b604eff4b22b39a62))
* restrict parent product search to products in the same category ([b097cef](https://github.com/finn-wa/grocy-trolley/commit/b097cefd020fb4125940eda15731ccf22dd03436))

## [1.4.0](https://github.com/finn-wa/grocy-trolley/compare/v1.3.0...v1.4.0) (2022-07-16)


### Features

* add OCR receipt scanner ([55f0bfe](https://github.com/finn-wa/grocy-trolley/commit/55f0bfe4628bfa2b4241323aab09f39e444acfed))
* receipt import working ([d8405bf](https://github.com/finn-wa/grocy-trolley/commit/d8405bff9479258f069726b65fb15babb323bcba))


### Bug Fixes

* bug fixes ([867081b](https://github.com/finn-wa/grocy-trolley/commit/867081b0dc474d8d7e14e83b4908912c1bb9002f))
* separate importers, fix taggun ([5e78fd5](https://github.com/finn-wa/grocy-trolley/commit/5e78fd5a3246dd4fd0f877c81ca40eebc46a925d))

## [1.3.0](https://github.com/finn-wa/grocy-trolley/compare/v1.2.0...v1.3.0) (2022-07-16)


### Features

* add barcodebuddy crawler ([480423e](https://github.com/finn-wa/grocy-trolley/commit/480423ee3daf91eef8dec0ad7dd4f7b2f2fedd59))
* add trace loglevel ([f78e7b2](https://github.com/finn-wa/grocy-trolley/commit/f78e7b2f924210ccd2c34d79fa8ac36cb566227a))
* barcode buddy imports ([0a0dff3](https://github.com/finn-wa/grocy-trolley/commit/0a0dff3c9c5e64174c7ddd7883f337828fb42902))


### Bug Fixes

* stock and unit fixes, parent product resolution ([f8832e2](https://github.com/finn-wa/grocy-trolley/commit/f8832e2132998a9b479d65dd09be18088cf75127))

## [1.2.0](https://github.com/finn-wa/grocy-trolley/compare/v1.1.0...v1.2.0) (2022-07-16)


### Features

* adding to stock works :O ([5578346](https://github.com/finn-wa/grocy-trolley/commit/55783463aaa1871043b152dddffa82ee73735e53))
* prompts & interactive list import ([3d8c3e3](https://github.com/finn-wa/grocy-trolley/commit/3d8c3e3a1ded6ac5e26780eceb7de7faef52c3d4))

## [1.1.0](https://github.com/finn-wa/grocy-trolley/compare/v1.0.0...v1.1.0) (2022-07-16)


### Features

* importing past orders works ([d11f89b](https://github.com/finn-wa/grocy-trolley/commit/d11f89ba7a63947916af7c62692d9085f3c79d34))

## [1.0.0](https://github.com/finn-wa/grocy-trolley/compare/v0.0.2...v1.0.0) (2022-07-16)


### Features

* importing from cart ([ea674a9](https://github.com/finn-wa/grocy-trolley/commit/ea674a9a8256f9a162fe48463ef88572c21223ba))

### 0.0.2 (2022-07-16)
