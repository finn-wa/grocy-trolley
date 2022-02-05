export const PAKNSAVE_CATEGORIES = [
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
] as const;

export type PakNSaveCategory = typeof PAKNSAVE_CATEGORIES[number];

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
