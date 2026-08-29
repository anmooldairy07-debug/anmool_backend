require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const CoinPackage = require("./models/CoinPackage");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    CoinPackage.deleteMany({}),
  ]);

  // Create admin
  const admin = await User.create({
    name: "Admin",
    email: "admin@anmool.com",
    password: "admin123",
    phone: "+91 99999 00000",
    address: "Anmool Dairy HQ, Anand, Gujarat",
    role: "admin",
    coins: 99999,
  });

  // Create test users
  await User.create([
    { name: "Rahul Sharma", email: "rahul@example.com", password: "password123", phone: "+91 98765 43210", address: "123 MG Road, Jaipur, Rajasthan", coins: 1250 },
    { name: "Priya Patel", email: "priya@example.com", password: "password123", phone: "+91 87654 32109", address: "45 Nehru Nagar, Ahmedabad, Gujarat", coins: 800 },
    { name: "Amit Singh", email: "amit@example.com", password: "password123", phone: "+91 76543 21098", address: "78 Gandhi Marg, Lucknow, UP", coins: 2100 },
    { name: "Neha Gupta", email: "neha@example.com", password: "password123", phone: "+91 65432 10987", address: "12 Civil Lines, Bhopal, MP", coins: 450 },
  ]);

  // Create products
  await Product.create([
    {
      name: "Anmool Pure Desi Ghee",
      description: "Handcrafted from grass-fed cow milk using traditional bilona method",
      longDescription: "Our flagship Anmool Pure Desi Ghee is crafted using the ancient bilona method, where whole milk is converted to curd, then churned to extract butter, which is slow-cooked to perfection.",
      price: 599,
      image: "/images/products/ghee.svg",
      category: "Ghee",
      weight: "500ml",
      rating: 4.9,
      reviews: 2847,
      badge: "bestseller",
      features: ["100% Pure & Natural", "Traditional Bilona Method", "Grass-Fed Cow Milk", "No Preservatives", "Rich in Vitamins A, D, E, K", "A2 Protein Rich"],
    },
    {
      name: "Anmool Fresh Full Cream Milk",
      description: "Farm-fresh full cream milk delivered within hours of milking",
      longDescription: "Experience the pure taste of village-fresh milk with Anmool Full Cream Milk. Sourced directly from our trusted dairy farms.",
      price: 68,
      image: "/images/products/milk.svg",
      category: "Milk",
      weight: "1 Litre",
      rating: 4.7,
      reviews: 1523,
      badge: "bestseller",
      features: ["Farm Fresh", "Full Cream", "Minimal Processing", "Naturally Sweet", "Pasteurized", "Rich in Calcium"],
    },
    {
      name: "Anmool Paneer Fresh",
      description: "Soft, crumbly paneer made from pure full-cream milk",
      longDescription: "Anmool Paneer is freshly made daily from our pure full-cream milk, ensuring a soft, crumbly texture that melts in your mouth.",
      price: 85,
      image: "/images/products/paneer.svg",
      category: "Paneer",
      weight: "200g",
      rating: 4.8,
      reviews: 982,
      badge: "organic",
      features: ["Freshly Made Daily", "No Citric Acid", "Natural Lemon Curdled", "Soft & Crumbly", "High Protein", "No Preservatives"],
    },
    {
      name: "Anmool Pure A2 Curd",
      description: "Creamy, thick curd set in earthen pots with A2 milk",
      longDescription: "Anmool A2 Curd is set slowly in traditional earthen pots using our premium A2 milk.",
      price: 55,
      image: "/images/products/curd.svg",
      category: "Curd",
      weight: "400g",
      rating: 4.6,
      reviews: 756,
      badge: "premium",
      features: ["Earthen Pot Set", "A2 Milk", "Probiotic Rich", "Natural Fermentation", "Thick & Creamy", "No Added Sugar"],
    },
    {
      name: "Anmool White Butter (Makhan)",
      description: "Freshly churned white butter from handcrafted curd",
      longDescription: "Anmool White Butter is the nostalgic taste of homemade makhan, freshly churned from hand-churned curd using the traditional madhani.",
      price: 180,
      image: "/images/products/butter.svg",
      category: "Butter",
      weight: "250g",
      rating: 4.8,
      reviews: 634,
      features: ["Hand-Churned", "No Yellow Coloring", "Traditional Madhani", "Small Batch", "Creamy Texture", "Pure White Butter"],
    },
    {
      name: "Anmool Masala Buttermilk (Chaas)",
      description: "Refreshing spiced buttermilk made from fresh curd",
      longDescription: "Beat the heat with Anmool Masala Chaas — a refreshing, probiotic-rich drink made from our fresh curd.",
      price: 40,
      image: "/images/products/buttermilk.svg",
      category: "Beverages",
      weight: "300ml",
      rating: 4.5,
      reviews: 421,
      badge: "new",
      features: ["Probiotic Drink", "Natural Spices", "No Artificial Flavours", "Digestive", "Refreshing", "Low Calorie"],
    },
    {
      name: "Anmool Lassi Sweet",
      description: "Traditional creamy lassi made with fresh curd and mishri",
      longDescription: "Anmool Lassi is the ultimate summer refresher — thick, creamy, and naturally sweetened with mishri.",
      price: 50,
      image: "/images/products/lassi.svg",
      category: "Beverages",
      weight: "350ml",
      rating: 4.7,
      reviews: 589,
      features: ["Traditional Recipe", "Mishri Sweetened", "Thick & Creamy", "Probiotic", "Calcium Rich", "No Preservatives"],
    },
    {
      name: "Anmool Cow Dung Candles",
      description: "Eco-friendly candles made from pure cow dung and natural wax",
      longDescription: "Anmool Cow Dung Candles are handcrafted from sun-dried cow dung blended with natural soy wax.",
      price: 150,
      image: "/images/products/candles.svg",
      category: "Eco Products",
      weight: "100g (Pack of 4)",
      rating: 4.4,
      reviews: 312,
      badge: "new",
      features: ["Eco-Friendly", "Handcrafted", "Natural Ingredients", "Air Purifying", "Herbal Fragrance", "Long Burning"],
    },
  ]);

  // Create coin packages
  await CoinPackage.create([
    { coins: 100, price: 100, bonus: 0, popular: false },
    { coins: 250, price: 230, bonus: 20, popular: false },
    { coins: 500, price: 430, bonus: 70, popular: true },
    { coins: 1000, price: 800, bonus: 200, popular: false },
    { coins: 2500, price: 1800, bonus: 700, popular: false },
    { coins: 5000, price: 3200, bonus: 1800, popular: false },
  ]);

  console.log("Database seeded successfully!");
  console.log("Admin: admin@anmool.com / admin123");
  console.log("User: rahul@example.com / password123");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
