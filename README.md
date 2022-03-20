# Grocy Trolley

TODO

- create parent during import
- no need to parse price?
- remove or use quantities from receipts
- cart doesn't like saletype: BOTH
- handle cached cookie expiry
- make sure purchase price updates if product already imported
- scheduled backups
- grocy API types are wrong, everything is always a string
- generic products choice should show a current price
- foodstuffsRestService global request throttle?
- treat open as out of stock - default false? migrate?
- add custom quantity unit conversions for products based on weight display name (needs migrate)
- ideally grams for solids and mls for liquids
- modified grocy openapi spec is going to go out of date
- schemas for request/response when creating a product are different (but unified in the api spec bc every property is optional)
- qu conversion service to supply good default qus/conversions and take qu-related stuff from product service & converter
