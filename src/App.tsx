import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "customer" | "admin";
type ScreenRole = Role | null;

type Category =
  | "All"
  | "Pain Relief"
  | "Cold & Cough"
  | "Vitamins"
  | "First Aid"
  | "Diabetes Care"
  | "Personal Care";

type OrderStatus =
  | "Placed"
  | "Pharmacist Checking"
  | "Approved"
  | "Packed"
  | "Out for Delivery"
  | "Delivered"
  | "Rejected"
  | "Cancelled";

type PrescriptionStatus = "Not Required" | "Pending" | "Verified" | "Rejected";

interface Product {
  id: number;
  name: string;
  category: Exclude<Category, "All">;
  description: string;
  price: number;
  originalPrice: number;
  prescriptionRequired: boolean;
  stock: number;
  maxQuantity: number;
  isActive?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type TicketStatus = "Open" | "In Review" | "Resolved";

interface SupportTicket {
  id: string;
  issueType: string;
  message: string;
  status: TicketStatus;
  adminReply: string;
  createdAt: string;
}

interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  preferredSlot: string;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  deliverySlot: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  finalTotal: number;
  status: OrderStatus;
  prescriptionUploaded: boolean;
  prescriptionStatus: PrescriptionStatus;
  createdAt: string;
}

const STORAGE_ROLE = "medicart_logged_role";
const STORAGE_PRODUCTS = "medicart_products_v2";
const STORAGE_ORDERS = "medicart_orders_v2";
const STORAGE_PROFILE = "medicart_customer_profile_v1";
const STORAGE_TICKETS = "medicart_support_tickets_v1";

const categories: Category[] = [
  "All",
  "Pain Relief",
  "Cold & Cough",
  "Vitamins",
  "First Aid",
  "Diabetes Care",
  "Personal Care"
];

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Paracetamol 500 mg",
    category: "Pain Relief",
    description:
      "Relief from mild fever, headache and body pain. Order only as directed.",
    price: 35,
    originalPrice: 42,
    prescriptionRequired: false,
    stock: 24,
    maxQuantity: 5
  },
  {
    id: 2,
    name: "Cold Relief Tablets",
    category: "Cold & Cough",
    description:
      "Temporary support for cold symptoms, sneezing and nasal discomfort.",
    price: 68,
    originalPrice: 80,
    prescriptionRequired: false,
    stock: 18,
    maxQuantity: 4
  },
  {
    id: 3,
    name: "Vitamin C 500 mg",
    category: "Vitamins",
    description:
      "Chewable vitamin C tablets for everyday nutritional support.",
    price: 149,
    originalPrice: 180,
    prescriptionRequired: false,
    stock: 30,
    maxQuantity: 6
  },
  {
    id: 4,
    name: "Digital Thermometer",
    category: "First Aid",
    description:
      "Easy-to-read digital thermometer for home temperature checking.",
    price: 249,
    originalPrice: 299,
    prescriptionRequired: false,
    stock: 12,
    maxQuantity: 2
  },
  {
    id: 5,
    name: "Antiseptic Liquid",
    category: "First Aid",
    description:
      "Antiseptic liquid for external use. Follow label instructions carefully.",
    price: 112,
    originalPrice: 130,
    prescriptionRequired: false,
    stock: 20,
    maxQuantity: 4
  },
  {
    id: 6,
    name: "Prescription Antibiotic Demo",
    category: "Cold & Cough",
    description:
      "Prescription-only product. Requires prescription upload before checkout.",
    price: 220,
    originalPrice: 245,
    prescriptionRequired: true,
    stock: 8,
    maxQuantity: 2
  },
  {
    id: 7,
    name: "Glucose Test Strips",
    category: "Diabetes Care",
    description:
      "Blood glucose test strips for compatible monitoring devices.",
    price: 699,
    originalPrice: 760,
    prescriptionRequired: false,
    stock: 10,
    maxQuantity: 3
  },
  {
    id: 8,
    name: "Moisturising Skin Lotion",
    category: "Personal Care",
    description:
      "Daily moisturising lotion suitable for normal to dry skin.",
    price: 189,
    originalPrice: 225,
    prescriptionRequired: false,
    stock: 16,
    maxQuantity: 3
  },
  {
    id: 9,
    name: "ORS Hydration Sachets",
    category: "First Aid",
    description:
      "Oral rehydration sachets for hydration support during fluid loss.",
    price: 99,
    originalPrice: 120,
    prescriptionRequired: false,
    stock: 35,
    maxQuantity: 5
  },
  {
    id: 10,
    name: "Senior Multivitamin",
    category: "Vitamins",
    description:
      "Daily multivitamin demo product designed for elderly wellness support.",
    price: 349,
    originalPrice: 399,
    prescriptionRequired: false,
    stock: 14,
    maxQuantity: 2
  }
];

const minimumOrderAmount = 149;

function money(value: number) {
  return `Rs. ${value}`;
}

function readProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  } catch {
    return initialProducts;
  }
}

function readOrders(): Order[] {
  try {
    const saved = localStorage.getItem(STORAGE_ORDERS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function readTickets(): SupportTicket[] {
  try {
    const saved = localStorage.getItem(STORAGE_TICKETS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function readRole(): ScreenRole {
  const saved = localStorage.getItem(STORAGE_ROLE);
  return saved === "customer" || saved === "admin" ? saved : null;
}

function readProfile(): CustomerProfile {
  try {
    const saved = localStorage.getItem(STORAGE_PROFILE);
    return saved
      ? JSON.parse(saved)
      : {
          name: "",
          phone: "",
          address: "",
          preferredSlot: "Today, 6 PM - 8 PM"
        };
  } catch {
    return {
      name: "",
      phone: "",
      address: "",
      preferredSlot: "Today, 6 PM - 8 PM"
    };
  }
}

function App() {
  const [role, setRole] = useState<ScreenRole>(readRole);
  const [loginType, setLoginType] = useState<Role>("customer");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>(readProducts);
  const [orders, setOrders] = useState<Order[]>(readOrders);
  const [tickets, setTickets] = useState<SupportTicket[]>(readTickets);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<CustomerProfile>(readProfile);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [sortMode, setSortMode] = useState("featured");
  const [prescriptionFilter, setPrescriptionFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [announcement, setAnnouncement] = useState("");
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [medicalConsent, setMedicalConsent] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState("Today, 6 PM - 8 PM");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminPrescriptionFilter, setAdminPrescriptionFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === STORAGE_PRODUCTS) setProducts(readProducts());
      if (event.key === STORAGE_ORDERS) setOrders(readOrders());
      if (event.key === STORAGE_TICKETS) setTickets(readTickets());
      if (event.key === STORAGE_ROLE) setRole(readRole());
    };

    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const categoryMatch =
        selectedCategory === "All" || product.category === selectedCategory;

      const searchMatch =
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const prescriptionMatch =
        prescriptionFilter === "all" ||
        (prescriptionFilter === "rx" && product.prescriptionRequired) ||
        (prescriptionFilter === "otc" && !product.prescriptionRequired);

      const stockMatch =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && product.stock > 0) ||
        (stockFilter === "low-stock" && product.stock > 0 && product.stock <= 5);

      return categoryMatch && searchMatch && prescriptionMatch && stockMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "price-low") return a.price - b.price;
      if (sortMode === "price-high") return b.price - a.price;
      if (sortMode === "stock-high") return b.stock - a.stock;
      if (sortMode === "stock-low") return a.stock - b.stock;
      return a.id - b.id;
    });
  }, [
    products,
    search,
    selectedCategory,
    sortMode,
    prescriptionFilter,
    stockFilter
  ]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = cartTotal >= 499 || cartTotal === 0 ? 0 : 39;
  const platformFee = cartTotal > 0 ? 9 : 0;
  const finalTotal = cartTotal + deliveryFee + platformFee;

  const hasPrescriptionMedicine = cart.some(
    (item) => item.product.prescriptionRequired
  );

  const latestOrder = orders[0];

  const filteredAdminOrders = useMemo(() => {
    const query = adminOrderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const searchMatch =
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query);

      const statusMatch =
        adminStatusFilter === "all" || order.status === adminStatusFilter;

      const prescriptionMatch =
        adminPrescriptionFilter === "all" ||
        (adminPrescriptionFilter === "pending" &&
          order.prescriptionStatus === "Pending") ||
        (adminPrescriptionFilter === "verified" &&
          order.prescriptionStatus === "Verified") ||
        (adminPrescriptionFilter === "not-required" &&
          order.prescriptionStatus === "Not Required") ||
        (adminPrescriptionFilter === "rejected" &&
          order.prescriptionStatus === "Rejected");

      return searchMatch && statusMatch && prescriptionMatch;
    });
  }, [
    orders,
    adminOrderSearch,
    adminStatusFilter,
    adminPrescriptionFilter
  ]);

  const createSupportTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const ticket: SupportTicket = {
      id: `TK-${Date.now().toString().slice(-6)}`,
      issueType: String(form.get("issueType") || "General"),
      message: String(form.get("ticketMessage") || "").trim(),
      status: "Open",
      adminReply: "",
      createdAt: new Date().toLocaleString()
    };

    if (!ticket.message) {
      setAnnouncement("Please enter a support message.");
      return;
    }

    setTickets((currentTickets) => [ticket, ...currentTickets]);
    event.currentTarget.reset();
    setAnnouncement(`Support ticket ${ticket.id} created.`);
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );

    setAnnouncement(`Ticket ${ticketId} updated to ${status}.`);
  };

  const replyToTicket = (event: FormEvent<HTMLFormElement>, ticketId: string) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const reply = String(form.get("adminReply") || "").trim();

    if (!reply) {
      setAnnouncement("Please enter a reply.");
      return;
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, adminReply: reply, status: "In Review" }
          : ticket
      )
    );

    event.currentTarget.reset();
    setAnnouncement(`Reply added to ticket ${ticketId}.`);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const updatedProfile: CustomerProfile = {
      name: String(form.get("profileName") || "").trim(),
      phone: String(form.get("profilePhone") || "").trim(),
      address: String(form.get("profileAddress") || "").trim(),
      preferredSlot: String(form.get("profileSlot") || "Today, 6 PM - 8 PM")
    };

    setProfile(updatedProfile);
    setDeliverySlot(updatedProfile.preferredSlot);
    setAnnouncement("Profile saved successfully.");
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "").trim();

    const validCustomer =
      loginType === "customer" &&
      username === "customer" &&
      password === "customer123";

    const validAdmin =
      loginType === "admin" &&
      username === "admin" &&
      password === "admin123";

    if (!validCustomer && !validAdmin) {
      setLoginError("Invalid username or password.");
      return;
    }

    localStorage.setItem(STORAGE_ROLE, loginType);
    setRole(loginType);
    setLoginError("");
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_ROLE);
    setRole(null);
    setCart([]);
    setLoginError("");
  };

  const getCartQuantity = (productId: number) => {
    return cart.find((item) => item.product.id === productId)?.quantity ?? 0;
  };

  const addToCart = (product: Product) => {
    const currentQuantity = getCartQuantity(product.id);

    if (product.stock <= 0) {
      setAnnouncement(`${product.name} is out of stock.`);
      return;
    }

    if (currentQuantity >= product.maxQuantity || currentQuantity >= product.stock) {
      setAnnouncement(`Order limit reached for ${product.name}.`);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id
      );

      if (!existingItem) return [...currentCart, { product, quantity: 1 }];

      return currentCart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });

    setAnnouncement(`${product.name} added to cart.`);
  };

  const decreaseQuantity = (productId: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId)
    );
  };

  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    if (cart.length === 0) {
      setAnnouncement("Cart is empty. Add medicines first.");
      return;
    }

    if (cartTotal < minimumOrderAmount) {
      setAnnouncement(`Minimum order amount is ${money(minimumOrderAmount)}.`);
      return;
    }

    if (hasPrescriptionMedicine && !prescriptionUploaded) {
      setAnnouncement("Prescription upload is required for Rx medicines.");
      return;
    }

    if (!medicalConsent) {
      setAnnouncement("Please accept the demo medical disclaimer.");
      return;
    }

    const order: Order = {
      id: `MC-${Date.now().toString().slice(-6)}`,
      customerName: String(form.get("customerName") || "Customer"),
      phone: String(form.get("customerPhone") || ""),
      address: String(form.get("deliveryAddress") || ""),
      deliverySlot,
      paymentMethod,
      items: cart,
      subtotal: cartTotal,
      finalTotal,
      status: "Placed",
      prescriptionUploaded,
      prescriptionStatus: hasPrescriptionMedicine ? "Pending" : "Not Required",
      createdAt: new Date().toLocaleString()
    };

    setOrders((currentOrders) => [order, ...currentOrders]);
    setCart([]);
    setPrescriptionUploaded(false);
    setMedicalConsent(false);
    setAnnouncement(`Order ${order.id} placed successfully.`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    setAnnouncement(`Order ${orderId} changed to ${status}.`);
  };

  const approveOrderAndReduceStock = (order: Order) => {
    if (order.status !== "Placed" && order.status !== "Pharmacist Checking") {
      setAnnouncement(`Stock already handled or order is not ready for approval.`);
      return;
    }
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const orderedItem = order.items.find(
          (item) => item.product.id === product.id
        );

        if (!orderedItem) return product;

        return {
          ...product,
          stock: Math.max(product.stock - orderedItem.quantity, 0)
        };
      })
    );

    updateOrderStatus(order.id, "Approved");
  };

  const addNewMedicine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const newProduct: Product = {
      id: Date.now(),
      name: String(form.get("medicineName") || "").trim(),
      category: String(form.get("medicineCategory") || "Personal Care") as Exclude<Category, "All">,
      description: String(form.get("medicineDescription") || "").trim(),
      price: Number(form.get("medicinePrice") || 0),
      originalPrice: Number(form.get("medicineOriginalPrice") || 0),
      prescriptionRequired: form.get("prescriptionRequired") === "on",
      stock: Number(form.get("medicineStock") || 0),
      maxQuantity: Number(form.get("medicineMaxQuantity") || 1),
      isActive: true
    };

    if (!newProduct.name || newProduct.price <= 0 || newProduct.stock < 0) {
      setAnnouncement("Please enter valid medicine details.");
      return;
    }

    setProducts((currentProducts) => [newProduct, ...currentProducts]);
    event.currentTarget.reset();
    setAnnouncement(`${newProduct.name} added to inventory.`);
  };

  const toggleMedicineActive = (productId: number) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? { ...product, isActive: product.isActive === false }
          : product
      )
    );

    setAnnouncement("Medicine visibility updated.");
  };

  const updateMedicineDetails = (
    productId: number,
    updates: Partial<Pick<Product, "price" | "originalPrice" | "maxQuantity" | "prescriptionRequired">>
  ) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...updates,
              price: updates.price !== undefined ? Math.max(1, updates.price) : product.price,
              originalPrice:
                updates.originalPrice !== undefined
                  ? Math.max(1, updates.originalPrice)
                  : product.originalPrice,
              maxQuantity:
                updates.maxQuantity !== undefined
                  ? Math.max(1, updates.maxQuantity)
                  : product.maxQuantity
            }
          : product
      )
    );
  };

  const trackingSteps: OrderStatus[] = [
    "Placed",
    "Pharmacist Checking",
    "Approved",
    "Packed",
    "Out for Delivery",
    "Delivered"
  ];

  const getStepState = (orderStatus: OrderStatus, step: OrderStatus) => {
    if (orderStatus === "Cancelled" || orderStatus === "Rejected") {
      return "";
    }

    const currentIndex = trackingSteps.indexOf(orderStatus);
    const stepIndex = trackingSteps.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "";
  };

  const updateStock = (productId: number, stock: number) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, stock) }
          : product
      )
    );
  };

  if (!role) {
    return (
      <main className="login-screen" data-saralo-page="login-page">
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-brand">
            <span className="brand-icon" aria-hidden="true">+</span>
            <div>
              <p className="eyebrow">MediCart Access</p>
              <h1 id="login-heading">Welcome to MediCart</h1>
            </div>
          </div>

          <p>
            Sign in to continue. Customers can order medicines and track deliveries, while administrators can manage stock, prescriptions and order status.
          </p>

          <div className="login-tabs" role="group" aria-label="Choose login type">
            <button
              type="button"
              className={loginType === "customer" ? "active" : ""}
              onClick={() => setLoginType("customer")}
            >
              Customer Login
            </button>
            <button
              type="button"
              className={loginType === "admin" ? "active" : ""}
              onClick={() => setLoginType("admin")}
            >
              Admin Login
            </button>
          </div>

          <form className="login-form" onSubmit={login}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" placeholder="Enter username" />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
            />

            {loginError && <p className="login-error">{loginError}</p>}

            <button type="submit">
              Login as {loginType === "customer" ? "Customer" : "Admin"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (role === "admin") {
    return (
      <div className="app-shell admin-shell" data-saralo-page="admin-dashboard">
        <header className="site-header admin-header">
          <div className="brand-block">
            <span className="brand-icon" aria-hidden="true">+</span>
            <div>
              <a className="brand-name" href="/">MediCart Admin</a>
              <p className="brand-tagline">Orders, inventory and verification</p>
            </div>
          </div>

          <button className="cart-button" type="button" onClick={logout}>
            Logout
          </button>
        </header>

        <main id="main-content">
          <section className="admin-hero">
            <div>
              <p className="eyebrow">Operations dashboard</p>
              <h1>Admin control center</h1>
              <p>
                Review live orders, verify prescription status, approve orders,
                reduce stock and update delivery progress.
              </p>
            </div>

            <div className="admin-status-card">
              <strong>{new Date().toLocaleDateString()}</strong>
              <span>Demo pharmacy shift active</span>
            </div>
          </section>

          <section className="admin-summary">
            <article>
              <strong>{orders.length}</strong>
              <span>Total orders</span>
            </article>
            <article>
              <strong>
                {orders.filter((order) => order.status === "Placed").length}
              </strong>
              <span>New orders</span>
            </article>
            <article>
              <strong>
                {products.filter((product) => product.stock <= 5).length}
              </strong>
              <span>Low stock items</span>
            </article>
            <article>
              <strong>
                {orders.filter((order) => order.status === "Delivered").length}
              </strong>
              <span>Delivered</span>
            </article>

            <article>
              <strong>
                {money(
                  orders.reduce((total, order) => total + order.finalTotal, 0)
                )}
              </strong>
              <span>Total revenue</span>
            </article>

            <article>
              <strong>
                {tickets.filter((ticket) => ticket.status !== "Resolved").length}
              </strong>
              <span>Open tickets</span>
            </article>
          </section>

          <section className="admin-alert-panel">
            <div>
              <p className="eyebrow">Inventory alerts</p>
              <h2>Low stock monitoring</h2>
              <p>
                Items with stock 5 or below need restocking before accepting more orders.
              </p>
            </div>

            <div className="alert-list">
              {products
                .filter((product) => product.stock <= 5)
                .map((product) => (
                  <article key={product.id}>
                    <strong>{product.name}</strong>
                    <span>Only {product.stock} left</span>
                  </article>
                ))}

              {products.filter((product) => product.stock <= 5).length === 0 && (
                <article>
                  <strong>All good</strong>
                  <span>No low-stock products right now.</span>
                </article>
              )}
            </div>
          </section>

          <section className="admin-section">
            <p className="eyebrow">Live order queue</p>
            <h2>Incoming pharmacy orders</h2>

            <div className="admin-filter-panel">
              <div>
                <label htmlFor="admin-order-search">Search orders</label>
                <input
                  id="admin-order-search"
                  value={adminOrderSearch}
                  onChange={(event) => setAdminOrderSearch(event.target.value)}
                  placeholder="Search order ID, name or phone"
                />
              </div>

              <div>
                <label htmlFor="admin-status-filter">Order status</label>
                <select
                  id="admin-status-filter"
                  value={adminStatusFilter}
                  onChange={(event) => setAdminStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="Placed">Placed</option>
                  <option value="Pharmacist Checking">Pharmacist Checking</option>
                  <option value="Approved">Approved</option>
                  <option value="Packed">Packed</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="admin-prescription-filter">Prescription status</label>
                <select
                  id="admin-prescription-filter"
                  value={adminPrescriptionFilter}
                  onChange={(event) =>
                    setAdminPrescriptionFilter(event.target.value)
                  }
                >
                  <option value="all">All prescriptions</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="not-required">Not required</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <p className="admin-result-count">
              Showing {filteredAdminOrders.length} of {orders.length} orders
            </p>

            {filteredAdminOrders.length === 0 ? (
              <div className="empty-state">
                <h3>No orders yet</h3>
                <p>Place an order from customer dashboard to see it here.</p>
              </div>
            ) : (
              <div className="admin-order-list">
                {filteredAdminOrders.map((order) => (
                  <article className="admin-order-card" key={order.id}>
                    <div>
                      <h3>{order.id}</h3>
                      <p>{order.customerName} · {order.phone}</p>
                      <p>{order.address}</p>
                      <p>{order.createdAt}</p>
                    </div>

                    <div>
                      <strong>{money(order.finalTotal)}</strong>
                      <p>Status: {order.status}</p>
                      <p>Slot: {order.deliverySlot}</p>
                      <p>Payment: {order.paymentMethod}</p>
                      <p>
                        Prescription:{" "}
                        {order.prescriptionUploaded ? "Uploaded" : "Not needed"}
                      </p>
                    </div>

                    <ul>
                      {order.items.map((item) => (
                        <li key={item.product.id}>
                          {item.product.name} x {item.quantity}
                        </li>
                      ))}
                    </ul>

                    <div className="admin-actions">
                      <button type="button" onClick={() => updateOrderStatus(order.id, "Pharmacist Checking")}>
                        Start Checking
                      </button>
                      <button type="button" onClick={() => approveOrderAndReduceStock(order)}>
                        Approve & Reduce Stock
                      </button>
                      <button type="button" onClick={() => updateOrderStatus(order.id, "Packed")}>
                        Mark Packed
                      </button>
                      <button type="button" onClick={() => updateOrderStatus(order.id, "Out for Delivery")}>
                        Out for Delivery
                      </button>
                      <button type="button" onClick={() => updateOrderStatus(order.id, "Delivered")}>
                        Delivered
                      </button>
                      <button type="button" onClick={() => updateOrderStatus(order.id, "Rejected")}>
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-section add-medicine-section">
            <p className="eyebrow">Inventory creation</p>
            <h2>Add new medicine</h2>

            <form className="add-medicine-form" onSubmit={addNewMedicine}>
              <label htmlFor="medicine-name">Medicine name</label>
              <input
                id="medicine-name"
                name="medicineName"
                placeholder="Example: Cough Syrup 100 ml"
                required
              />

              <label htmlFor="medicine-category">Category</label>
              <select id="medicine-category" name="medicineCategory">
                <option>Pain Relief</option>
                <option>Cold & Cough</option>
                <option>Vitamins</option>
                <option>First Aid</option>
                <option>Diabetes Care</option>
                <option>Personal Care</option>
              </select>

              <label htmlFor="medicine-description">Description</label>
              <textarea
                id="medicine-description"
                name="medicineDescription"
                placeholder="Short medicine description"
                required
              />

              <div className="form-row">
                <div>
                  <label htmlFor="medicine-price">Selling price</label>
                  <input
                    id="medicine-price"
                    name="medicinePrice"
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="medicine-original-price">MRP</label>
                  <input
                    id="medicine-original-price"
                    name="medicineOriginalPrice"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label htmlFor="medicine-stock">Stock</label>
                  <input
                    id="medicine-stock"
                    name="medicineStock"
                    type="number"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="medicine-limit">Maximum order quantity</label>
                  <input
                    id="medicine-limit"
                    name="medicineMaxQuantity"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" name="prescriptionRequired" />
                Prescription required for this medicine
              </label>

              <button type="submit">Add medicine to inventory</button>
            </form>
          </section>

          <section className="admin-section">
            <p className="eyebrow">Inventory control</p>
            <h2>Medicine stock management</h2>

            <div className="inventory-grid">
              {products.map((product) => (
                <article className="inventory-card enhanced-inventory-card" key={product.id}>
                  <div className="inventory-card-header">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.category}</p>
                    </div>

                    <div className="inventory-pills">
                      <span className={product.prescriptionRequired ? "rx-pill" : "otc-pill"}>
                        {product.prescriptionRequired ? "Rx" : "OTC"}
                      </span>

                      <span className={product.isActive === false ? "inactive-pill" : "active-pill"}>
                        {product.isActive === false ? "Hidden" : "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="inventory-edit-grid">
                    <div>
                      <label htmlFor={`price-${product.id}`}>Selling price</label>
                      <input
                        id={`price-${product.id}`}
                        type="number"
                        min="1"
                        value={product.price}
                        onChange={(event) =>
                          updateMedicineDetails(product.id, {
                            price: Number(event.target.value)
                          })
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor={`mrp-${product.id}`}>MRP</label>
                      <input
                        id={`mrp-${product.id}`}
                        type="number"
                        min="1"
                        value={product.originalPrice}
                        onChange={(event) =>
                          updateMedicineDetails(product.id, {
                            originalPrice: Number(event.target.value)
                          })
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor={`stock-${product.id}`}>Stock</label>
                      <input
                        id={`stock-${product.id}`}
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(event) =>
                          updateStock(product.id, Number(event.target.value))
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor={`limit-${product.id}`}>Order limit</label>
                      <input
                        id={`limit-${product.id}`}
                        type="number"
                        min="1"
                        value={product.maxQuantity}
                        onChange={(event) =>
                          updateMedicineDetails(product.id, {
                            maxQuantity: Number(event.target.value)
                          })
                        }
                      />
                    </div>
                  </div>

                  <label className="inventory-toggle">
                    <input
                      type="checkbox"
                      checked={product.prescriptionRequired}
                      onChange={(event) =>
                        updateMedicineDetails(product.id, {
                          prescriptionRequired: event.target.checked
                        })
                      }
                    />
                    Prescription required
                  </label>

                  <button
                    className={product.isActive === false ? "enable-medicine-button" : "disable-medicine-button"}
                    type="button"
                    onClick={() => toggleMedicineActive(product.id)}
                  >
                    {product.isActive === false ? "Enable medicine" : "Disable medicine"}
                  </button>

                  <p className={product.stock <= 5 ? "low-stock" : "stock-ok"}>
                    {product.stock <= 5
                      ? `Low stock: only ${product.stock} left`
                      : `Available stock: ${product.stock}`}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <div className="sr-only" aria-live="polite">{announcement}</div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-saralo-page="customer-dashboard">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="site-header">
        <div className="brand-block">
          <span className="brand-icon" aria-hidden="true">+</span>
          <div>
            <a className="brand-name" href="/">MediCart</a>
            <p className="brand-tagline">Customer pharmacy dashboard</p>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          <ul className="navigation-list">
            <li><a href="#products">Medicines</a></li>
            <li><a href="#cart">Cart</a></li>
            <li><a href="#checkout">Checkout</a></li>
            <li><a href="#tracking">Track</a></li>
          </ul>
        </nav>

        <button className="cart-button" type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <main id="main-content">
        <section className="hero-section dense-hero">
          <div className="hero-content">
            <p className="eyebrow">Patient medicine ordering</p>
            <h1>Pharmacy ordering dashboard</h1>
            <p>
              Search medicines, review stock, check safety requirements, upload prescriptions and place delivery orders from one dashboard.
            </p>

            <form className="search-form" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="medicine-search">Search medicines</label>
              <div className="search-row">
                <input
                  id="medicine-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search paracetamol, vitamins, diabetes..."
                />
                <button type="submit">Search</button>
              </div>
            </form>
          </div>

          <aside className="prescription-card">
            <span className="prescription-icon" aria-hidden="true">Rx</span>
            <h2>Prescription upload</h2>
            <p>Required for prescription-only products before checkout.</p>
            <button
              type="button"
              onClick={() => {
                setPrescriptionUploaded(true);
                setAnnouncement("Prescription uploaded.");
              }}
            >
              {prescriptionUploaded ? "Prescription uploaded" : "Upload prescription"}
            </button>
          </aside>
        </section>

        <section className="complex-strip">
          <article><strong>Express delivery</strong><span>Selected orders delivered in 25-40 minutes.</span></article>
          <article><strong>Prescription check</strong><span>Rx items require pharmacist verification.</span></article>
          <article><strong>Order limits</strong><span>Quantity restrictions reduce accidental over-ordering.</span></article>
          <article><strong>Support</strong><span>Patient assistance for delivery and product questions.</span></article>
        </section>

        <section className="safety-panel">
          <div>
            <p className="eyebrow">Important patient instructions</p>
            <h2>Safety checklist before placing order</h2>
            <p>
              Review product details, pricing, delivery charges, stock limits and prescription requirements before checkout.
            </p>
          </div>
          <ul>
            <li>Check medicine name and dosage carefully.</li>
            <li>Upload prescription for Rx medicines.</li>
            <li>Confirm address and delivery slot.</li>
            <li>This platform does not provide medical advice.</li>
          </ul>
        </section>

        <section className="category-section">
          <h2>Shop by category</h2>
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? "category-button active" : "category-button"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="profile-section" data-saralo-role="customer-profile">
          <div>
            <p className="eyebrow">Customer profile</p>
            <h2>Saved delivery details</h2>
            <p>
              Save your basic details once and use them automatically during checkout.
            </p>
          </div>

          <form className="profile-form" onSubmit={saveProfile}>
            <div className="form-row">
              <div>
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  name="profileName"
                  defaultValue={profile.name}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="profile-phone">Phone number</label>
                <input
                  id="profile-phone"
                  name="profilePhone"
                  defaultValue={profile.phone}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <label htmlFor="profile-address">Saved address</label>
            <textarea
              id="profile-address"
              name="profileAddress"
              defaultValue={profile.address}
              placeholder="House number, street, city and pincode"
            />

            <label htmlFor="profile-slot">Preferred delivery slot</label>
            <select
              id="profile-slot"
              name="profileSlot"
              defaultValue={profile.preferredSlot}
            >
              <option>Today, 6 PM - 8 PM</option>
              <option>Tomorrow, 9 AM - 11 AM</option>
              <option>Tomorrow, 2 PM - 4 PM</option>
            </select>

            <button type="submit">Save profile</button>
          </form>
        </section>

        <section id="products" className="products-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Available medicines</p>
              <h2>Product catalogue</h2>
            </div>
            <p>{filteredProducts.length} products found</p>
          </div>

          <div className="catalog-controls" aria-label="Product sorting and filters">
            <div>
              <label htmlFor="sort-products">Sort products</label>
              <select
                id="sort-products"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="stock-high">Stock: high to low</option>
                <option value="stock-low">Stock: low to high</option>
              </select>
            </div>

            <div>
              <label htmlFor="prescription-filter">Medicine type</label>
              <select
                id="prescription-filter"
                value={prescriptionFilter}
                onChange={(event) => setPrescriptionFilter(event.target.value)}
              >
                <option value="all">All medicines</option>
                <option value="otc">Non-prescription only</option>
                <option value="rx">Prescription only</option>
              </select>
            </div>

            <div>
              <label htmlFor="stock-filter">Stock status</label>
              <select
                id="stock-filter"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="all">All stock</option>
                <option value="in-stock">In stock only</option>
                <option value="low-stock">Low stock only</option>
              </select>
            </div>
          </div>

          <div className="policy-strip">
            <span>Minimum order: {money(minimumOrderAmount)}</span>
            <span>Free delivery above Rs. 499</span>
            <span>Rx products need prescription</span>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => {
              const quantityInCart = getCartQuantity(product.id);
              const limitReached =
                product.stock <= 0 ||
                quantityInCart >= product.maxQuantity ||
                quantityInCart >= product.stock;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image" aria-hidden="true">
                    <span>{product.name.charAt(0)}</span>
                  </div>

                  <div className="product-card-content">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>

                    <div className="medicine-meta">
                      <span>Stock: {product.stock}</span>
                      <span>Limit: {product.maxQuantity}</span>
                    </div>

                    {product.prescriptionRequired && (
                      <p className="prescription-badge">Prescription required</p>
                    )}

                    <div className="price-row">
                      <strong>{money(product.price)}</strong>
                      <span className="original-price">{money(product.originalPrice)}</span>
                    </div>

                    <div className="product-action-row">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                      >
                        View details
                      </button>

                      <button
                        type="button"
                        disabled={limitReached}
                        onClick={() => addToCart(product)}
                      >
                        {limitReached ? "Unavailable" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="cart" className="cart-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your basket</p>
              <h2>Shopping cart</h2>
            </div>
            <p>{cartCount} items · {money(cartTotal)}</p>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Add products before checkout.</p>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <article className="cart-item" key={item.product.id}>
                  <div>
                    <h3>{item.product.name}</h3>
                    <p>{item.product.category}</p>
                    <strong>{money(item.product.price)}</strong>
                  </div>
                  <div className="quantity-controls">
                    <button type="button" onClick={() => decreaseQuantity(item.product.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => addToCart(item.product)}>+</button>
                  </div>
                  <button className="remove-button" type="button" onClick={() => removeItem(item.product.id)}>
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="checkout" className="checkout-section">
          <div>
            <p className="eyebrow">Checkout rules</p>
            <h2>Delivery and payment details</h2>
            <p>Review your order details before confirming checkout.</p>

            <div className="bill-box">
              <h3>Bill summary</h3>
              <p>Items total: {money(cartTotal)}</p>
              <p>Delivery fee: {money(deliveryFee)}</p>
              <p>Platform fee: {money(platformFee)}</p>
              <strong>Total payable: {money(finalTotal)}</strong>
            </div>
          </div>

          <form className="checkout-form" onSubmit={placeOrder}>
            <label htmlFor="customer-name">Full name</label>
            <input id="customer-name" name="customerName" defaultValue={profile.name} required />

            <label htmlFor="customer-phone">Phone number</label>
            <input id="customer-phone" name="customerPhone" defaultValue={profile.phone} required />

            <label htmlFor="delivery-address">Delivery address</label>
            <textarea id="delivery-address" name="deliveryAddress" defaultValue={profile.address} required />

            <label htmlFor="delivery-slot">Delivery slot</label>
            <select id="delivery-slot" value={deliverySlot} onChange={(event) => setDeliverySlot(event.target.value)}>
              <option>Today, 6 PM - 8 PM</option>
              <option>Tomorrow, 9 AM - 11 AM</option>
              <option>Tomorrow, 2 PM - 4 PM</option>
            </select>

            <label htmlFor="payment-method">Payment method</label>
            <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option>Cash on Delivery</option>
              <option>UPI on Delivery</option>
              <option>Demo Wallet</option>
            </select>

            {hasPrescriptionMedicine && (
              <div className="warning-box">
                Prescription medicine detected. Upload prescription before checkout.
              </div>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={medicalConsent}
                onChange={(event) => setMedicalConsent(event.target.checked)}
              />
              I understand this is a demo website and not medical advice.
            </label>

            <button type="submit">Place demo order</button>
          </form>
        </section>

        <section className="notifications-section" data-saralo-role="customer-notifications">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Notifications</p>
              <h2>Recent updates</h2>
            </div>
            <p>Live account activity</p>
          </div>

          <div className="notification-list">
            {orders.slice(0, 3).map((order) => (
              <article className="notification-card" key={`order-note-${order.id}`}>
                <strong>Order {order.id}</strong>
                <span>Status updated to {order.status}</span>
              </article>
            ))}

            {tickets.slice(0, 3).map((ticket) => (
              <article className="notification-card" key={`ticket-note-${ticket.id}`}>
                <strong>Ticket {ticket.id}</strong>
                <span>
                  {ticket.adminReply
                    ? "Admin has replied to your support request"
                    : `Support ticket is ${ticket.status}`}
                </span>
              </article>
            ))}

            {orders.length === 0 && tickets.length === 0 && (
              <article className="notification-card">
                <strong>No updates yet</strong>
                <span>Your order and support updates will appear here.</span>
              </article>
            )}
          </div>
        </section>

        <section className="support-ticket-section" data-saralo-role="customer-support-tickets">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Support center</p>
              <h2>Raise a support request</h2>
            </div>
            <p>{tickets.length} ticket{tickets.length === 1 ? "" : "s"}</p>
          </div>

          <div className="support-ticket-grid">
            <form className="support-ticket-form" onSubmit={createSupportTicket}>
              <label htmlFor="issue-type">Issue type</label>
              <select id="issue-type" name="issueType">
                <option>Order</option>
                <option>Prescription</option>
                <option>Delivery</option>
                <option>Payment</option>
                <option>Product</option>
                <option>General</option>
              </select>

              <label htmlFor="ticket-message">Message</label>
              <textarea
                id="ticket-message"
                name="ticketMessage"
                placeholder="Describe your issue clearly"
                required
              />

              <button type="submit">Create support ticket</button>
            </form>

            <div className="ticket-list">
              {tickets.length === 0 ? (
                <div className="empty-state">
                  <h3>No support tickets</h3>
                  <p>Your support requests will appear here.</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <div className="ticket-card-header">
                      <div>
                        <h3>{ticket.id}</h3>
                        <p>{ticket.issueType} · {ticket.createdAt}</p>
                      </div>
                      <span className="ticket-status-pill">{ticket.status}</span>
                    </div>

                    <p>{ticket.message}</p>

                    {ticket.adminReply && (
                      <div className="admin-reply-box">
                        <strong>Admin reply</strong>
                        <p>{ticket.adminReply}</p>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="tracking" className="tracking-section" data-saralo-role="customer-order-tracking">
          <p className="eyebrow">Order tracking</p>
          <h2>Your order updates</h2>

          {orders.length === 0 ? (
            <p>No orders placed yet.</p>
          ) : (
            <div className="order-history">
              {filteredAdminOrders.map((order) => (
                <article className="order-history-card" key={order.id}>
                  <div>
                    <h3>{order.id}</h3>
                    <p>Status: {order.status}</p>
                    <p>Total: {money(order.finalTotal)}</p>
                    <p>Placed: {order.createdAt}</p>
                  </div>

                  <ol className="mini-timeline" aria-label={`Tracking timeline for ${order.id}`}>
                    {[
                      "Placed",
                      "Pharmacist Checking",
                      "Approved",
                      "Packed",
                      "Out for Delivery",
                      "Delivered"
                    ].map((step) => (
                      <li
                        key={step}
                        className={
                          step === order.status ||
                          order.status === "Delivered"
                            ? "active"
                            : ""
                        }
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedProduct && (
        <section
          className="medicine-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medicine-detail-title"
        >
          <div className="medicine-modal">
            <div className="medicine-modal-header">
              <div>
                <p className="eyebrow">Medicine information</p>
                <h2 id="medicine-detail-title">{selectedProduct.name}</h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                aria-label="Close medicine details"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </button>
            </div>

            <div className="medicine-detail-grid">
              <div className="medicine-detail-main">
                <p className="product-category">{selectedProduct.category}</p>
                <p>{selectedProduct.description}</p>

                <div className="medicine-price-panel">
                  <strong>{money(selectedProduct.price)}</strong>
                  <span>MRP {money(selectedProduct.originalPrice)}</span>
                </div>

                <div className="medicine-meta">
                  <span>Stock: {selectedProduct.stock}</span>
                  <span>Limit: {selectedProduct.maxQuantity} per order</span>
                  <span>
                    {selectedProduct.prescriptionRequired
                      ? "Prescription required"
                      : "No prescription required"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    selectedProduct.stock <= 0 ||
                    getCartQuantity(selectedProduct.id) >= selectedProduct.maxQuantity ||
                    getCartQuantity(selectedProduct.id) >= selectedProduct.stock
                  }
                  onClick={() => addToCart(selectedProduct)}
                >
                  Add this medicine to cart
                </button>
              </div>

              <aside className="medicine-safety-card">
                <h3>Patient safety notes</h3>
                <ul>
                  <li>Check the medicine name before ordering.</li>
                  <li>Do not exceed the listed order quantity limit.</li>
                  <li>Prescription products require verification.</li>
                  <li>Contact pharmacy support for product questions.</li>
                </ul>

                <div className="delivery-estimate-box">
                  <strong>Estimated delivery</strong>
                  <span>25-40 minutes for available products</span>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <p>
          MediCart provides a structured pharmacy ordering experience with prescription checks, inventory status and delivery tracking.
        </p>
      </footer>

      <div className="sr-only" aria-live="polite">{announcement}</div>
    </div>
  );
}

export default App;












































