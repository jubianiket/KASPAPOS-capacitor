
"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as htmlToImage from 'html-to-image';
import { Capacitor } from '@capacitor/core';
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
    documentTitle: `Receipt-Order-${order.id}`,
    content: () => receiptRef.current,
    pageStyle: `
      @page {
        size: auto;   /* Use auto to let printer determine size */
        margin: 0mm;  /* Remove margins */
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-width: 58mm;  /* Support for 58mm printers */
          max-width: 80mm;  /* Support for 80mm printers */
        }
        /* Ensure content fits within printer width */
        table, tr, td, th, p, div {
          width: auto !important;
          max-width: 100% !important;
          font-size: 10pt !important;
          word-break: break-word;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      toast({ title: "Preparing to print..." });
      return Promise.resolve();
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast({ 
        variant: 'destructive', 
        title: "Print Failed", 
        description: "Could not print the receipt. Please check your printer connection." 
      });
    },
    onAfterPrint: () => {
      toast({ 
        title: "Print Completed", 
        description: "The receipt has been sent to the printer." 
      });
    }
  });

  const handleShare = async () => {
    if (!receiptRef.current) return;
    
    try {
      // Show loading toast
      toast({ title: "Preparing receipt for sharing..." });

      // Convert receipt to image with platform-specific settings
      const platform = Capacitor.getPlatform();
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        quality: 1.0,
        pixelRatio: platform === 'ios' ? 3 : 2, // Higher resolution for iOS
        backgroundColor: 'white',
        style: {
          // Ensure proper rendering on both platforms
          transform: 'none',
          overflow: 'hidden',
          borderRadius: '0px'
        }
      });

      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `receipt-${order.id}-${timestamp}.png`;
      const base64Data = dataUrl.split(',')[1];
      
      try {
        // Clean up any existing files with similar names
        const existingFiles = await Filesystem.readdir({
          path: '',
          directory: Directory.Cache
        });
        
        for (const file of existingFiles.files) {
          if (file.name.startsWith(`receipt-${order.id}`)) {
            await Filesystem.deleteFile({
              path: file.name,
              directory: Directory.Cache
            });
          }
        }
      } catch (e) {
        // Directory might not exist yet, which is fine
        console.log('No existing files to clean up');
      }

      // Save image to filesystem
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Share the saved image
      await Share.share({
        title: `Order Receipt #${order.id}`,
        files: [savedFile.uri],
        dialogTitle: 'Share Receipt',
        text: platform === 'ios' ? undefined : `Receipt for Order #${order.id}` // Add text for Android
      });

      // Clean up after sharing
      setTimeout(async () => {
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Cache
          });
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }, 1000); // Give some time for the share operation to complete

    } catch (error) {
      console.error("Share error:", error);
      toast({ 
        variant: 'destructive', 
        title: "Sharing Failed", 
        description: "Could not share the receipt. Please try again." 
      });
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
              <p className="text-[12px] font-bold">Scan to Pay </p>
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
