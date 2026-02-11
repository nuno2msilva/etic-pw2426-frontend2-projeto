/**
 * ==========================================================================
 * Default Data — Menu items, tables, and settings
 * ==========================================================================
 *
 * Seeds the application with:
 *   - 145 menu items across 10 categories (Nigiri, Rolls, etc.)
 *   - 6 restaurant tables (the default configuration)
 *   - Order limit settings (10 items/order, 2 active orders/table)
 *
 * Each menu item has a numbered prefix (e.g., "#1 Salmon Nigiri")
 * for easy ordering by number. Popular items are flagged with
 * isPopular: true to show a "HOT" badge in the grid.
 *
 * This data is loaded into localStorage on first API call and
 * persists across page refreshes.
 * ==========================================================================
 */

import type { SushiItem } from "@/types/sushi";

/**
 * Default menu with 100+ items organized by category
 * Each item has a numbered prefix for easy ordering
 */
export const DEFAULT_MENU: SushiItem[] = [
  // ===== NIGIRI (1-25) =====
  { id: "1", name: "#1 Salmon Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
  { id: "2", name: "#2 Tuna Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
  { id: "3", name: "#3 Yellowtail Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "4", name: "#4 Shrimp Nigiri", emoji: "🍤", category: "Nigiri" },
  { id: "5", name: "#5 Eel Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
  { id: "6", name: "#6 Octopus Nigiri", emoji: "🐙", category: "Nigiri" },
  { id: "7", name: "#7 Squid Nigiri", emoji: "🦑", category: "Nigiri" },
  { id: "8", name: "#8 Scallop Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "9", name: "#9 Butterfish Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "10", name: "#10 Sea Bass Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "11", name: "#11 Mackerel Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "12", name: "#12 Red Snapper Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "13", name: "#13 Egg Nigiri", emoji: "🥚", category: "Nigiri" },
  { id: "14", name: "#14 Tofu Nigiri", emoji: "🧈", category: "Nigiri" },
  { id: "15", name: "#15 Crab Nigiri", emoji: "🦀", category: "Nigiri" },
  { id: "16", name: "#16 Lobster Nigiri", emoji: "🦞", category: "Nigiri" },
  { id: "17", name: "#17 Sweet Shrimp Nigiri", emoji: "🍤", category: "Nigiri" },
  { id: "18", name: "#18 Salmon Belly Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "19", name: "#19 Tuna Belly Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "20", name: "#20 Sea Urchin Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "21", name: "#21 Halibut Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "22", name: "#22 Albacore Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "23", name: "#23 Smoked Salmon Nigiri", emoji: "🍣", category: "Nigiri" },
  { id: "24", name: "#24 Spicy Tuna Nigiri", emoji: "🌶️", category: "Nigiri" },
  { id: "25", name: "#25 Flamed Salmon Nigiri", emoji: "🔥", category: "Nigiri" },

  // ===== CLASSIC ROLLS (26-50) =====
  { id: "26", name: "#26 California Roll", emoji: "🍙", category: "Rolls", isPopular: true },
  { id: "27", name: "#27 Salmon Roll", emoji: "🍙", category: "Rolls" },
  { id: "28", name: "#28 Tuna Roll", emoji: "🍙", category: "Rolls" },
  { id: "29", name: "#29 Cucumber Roll", emoji: "🥒", category: "Rolls" },
  { id: "30", name: "#30 Avocado Roll", emoji: "🥑", category: "Rolls" },
  { id: "31", name: "#31 Spicy Tuna Roll", emoji: "🌶️", category: "Rolls", isPopular: true },
  { id: "32", name: "#32 Spicy Salmon Roll", emoji: "🌶️", category: "Rolls" },
  { id: "33", name: "#33 Philadelphia Roll", emoji: "🍙", category: "Rolls", isPopular: true },
  { id: "34", name: "#34 Dragon Roll", emoji: "🐉", category: "Rolls", isPopular: true },
  { id: "35", name: "#35 Rainbow Roll", emoji: "🌈", category: "Rolls", isPopular: true },
  { id: "36", name: "#36 Spider Roll", emoji: "🕷️", category: "Rolls" },
  { id: "37", name: "#37 Shrimp Tempura Roll", emoji: "🍤", category: "Rolls", isPopular: true },
  { id: "38", name: "#38 Eel Avocado Roll", emoji: "🍙", category: "Rolls" },
  { id: "39", name: "#39 Salmon Skin Roll", emoji: "🍙", category: "Rolls" },
  { id: "40", name: "#40 Yellowtail Roll", emoji: "🍙", category: "Rolls" },
  { id: "41", name: "#41 Crunchy Roll", emoji: "🍙", category: "Rolls" },
  { id: "42", name: "#42 Vegas Roll", emoji: "🎰", category: "Rolls" },
  { id: "43", name: "#43 Boston Roll", emoji: "🍙", category: "Rolls" },
  { id: "44", name: "#44 Alaska Roll", emoji: "❄️", category: "Rolls" },
  { id: "45", name: "#45 Tiger Roll", emoji: "🐯", category: "Rolls" },
  { id: "46", name: "#46 Caterpillar Roll", emoji: "🐛", category: "Rolls" },
  { id: "47", name: "#47 Phoenix Roll", emoji: "🔥", category: "Rolls" },
  { id: "48", name: "#48 Rock n Roll", emoji: "🎸", category: "Rolls" },
  { id: "49", name: "#49 Volcano Roll", emoji: "🌋", category: "Rolls" },
  { id: "50", name: "#50 Dynamite Roll", emoji: "💥", category: "Rolls" },

  // ===== SPECIALTY ROLLS (51-70) =====
  { id: "51", name: "#51 King Crab Roll", emoji: "🦀", category: "Specialty Rolls", isPopular: true },
  { id: "52", name: "#52 Lobster Roll", emoji: "🦞", category: "Specialty Rolls" },
  { id: "53", name: "#53 Surf & Turf Roll", emoji: "🥩", category: "Specialty Rolls" },
  { id: "54", name: "#54 Black Dragon Roll", emoji: "🖤", category: "Specialty Rolls" },
  { id: "55", name: "#55 Red Dragon Roll", emoji: "❤️", category: "Specialty Rolls" },
  { id: "56", name: "#56 Golden Gate Roll", emoji: "🌉", category: "Specialty Rolls" },
  { id: "57", name: "#57 Emperor Roll", emoji: "👑", category: "Specialty Rolls" },
  { id: "58", name: "#58 Samurai Roll", emoji: "⚔️", category: "Specialty Rolls" },
  { id: "59", name: "#59 Ninja Roll", emoji: "🥷", category: "Specialty Rolls" },
  { id: "60", name: "#60 Sumo Roll", emoji: "🍙", category: "Specialty Rolls" },
  { id: "61", name: "#61 Firecracker Roll", emoji: "🧨", category: "Specialty Rolls" },
  { id: "62", name: "#62 Sunset Roll", emoji: "🌅", category: "Specialty Rolls" },
  { id: "63", name: "#63 Sunrise Roll", emoji: "🌄", category: "Specialty Rolls" },
  { id: "64", name: "#64 Ocean Roll", emoji: "🌊", category: "Specialty Rolls" },
  { id: "65", name: "#65 Mountain Roll", emoji: "🏔️", category: "Specialty Rolls" },
  { id: "66", name: "#66 Garden Roll", emoji: "🌸", category: "Specialty Rolls" },
  { id: "67", name: "#67 Sakura Roll", emoji: "🌸", category: "Specialty Rolls" },
  { id: "68", name: "#68 Fuji Roll", emoji: "🗻", category: "Specialty Rolls" },
  { id: "69", name: "#69 Tokyo Roll", emoji: "🗼", category: "Specialty Rolls" },
  { id: "70", name: "#70 Osaka Roll", emoji: "🏯", category: "Specialty Rolls" },

  // ===== SASHIMI (71-85) =====
  { id: "71", name: "#71 Salmon Sashimi", emoji: "🐟", category: "Sashimi", isPopular: true },
  { id: "72", name: "#72 Tuna Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "73", name: "#73 Yellowtail Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "74", name: "#74 Butterfish Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "75", name: "#75 Octopus Sashimi", emoji: "🐙", category: "Sashimi" },
  { id: "76", name: "#76 Squid Sashimi", emoji: "🦑", category: "Sashimi" },
  { id: "77", name: "#77 Mackerel Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "78", name: "#78 Sea Bass Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "79", name: "#79 Red Snapper Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "80", name: "#80 Scallop Sashimi", emoji: "🐚", category: "Sashimi" },
  { id: "81", name: "#81 Sweet Shrimp Sashimi", emoji: "🍤", category: "Sashimi" },
  { id: "82", name: "#82 Salmon Belly Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "83", name: "#83 Tuna Belly Sashimi", emoji: "🐟", category: "Sashimi" },
  { id: "84", name: "#84 Sea Urchin Sashimi", emoji: "🍣", category: "Sashimi" },
  { id: "85", name: "#85 Sashimi Platter", emoji: "🐟", category: "Sashimi" },

  // ===== HOT DISHES (86-100) =====
  { id: "86", name: "#86 Teriyaki Chicken", emoji: "🍗", category: "Hot Dishes", isPopular: true },
  { id: "87", name: "#87 Teriyaki Salmon", emoji: "🐟", category: "Hot Dishes" },
  { id: "88", name: "#88 Teriyaki Beef", emoji: "🥩", category: "Hot Dishes" },
  { id: "89", name: "#89 Chicken Katsu", emoji: "🍗", category: "Hot Dishes" },
  { id: "90", name: "#90 Tonkatsu", emoji: "🐷", category: "Hot Dishes" },
  { id: "91", name: "#91 Beef Tataki", emoji: "🥩", category: "Hot Dishes" },
  { id: "92", name: "#92 Grilled Eel", emoji: "🍣", category: "Hot Dishes" },
  { id: "93", name: "#93 Tempura Shrimp", emoji: "🍤", category: "Hot Dishes", isPopular: true },
  { id: "94", name: "#94 Tempura Vegetables", emoji: "🥬", category: "Hot Dishes" },
  { id: "95", name: "#95 Agedashi Tofu", emoji: "🧈", category: "Hot Dishes" },
  { id: "96", name: "#96 Yakitori Skewers", emoji: "🍢", category: "Hot Dishes" },
  { id: "97", name: "#97 Gyudon Beef Bowl", emoji: "🍚", category: "Hot Dishes" },
  { id: "98", name: "#98 Chicken Donburi", emoji: "🍚", category: "Hot Dishes" },
  { id: "99", name: "#99 Salmon Donburi", emoji: "🍚", category: "Hot Dishes" },
  { id: "100", name: "#100 Chirashi Bowl", emoji: "🍚", category: "Hot Dishes" },

  // ===== SIDES (101-115) =====
  { id: "101", name: "#101 Edamame", emoji: "🫘", category: "Sides", isPopular: true },
  { id: "102", name: "#102 Miso Soup", emoji: "🍜", category: "Sides", isPopular: true },
  { id: "103", name: "#103 Gyoza (5pc)", emoji: "🥟", category: "Sides", isPopular: true },
  { id: "104", name: "#104 Spring Rolls (3pc)", emoji: "🥡", category: "Sides" },
  { id: "105", name: "#105 Seaweed Salad", emoji: "🥗", category: "Sides" },
  { id: "106", name: "#106 Cucumber Salad", emoji: "🥒", category: "Sides" },
  { id: "107", name: "#107 House Salad", emoji: "🥗", category: "Sides" },
  { id: "108", name: "#108 Rice Bowl", emoji: "🍚", category: "Sides" },
  { id: "109", name: "#109 Takoyaki (6pc)", emoji: "🐙", category: "Sides" },
  { id: "110", name: "#110 Crispy Tofu", emoji: "🧈", category: "Sides" },
  { id: "111", name: "#111 Tempura Sampler", emoji: "🍤", category: "Sides" },
  { id: "112", name: "#112 Spicy Tuna Tartare", emoji: "🌶️", category: "Sides" },
  { id: "113", name: "#113 Salmon Tartare", emoji: "🐟", category: "Sides" },
  { id: "114", name: "#114 Yellowtail Jalapeño", emoji: "🌶️", category: "Sides" },
  { id: "115", name: "#115 Tuna Tataki", emoji: "🐟", category: "Sides" },

  // ===== NOODLES & SOUPS (116-125) =====
  { id: "116", name: "#116 Udon Noodle Soup", emoji: "🍜", category: "Noodles" },
  { id: "117", name: "#117 Ramen", emoji: "🍜", category: "Noodles", isPopular: true },
  { id: "118", name: "#118 Miso Ramen", emoji: "🍜", category: "Noodles" },
  { id: "119", name: "#119 Tonkotsu Ramen", emoji: "🍜", category: "Noodles", isPopular: true },
  { id: "120", name: "#120 Shoyu Ramen", emoji: "🍜", category: "Noodles" },
  { id: "121", name: "#121 Yakisoba", emoji: "🍝", category: "Noodles" },
  { id: "122", name: "#122 Pad Thai", emoji: "🍝", category: "Noodles" },
  { id: "123", name: "#123 Soba Noodles", emoji: "🍝", category: "Noodles" },
  { id: "124", name: "#124 Tempura Udon", emoji: "🍜", category: "Noodles" },
  { id: "125", name: "#125 Seafood Ramen", emoji: "🍜", category: "Noodles" },

  // ===== DRINKS (126-135) =====
  { id: "126", name: "#126 Green Tea", emoji: "🍵", category: "Drinks", isPopular: true },
  { id: "127", name: "#127 Jasmine Tea", emoji: "🍵", category: "Drinks" },
  { id: "128", name: "#128 Oolong Tea", emoji: "🍵", category: "Drinks" },
  { id: "129", name: "#129 Sake (Hot)", emoji: "🍶", category: "Drinks" },
  { id: "130", name: "#130 Sake (Cold)", emoji: "🍶", category: "Drinks" },
  { id: "131", name: "#131 Japanese Beer", emoji: "🍺", category: "Drinks" },
  { id: "132", name: "#132 Ramune Soda", emoji: "🥤", category: "Drinks" },
  { id: "133", name: "#133 Calpico", emoji: "🥛", category: "Drinks" },
  { id: "134", name: "#134 Matcha Latte", emoji: "🍵", category: "Drinks" },
  { id: "135", name: "#135 Lychee Juice", emoji: "🧃", category: "Drinks" },

  // ===== DESSERTS (136-145) =====
  { id: "136", name: "#136 Mochi Ice Cream", emoji: "🍡", category: "Desserts", isPopular: true },
  { id: "137", name: "#137 Green Tea Ice Cream", emoji: "🍨", category: "Desserts" },
  { id: "138", name: "#138 Red Bean Ice Cream", emoji: "🍨", category: "Desserts" },
  { id: "139", name: "#139 Tempura Banana", emoji: "🍌", category: "Desserts" },
  { id: "140", name: "#140 Tempura Ice Cream", emoji: "🍨", category: "Desserts" },
  { id: "141", name: "#141 Dorayaki", emoji: "🥞", category: "Desserts" },
  { id: "142", name: "#142 Taiyaki", emoji: "🐟", category: "Desserts" },
  { id: "143", name: "#143 Matcha Cheesecake", emoji: "🍰", category: "Desserts" },
  { id: "144", name: "#144 Mango Pudding", emoji: "🥭", category: "Desserts" },
  { id: "145", name: "#145 Black Sesame Cake", emoji: "🍰", category: "Desserts" },
];

export const DEFAULT_TABLES = [
  { id: "1", label: "Table 1" },
  { id: "2", label: "Table 2" },
  { id: "3", label: "Table 3" },
  { id: "4", label: "Table 4" },
  { id: "5", label: "Table 5" },
  { id: "6", label: "Table 6" },
];

// Default order limits
export const DEFAULT_SETTINGS = {
  maxItemsPerOrder: 10,
  maxActiveOrdersPerTable: 2,
};
