
"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import { Share } from '@capacitor/share';
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";

import type { Order, Restaurant } from '@/types';

interface BillReceiptProps {
  order: Order;
  settings: Restaurant | null;
}

export const BillReceipt = ({ order, settings }: BillReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-Order-${order.id}`,
    removeAfterPrint: true,
  });

  const generateReceiptImage = async (): Promise<string | null> => {
    const node = receiptRef.current;
    if (!node) {
      toast({ variant: 'destructive', title: "Error", description: "Receipt element not found." });
      return null;
    }

    try {
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          width: `${node.offsetWidth}px`,
          height: `${node.offsetHeight}px`,
        }
      });
      return dataUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ variant: 'destructive', title: "Image Generation Failed", description: "Could not create receipt image." });
      return null;
    }
  };

  const handleShare = async () => {
    const dataUrl = await generateReceiptImage();
    if (!dataUrl) return;

    if (Capacitor.isPluginAvailable('Share') && (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios')) {
      await Share.share({
        title: `Order Receipt #${order.id}`,
        text: `Here is the receipt for order #${order.id}`,
        url: dataUrl,
      });
    } else {
      // Fallback for web
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `receipt-${order.id}.png`, { type: "image/png" });

        if (navigator.share) {
          await navigator.share({
            title: `Order Receipt #${order.id}`,
            files: [file],
          });
        } else {
          toast({ variant: 'destructive', title: "Unsupported", description: "Web Share API is not supported in your browser." });
        }
      } catch (error) {
        console.error("Web share error:", error);
        toast({ variant: 'destructive', title: "Sharing Failed", description: "Could not share the receipt." });
      }
    }
  };

  if (!settings) return null;

  return (
    <div className="w-full max-w-sm mx-auto font-mono">
      {/* Receipt Content */}
      <div id={`receipt-${order.id}`} ref={receiptRef} className="bg-white p-2 text-black" style={{ width: "272px" }}>
        <div className="text-center mb-2">
          <h2 className="font-bold text-[16px]">{settings.restaurant_name}</h2>
          <p className="text-[14px]">Order #{order.id}</p>
          <p className="text-[12px] mt-1">
            {new Date(order.created_at).toLocaleString()}
          </p>
          <p className="text-[12px]">
            {order.order_type === 'dine-in' && order.table_number ? `Table: ${order.table_number}` : `Type: ${order.order_type}`}
          </p>
        </div>

        <p>--------------------------------</p>
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="text-left">Item</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="align-top">
                  {item.name}
                  <br />
                  <span className="pl-2">{item.quantity} x {item.rate.toFixed(2)}</span>
                </td>
                <td className="text-right align-top">
                  {(item.rate * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>--------------------------------</p>

        <div className="text-[13px] space-y-1">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{order.subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Tax</span>
            <span>{order.tax.toFixed(2)}</span>
          </p>
        </div>
        <p>--------------------------------</p>
        <p className="flex justify-between font-bold text-[15px]">
          <span>Total:</span>
          <span>Rs.{order.total.toFixed(2)}</span>
        </p>
        <p>--------------------------------</p>

        <p className="text-center text-[13px] font-semibold">
          Paid via: {order.payment_method || "N/A"}
        </p>
        
        {settings.qr_code_url && (
          <div className="text-center mt-2">
              <p className="text-[12px] font-bold">Scan to Pay Next Time</p>
              <img
                src={settings.qr_code_url}
                alt="QR Code"
                className="mx-auto my-1"
                style={{ width: "80px", height: "80px" }}
              />
          </div>
        )}

        <p className="text-center text-[12px] mt-2">Thank you for your visit!</p>
        {settings.address && <p className="text-center text-[12px]">{settings.address}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <Button onClick={handlePrint} size="sm" variant="outline" className="flex-1 flex items-center gap-1">
          <Printer size={16} /> Print
        </Button>
        <Button onClick={handleShare} size="sm" className="flex-1 flex items-center gap-1 bg-green-500 hover:bg-green-600">
          <Share2 size={16} /> Share
        </Button>
      </div>
    </div>
  );
};
