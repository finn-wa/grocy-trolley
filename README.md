# Grocy Trolley

TODO

- create parent during import
- remove or use quantities from receipts
- handle cached cookie expiry
- scheduled backups
- grocy API types are wrong, everything is always a string
- treat open as out of stock - default false? migrate? do it by category? - could also do expiry date by category
- modified grocy openapi spec is going to go out of date
  - schemas for request/response when creating a product are different (but unified in the api spec bc every property is optional)
- qu conversion service to supply good default qus/conversions and take qu-related stuff from product service & converter
- phone friendly interface
- tests (lol)
- PR to improve grocy api spec

- multi-select generic products when exporting
- also figure out what's up with $0 items
- source from other stores?

- BOTH still an issue
- parse the damn amounts
- all prompts should have exit
- catch all errors when doing things
- consider using receipt prices
- save skipped items
- use lists for importing?
