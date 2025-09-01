
"use client";

import OrderHistory from '@/components/order-history';

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      <OrderHistory />
    </div>
  );
}
