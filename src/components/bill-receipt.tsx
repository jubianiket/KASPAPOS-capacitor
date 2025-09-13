"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";

import type { Order, Restaurant, OrderItem } from '@/types';

interface BillProps {
  order: Order;
  settings: Restaurant | null;
}

export const BillReceipt = ({ order, settings }: { order: Order; settings: Restaurant | null }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  // Print
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // WhatsApp Share
  const shareOnWhatsApp = async () => {
    const node = document.getElementById("receipt-content");
    if (!node) return;

    const clone = node.cloneNode(true) as HTMLElement;

    // Fix QR image
    const qr = clone.querySelector("img[alt='QR Code']") as HTMLImageElement;
    if (qr && settings?.qr_code_url) {
      qr.src = settings.qr_code_url;
    }

    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.visibility = "hidden";
    wrapper.style.background = "white";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 200));

    // Capture
    const dataUrl = await htmlToImage.toPng(clone, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "white",
      style: {
        width: "272px",
        fontFamily: "'Inconsolata', monospace",
        fontSize: "14px",
        lineHeight: "1.4",
      },
      filter: (node) =>
        !(node instanceof Element && node.classList.contains("receipt-actions")),
    });

    document.body.removeChild(wrapper);

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `receipt-${order.id}.png`, { type: "image/png" });

    if (navigator.share) {
      await navigator.share({
        title: `Order Receipt #${order.id}`,
        files: [file],
      });
    } else {
      const waUrl = `https://wa.me/?text=Order%20Receipt%20#${order.id}`;
      window.open(waUrl, "_blank");
    }
  };

  if (!settings) return null;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Receipt */}
      <div
        id="receipt-content"
        ref={componentRef}
        className="bg-white p-2 text-[14px] font-mono"
        style={{ width: "272px" }}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h2 className="font-bold text-[16px]">{settings?.restaurant_name}</h2>
          <p>Receipt #{order.id}</p>
          <p className="mt-1">Scan to Pay</p>
          {settings?.qr_code_url && (
            <img
              src={settings.qr_code_url}
              alt="QR Code"
              className="mx-auto my-2"
              style={{ width: "120px", height: "120px" }}
            />
          )}
        </div>

        <p>--------------------------------</p>
        <p>
          Date: {new Date().toLocaleString()}{" "}
          {order.table_number && `Table: ${order.table_number}`}
        </p>
        <p>Type: {order.order_type.toUpperCase()}</p>
        <p>--------------------------------</p>

        {/* Items */}
        <p className="font-bold">Item            Amount</p>
        <p>--------------------------------</p>
        {order.items.map((item) => (
          <div key={item.id}>
            <p>{item.name}</p>
            <p>
              {item.quantity} x Rs.{item.rate.toFixed(2)}{" "}
              <span className="float-right">
                Rs.{(item.rate * item.quantity).toFixed(2)}
              </span>
            </p>
          </div>
        ))}

        <p>--------------------------------</p>

        {/* Totals */}
        <p>
          Subtotal{" "}
          <span className="float-right">Rs.{order.subtotal.toFixed(2)}</span>
        </p>
        <p>
          Tax <span className="float-right">Rs.{order.tax.toFixed(2)}</span>
        </p>
        <p>--------------------------------</p>
        <p className="font-bold">
          Total: <span className="float-right">Rs.{order.total.toFixed(2)}</span>
        </p>
        <p>--------------------------------</p>

        {/* Payment */}
        <p className="text-center">
          Paid via: {order.payment_method || "Cash"}
        </p>

        <p>--------------------------------</p>

        {/* Footer */}
        <p className="text-center">{settings?.address}</p>
        <p className="text-center">Thank you for your visit!</p>
      </div>

      {/* Actions */}
      <div className="receipt-actions flex justify-between mt-4">
        <Button onClick={handlePrint} size="sm" className="flex items-center gap-1">
          <Printer size={16} /> Print
        </Button>
        <Button
          onClick={shareOnWhatsApp}
          size="sm"
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
        >
          <Share2 size={16} /> WhatsApp
        </Button>
      </div>
    </div>
  );
};


