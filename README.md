# Grocy Trolley

Links Grocy to PAK'n'SAVE online shopping

## Notes

when importing:

- dashes in product id break it
- and saletype both

then when stocking

```log
12:45:32.488 | INFO  | FoodstuffsListImporter | Stocking product: Yummy Fruit Hailstone Heroes Sweetango Apples (2kg)
12:45:32.488 | ERROR | FoodstuffsListImporter | Error stocking product  [
  Error: Unmapped FS category: undefined
      at FoodstuffsToGrocyConverter.categoryToLocationId (/home/finn/server/grocy/grocy-trolley/out/main.js:22072:13)
      at FoodstuffsToGrocyConverter.forAddStock (/home/finn/server/grocy/grocy-trolley/out/main.js:22009:25)
      at FoodstuffsListImporter.stockProductsFromList (/home/finn/server/grocy/grocy-trolley/out/main.js:21812:48)
      at processTicksAndRejections (node:internal/process/task_queues:96:5)
      at async FoodstuffsListImporter.importList (/home/finn/server/grocy/grocy-trolley/out/main.js:21799:7)
      at async FoodstuffsReceiptImporter.importReceiptListRefs (/home/finn/server/grocy/grocy-trolley/out/main.js:22179:5)
      at async Command2.<anonymous> (/home/finn/server/grocy/grocy-trolley/out/main.js:22274:3)
      at async Command2.parseAsync (/home/finn/server/grocy/grocy-trolley/out/main.js:960:9)
]
```
