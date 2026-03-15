"use client";

import { useEffect, useState } from "react";
import { subscribeToOrderStatus } from "@/lib/pusher-client";
import { OrderStatusStepper } from "./OrderStatusStepper";

interface LiveOrderStatusProps {
  orderId: string;
  initialStatus: string;
}

export function LiveOrderStatus({ orderId, initialStatus }: LiveOrderStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const unsubscribe = subscribeToOrderStatus(orderId, (payload) => {
      setStatus(payload.order_status);
    });
    return unsubscribe;
  }, [orderId]);

  return <OrderStatusStepper currentStatus={status} />;
}
