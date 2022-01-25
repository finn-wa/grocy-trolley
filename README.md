# Grocy Trolley

- we track when we purchase groceries and when we consume them in grocy
- products are linked to paknsave items
- we add recipes to grocy
- grocy generates shopping lists for us
- these lists are automatically added to paknsave

## Components

### ReceiptItemizer

- extract products from physical scanned receipts (see itemwise)
- extract products from digital receipts from online orders

### ReceiptTranscriber

- store products in grocy with appropriate links to paknsave
- use grocy search as product cache

### OnlineShopper

- export shopping list (should be in grocy API)
- add products from grocy shopping list to PakNSave/other online shopping cart

## Directory Layout

```
-> receipt
---> scanner
-----> image
-----> email
-> product
---> linker
-----> paknsave
---> store
-----> grocy
-> shopper
---> paknsave
```
