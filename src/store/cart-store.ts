/**
 * Cart state (Zustand) with localStorage persistence.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, PortionSize } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "price"> & { priceNormal: number; priceFull: number }) => void;
  updateQuantity: (menuItemId: string, portion: PortionSize, quantity: number) => void;
  removeItem: (menuItemId: string, portion: PortionSize) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (payload) => {
        const price = payload.portion === "FULL" ? payload.priceFull : payload.priceNormal;
        set((state) => {
          const existing = state.items.find(
            (i) => i.menuItemId === payload.menuItemId && i.portion === payload.portion
          );
          const rest = state.items.filter(
            (i) => !(i.menuItemId === payload.menuItemId && i.portion === payload.portion)
          );
          const newItem: CartItem = {
            menuItemId: payload.menuItemId,
            name: payload.name,
            portion: payload.portion,
            quantity: existing ? existing.quantity + payload.quantity : payload.quantity,
            price,
          };
          return { items: [...rest, newItem] };
        });
      },
      updateQuantity: (menuItemId, portion, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) => !(i.menuItemId === menuItemId && i.portion === portion)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.menuItemId === menuItemId && i.portion === portion
                ? { ...i, quantity }
                : i
            ),
          };
        });
      },
      removeItem: (menuItemId, portion) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.menuItemId === menuItemId && i.portion === portion)
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "mamas-kitchen-cart" }
  )
);
