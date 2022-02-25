import { GrocyLocation } from "@grocy-trolley/grocy/grocy-config";

export const FOODSTUFFS_CATEGORIES = [
  // Fresh Foods & Bakery
  "Fruit & Vegetables",
  "Butchery",
  "Seafood",
  "Deli, Salads & Cooked Meats",
  "Bakery",
  // Chilled, Frozen & Desserts
  "Dairy & Eggs",
  "Bulk & Loose Foods",
  "Meal Kits",
  "Ready to Heat",
  "Dairy & Eggs",
  "Cheese",
  "Desserts",
  "Frozen Foods",
  // Pantry
  "Baking Supplies & Sugar",
  "Biscuits & Crackers",
  "Breakfast Cereals",
  "Canned & Prepared Foods",
  "Condiments & Dressings",
  "Confectionery",
  "Hot Drinks",
  "Jams, Honey & Spreads",
  "Pasta, Rice & Noodles",
  "Salad & Cooking Oils",
  "Sauces, Stock & Marinades",
  "Snack Foods",
  "Spices & Seasonings",
  "World Foods",
  // Drinks
  "Cold Drinks",
  // Beer, Cider & Wine
  "Beer & Cider",
  "Wine",
  // Personal Care
  "Beauty & Grooming",
  "Health & Wellness",
  // Baby, Toddler & Kids
  "Baby Care",
  // Pets
  "Pet Supplies",
  // Kitchen, Dining & Household
  "Cleaning Products",
  "Garage & Outdoor",
  "Household",
  "Laundry",
  "Stationery & Entertainment",
  "Other",
] as const;

export type FoodstuffsCategory = typeof FOODSTUFFS_CATEGORIES[number];

export const CategoryLocations: Record<FoodstuffsCategory, GrocyLocation> = {
  "Fruit & Vegetables": "Kitchen Fridge",
  Butchery: "Kitchen Fridge",
  Seafood: "Kitchen Fridge",
  "Deli, Salads & Cooked Meats": "Kitchen Fridge",
  Bakery: "Pantry",
  "Dairy & Eggs": "Kitchen Fridge",
  "Bulk & Loose Foods": "Pantry",
  "Meal Kits": "Kitchen Fridge",
  "Ready to Heat": "Kitchen Fridge",
  Cheese: "Kitchen Fridge",
  Desserts: "Kitchen Fridge",
  "Frozen Foods": "Kitchen Freezer",
  "Baking Supplies & Sugar": "Pantry",
  "Biscuits & Crackers": "Pantry",
  "Breakfast Cereals": "Pantry",
  "Canned & Prepared Foods": "Pantry",
  "Condiments & Dressings": "Pantry",
  Confectionery: "Pantry",
  "Hot Drinks": "Pantry",
  "Jams, Honey & Spreads": "Pantry",
  "Pasta, Rice & Noodles": "Pantry",
  "Salad & Cooking Oils": "Kitchen Shared Drawer",
  "Sauces, Stock & Marinades": "Pantry",
  "Snack Foods": "Pantry",
  "Spices & Seasonings": "Kitchen Bench",
  "World Foods": "Pantry",
  "Cold Drinks": "Garage Fridge",
  "Beer & Cider": "Garage Fridge",
  Wine: "Garage Fridge",
  "Beauty & Grooming": "Bathroom",
  "Health & Wellness": "Bathroom",
  "Baby Care": "Bathroom",
  "Pet Supplies": "Garage Storage",
  "Cleaning Products": "Bathroom",
  "Garage & Outdoor": "Garage Storage",
  Household: "Bathroom",
  Laundry: "Garage Storage",
  "Stationery & Entertainment": "Bedroom",
  Other: "Pantry",
};

// await fetch("https://www.paknsave.co.nz/CommonApi/Navigation/MegaMenu?v=20267&storeId=e1925ea7-01bc-4358-ae7c-c6502da5ab12", {
//     "credentials": "include",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
//         "Accept": "application/json, text/plain, */*",
//         "Accept-Language": "en-US,en;q=0.5",
//         "__RequestVerificationToken": "syvlKcDiLUpf4QtehqpBqu0ORVki52WPaRSud07H5NepqQsJ2s6KLsNGIeYa8gAHNYoouXUCaMW_45dJqs-3l2LBhy01",
//         "Sec-Fetch-Dest": "empty",
//         "Sec-Fetch-Mode": "cors",
//         "Sec-Fetch-Site": "same-origin"
//     },
//     "referrer": "https://www.paknsave.co.nz/shop/my-account/my-lists/my-list-details?listId=abandoned_list",
//     "method": "GET",
//     "mode": "cors"
// });
