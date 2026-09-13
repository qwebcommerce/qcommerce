import { hashPassword } from "@/lib/password";
import type { Category, Customer, Order, Product } from "@/types";

export const SEED_CATEGORIES: Category[] = [
  { id: "cat_tshirts", name: "T-Shirts", slug: "t-shirts", subtitle: "Basics & Beyond", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80&fit=crop&crop=top", sortOrder: 1 },
  { id: "cat_shirts", name: "Shirts", slug: "shirts", subtitle: "Smart Casual", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=80&fit=crop&crop=top", sortOrder: 2 },
  { id: "cat_joggers", name: "Joggers", slug: "joggers", subtitle: "Street Ready", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80&fit=crop&crop=top", sortOrder: 3 },
  { id: "cat_shorts", name: "Shorts", slug: "shorts", subtitle: "Summer Essentials", image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=700&q=80&fit=crop&crop=top", sortOrder: 4 },
  { id: "cat_hoodies", name: "Hoodies", slug: "hoodies", subtitle: "Layer Up", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=80&fit=crop&crop=top", sortOrder: 5 },
  { id: "cat_activewear", name: "Activewear", slug: "activewear", subtitle: "Train in Style", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&q=80&fit=crop&crop=top", sortOrder: 6 },
  { id: "cat_accessories", name: "Accessories", slug: "accessories", subtitle: "Finish the Look", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80&fit=crop&crop=top", sortOrder: 7 },
  { id: "cat_new", name: "New Arrivals", slug: "new-arrivals", subtitle: "Just Landed", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&q=80&fit=crop&crop=top", sortOrder: 8 },
];

const desc = (name: string, cat: string) =>
  `${name} — a Voombaza staple in our ${cat} lineup. Cut for the Gulf climate, finished with premium fabrics, and designed to move from street to evening without effort. Machine washable. Ships across the GCC.`;

export const SEED_PRODUCTS: Product[] = [
  { id: "prod_1", name: "Classic Oversized Tee", slug: "classic-oversized-tee", description: desc("Classic Oversized Tee", "T-Shirts"), category: "T-Shirts", categorySlug: "t-shirts", price: 89, compareAtPrice: null, badge: "BESTSELLER", images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80&fit=crop&crop=top"], sku: "VB-TS-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "White", "Sand"], stock: 42, status: "active", createdAt: "2026-08-12T10:00:00.000Z" },
  { id: "prod_2", name: "Graphic Street Tee", slug: "graphic-street-tee", description: desc("Graphic Street Tee", "T-Shirts"), category: "T-Shirts", categorySlug: "t-shirts", price: 99, compareAtPrice: 139, badge: "SALE", images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=80&fit=crop&crop=top"], sku: "VB-TS-002", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Olive"], stock: 18, status: "active", createdAt: "2026-08-14T10:00:00.000Z" },
  { id: "prod_3", name: "Drop Shoulder Tee", slug: "drop-shoulder-tee", description: desc("Drop Shoulder Tee", "T-Shirts"), category: "T-Shirts", categorySlug: "t-shirts", price: 109, compareAtPrice: null, badge: "NEW", images: ["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80&fit=crop&crop=top"], sku: "VB-TS-003", sizes: ["S", "M", "L", "XL"], colors: ["Ivory", "Black"], stock: 30, status: "active", createdAt: "2026-09-01T10:00:00.000Z" },
  { id: "prod_4", name: "Solid Crew Neck Tee", slug: "solid-crew-neck-tee", description: desc("Solid Crew Neck Tee", "T-Shirts"), category: "T-Shirts", categorySlug: "t-shirts", price: 79, compareAtPrice: null, badge: null, images: ["https://images.unsplash.com/photo-1503341338985-95f13b926738?w=900&q=80&fit=crop&crop=top"], sku: "VB-TS-004", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["White", "Navy"], stock: 55, status: "active", createdAt: "2026-07-20T10:00:00.000Z" },
  { id: "prod_5", name: "Smart Oxford Shirt", slug: "smart-oxford-shirt", description: desc("Smart Oxford Shirt", "Shirts"), category: "Shirts", categorySlug: "shirts", price: 159, compareAtPrice: null, badge: null, images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80&fit=crop&crop=top"], sku: "VB-SH-001", sizes: ["S", "M", "L", "XL"], colors: ["White", "Sky"], stock: 22, status: "active", createdAt: "2026-08-02T10:00:00.000Z" },
  { id: "prod_6", name: "Relaxed Linen Shirt", slug: "relaxed-linen-shirt", description: desc("Relaxed Linen Shirt", "Shirts"), category: "Shirts", categorySlug: "shirts", price: 179, compareAtPrice: null, badge: "NEW", images: ["https://images.unsplash.com/photo-1542271026-7eec264c27ff?w=900&q=80&fit=crop&crop=top"], sku: "VB-SH-002", sizes: ["S", "M", "L", "XL"], colors: ["Sand", "Olive"], stock: 16, status: "active", createdAt: "2026-09-04T10:00:00.000Z" },
  { id: "prod_7", name: "Structured Overshirt", slug: "structured-overshirt", description: desc("Structured Overshirt", "Shirts"), category: "Shirts", categorySlug: "shirts", price: 249, compareAtPrice: null, badge: "BESTSELLER", images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&q=80&fit=crop&crop=top"], sku: "VB-SH-003", sizes: ["M", "L", "XL"], colors: ["Khaki", "Black"], stock: 11, status: "active", createdAt: "2026-08-18T10:00:00.000Z" },
  { id: "prod_8", name: "Cuban Collar Shirt", slug: "cuban-collar-shirt", description: desc("Cuban Collar Shirt", "Shirts"), category: "Shirts", categorySlug: "shirts", price: 199, compareAtPrice: 259, badge: "SALE", images: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900&q=80&fit=crop&crop=top"], sku: "VB-SH-004", sizes: ["S", "M", "L", "XL"], colors: ["Cream", "Black"], stock: 9, status: "active", createdAt: "2026-08-22T10:00:00.000Z" },
  { id: "prod_9", name: "Urban Cargo Jogger", slug: "urban-cargo-jogger", description: desc("Urban Cargo Jogger", "Joggers"), category: "Joggers", categorySlug: "joggers", price: 199, compareAtPrice: 269, badge: "SALE", images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80&fit=crop&crop=top"], sku: "VB-JG-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Olive"], stock: 24, status: "active", createdAt: "2026-08-08T10:00:00.000Z" },
  { id: "prod_10", name: "Tech Fleece Jogger", slug: "tech-fleece-jogger", description: desc("Tech Fleece Jogger", "Joggers"), category: "Joggers", categorySlug: "joggers", price: 229, compareAtPrice: null, badge: "NEW", images: ["https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=900&q=80&fit=crop&crop=top"], sku: "VB-JG-002", sizes: ["S", "M", "L", "XL"], colors: ["Charcoal", "Navy"], stock: 14, status: "active", createdAt: "2026-09-06T10:00:00.000Z" },
  { id: "prod_11", name: "Slim Tapered Sweatpant", slug: "slim-tapered-sweatpant", description: desc("Slim Tapered Sweatpant", "Joggers"), category: "Joggers", categorySlug: "joggers", price: 189, compareAtPrice: null, badge: null, images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=80&fit=crop&crop=top"], sku: "VB-JG-003", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Grey"], stock: 20, status: "active", createdAt: "2026-07-28T10:00:00.000Z" },
  { id: "prod_12", name: "Cargo Utility Shorts", slug: "cargo-utility-shorts", description: desc("Cargo Utility Shorts", "Shorts"), category: "Shorts", categorySlug: "shorts", price: 139, compareAtPrice: null, badge: "NEW", images: ["https://images.unsplash.com/photo-1562157873-818bc0726f68?w=900&q=80&fit=crop&crop=top"], sku: "VB-ST-001", sizes: ["S", "M", "L", "XL"], colors: ["Khaki", "Black"], stock: 27, status: "active", createdAt: "2026-09-02T10:00:00.000Z" },
  { id: "prod_13", name: "Athletic Training Shorts", slug: "athletic-training-shorts", description: desc("Athletic Training Shorts", "Shorts"), category: "Shorts", categorySlug: "shorts", price: 119, compareAtPrice: 159, badge: "SALE", images: ["https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=900&q=80&fit=crop&crop=top"], sku: "VB-ST-002", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy"], stock: 33, status: "active", createdAt: "2026-08-05T10:00:00.000Z" },
  { id: "prod_14", name: "Drop Shoulder Hoodie", slug: "drop-shoulder-hoodie", description: desc("Drop Shoulder Hoodie", "Hoodies"), category: "Hoodies", categorySlug: "hoodies", price: 259, compareAtPrice: 349, badge: "TRENDING", images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=80&fit=crop&crop=top"], sku: "VB-HD-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Stone"], stock: 13, status: "active", createdAt: "2026-08-25T10:00:00.000Z" },
  { id: "prod_15", name: "Premium Zip-Up Hoodie", slug: "premium-zip-up-hoodie", description: desc("Premium Zip-Up Hoodie", "Hoodies"), category: "Hoodies", categorySlug: "hoodies", price: 299, compareAtPrice: null, badge: null, images: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80&fit=crop&crop=top"], sku: "VB-HD-002", sizes: ["M", "L", "XL"], colors: ["Grey", "Black"], stock: 8, status: "active", createdAt: "2026-07-15T10:00:00.000Z" },
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: "cust_aisha", email: "aisha@example.com", fullName: "Aisha Al-Thani", phone: "+974 5555 0101", role: "customer", passwordHash: hashPassword("password123"), createdAt: "2026-06-12T09:00:00.000Z" },
  { id: "cust_omar", email: "omar@example.com", fullName: "Omar Hassan", phone: "+971 50 555 0202", role: "customer", passwordHash: hashPassword("password123"), createdAt: "2026-07-03T09:00:00.000Z" },
  { id: "cust_sara", email: "sara@example.com", fullName: "Sara Khan", phone: "+966 55 555 0303", role: "customer", passwordHash: hashPassword("password123"), createdAt: "2026-08-19T09:00:00.000Z" },
];

export const SEED_ORDERS: Order[] = [
  {
    id: "ord_1",
    orderNumber: "VB-1042",
    customerId: "cust_aisha",
    email: "aisha@example.com",
    customerName: "Aisha Al-Thani",
    status: "paid",
    items: [
      { productId: "prod_1", name: "Classic Oversized Tee", slug: "classic-oversized-tee", image: SEED_PRODUCTS[0].images[0], price: 89, quantity: 2, size: "M", color: "Black" },
      { productId: "prod_9", name: "Urban Cargo Jogger", slug: "urban-cargo-jogger", image: SEED_PRODUCTS[8].images[0], price: 199, quantity: 1, size: "M", color: "Olive" },
    ],
    subtotal: 377,
    shipping: 0,
    total: 377,
    shippingAddress: { line1: "West Bay, Tower 12", city: "Doha", country: "Qatar", phone: "+974 5555 0101" },
    notes: "",
    createdAt: "2026-09-11T14:20:00.000Z",
  },
  {
    id: "ord_2",
    orderNumber: "VB-1041",
    customerId: "cust_omar",
    email: "omar@example.com",
    customerName: "Omar Hassan",
    status: "processing",
    items: [
      { productId: "prod_14", name: "Drop Shoulder Hoodie", slug: "drop-shoulder-hoodie", image: SEED_PRODUCTS[13].images[0], price: 259, quantity: 1, size: "L", color: "Black" },
    ],
    subtotal: 259,
    shipping: 0,
    total: 259,
    shippingAddress: { line1: "Marina Walk, Apt 804", city: "Dubai", country: "UAE", phone: "+971 50 555 0202" },
    notes: "Leave with reception",
    createdAt: "2026-09-10T11:05:00.000Z",
  },
  {
    id: "ord_3",
    orderNumber: "VB-1040",
    customerId: "cust_sara",
    email: "sara@example.com",
    customerName: "Sara Khan",
    status: "shipped",
    items: [
      { productId: "prod_6", name: "Relaxed Linen Shirt", slug: "relaxed-linen-shirt", image: SEED_PRODUCTS[5].images[0], price: 179, quantity: 1, size: "S", color: "Sand" },
      { productId: "prod_12", name: "Cargo Utility Shorts", slug: "cargo-utility-shorts", image: SEED_PRODUCTS[11].images[0], price: 139, quantity: 1, size: "S", color: "Khaki" },
    ],
    subtotal: 318,
    shipping: 0,
    total: 318,
    shippingAddress: { line1: "Al Olaya District", city: "Riyadh", country: "KSA", phone: "+966 55 555 0303" },
    notes: "",
    createdAt: "2026-09-08T16:40:00.000Z",
  },
  {
    id: "ord_4",
    orderNumber: "VB-1039",
    customerId: "cust_aisha",
    email: "aisha@example.com",
    customerName: "Aisha Al-Thani",
    status: "delivered",
    items: [
      { productId: "prod_5", name: "Smart Oxford Shirt", slug: "smart-oxford-shirt", image: SEED_PRODUCTS[4].images[0], price: 159, quantity: 1, size: "M", color: "White" },
    ],
    subtotal: 159,
    shipping: 25,
    total: 184,
    shippingAddress: { line1: "The Pearl, Porto Arabia", city: "Doha", country: "Qatar", phone: "+974 5555 0101" },
    notes: "",
    createdAt: "2026-09-02T09:15:00.000Z",
  },
  {
    id: "ord_5",
    orderNumber: "VB-1038",
    customerId: null,
    email: "guest@example.com",
    customerName: "Guest Checkout",
    status: "pending",
    items: [
      { productId: "prod_2", name: "Graphic Street Tee", slug: "graphic-street-tee", image: SEED_PRODUCTS[1].images[0], price: 99, quantity: 1, size: "L", color: "Black" },
    ],
    subtotal: 99,
    shipping: 25,
    total: 124,
    shippingAddress: { line1: "Salmiya Block 3", city: "Kuwait City", country: "Kuwait" },
    notes: "",
    createdAt: "2026-09-12T18:00:00.000Z",
  },
];
