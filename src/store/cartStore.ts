import { create } from "zustand";

export interface CartProduct {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  prescriptionRequired: boolean;
  stock: number;
  maxQuantity: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: CartProduct) => void;
  removeItem: (productId: number) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product) => {
    const existingItem = get().items.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + 1;

      if (
        nextQuantity > existingItem.product.maxQuantity ||
        nextQuantity > existingItem.product.stock
      ) {
        return;
      }

      set({
        items: get().items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQuantity }
            : item
        ),
      });

      return;
    }

    set({
      items: [...get().items, { product, quantity: 1 }],
    });
  },

  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.product.id !== productId),
    });
  },

  increaseQuantity: (productId) => {
    set({
      items: get().items.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        const nextQuantity = item.quantity + 1;

        if (
          nextQuantity > item.product.maxQuantity ||
          nextQuantity > item.product.stock
        ) {
          return item;
        }

        return { ...item, quantity: nextQuantity };
      }),
    });
  },

  decreaseQuantity: (productId) => {
    set({
      items: get()
        .items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },
}));
