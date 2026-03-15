/**
 * Shared types for Mama's Kitchen.
 */

export type PortionSize = "NORMAL" | "FULL";
export type PaymentMethod = "CARD" | "LANKA_QR" | "CASH";
export type MealCategory = "BREAKFAST" | "LUNCH" | "DINNER";

export interface CartItem {
  menuItemId: string;
  name: string;
  portion: PortionSize;
  quantity: number;
  price: number; // per unit
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string | null;
  priceNormal: number;
  priceFull: number;
  category: MealCategory;
  image: string | null;
  availability: boolean;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  location: { id: string; name: string; slug: string };
  deliveryNote: string | null;
  specialNote: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  orderStatus: string;
  mealType: MealCategory;
  createdAt: string;
  orderItems: Array<{
    id: string;
    portion: PortionSize;
    quantity: number;
    price: number;
    menuItem: MenuItemResponse;
  }>;
}
