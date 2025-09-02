
"use client";

import { useRef } from 'react';
import { Order, Restaurant } from "@/types";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Printer, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import * as htmlToImage from 'html-to-image';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface BillReceiptProps {
    order: Order;
    settings: Restaurant | null;
}

export function BillReceipt({ order, settings }: BillReceiptProps) {
    const { toast } = useToast();
    const receiptRef = useRef<HTMLDivElement>(null);

    const formatDateTime = (dateString: string) => {
        if (typeof window === 'undefined') {
            return new Date(dateString).toISOString(); 
        }
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    const handlePrint = () => {
        const printableContent = receiptRef.current;
        if (printableContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow?.document.write('<html><head><title>Print Bill</title>');
            printWindow?.document.write(`
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 20px; color: black !important; }
                    .receipt { border: 1px solid #ccc; padding: 15px; width: 300px; margin: 0 auto; background-color: white; color: black; }
                    .receipt * { color: black !important; }
                    .header { text-align: center; }
                    .items-table { width: 100%; border-collapse: collapse; }
                    .items-table th, .items-table td { padding: 5px; text-align: left; }
                    .totals { margin-top: 15px; }
                </style>
            `);
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printableContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            printWindow?.print();
        }
    }
    
     const handleShare = async () => {
        if (!receiptRef.current) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not capture receipt to share.' });
            return;
        }

        const shareText = `Here is the receipt for order #${order.id}. Total: Rs.${order.total.toFixed(2)}`;

        try {
            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                quality: 0.95,
                backgroundColor: 'white',
                skipFonts: true,
                cacheBust: true,
            });

            const platform = Capacitor.getPlatform();

            if (platform === 'web') {
                 const response = await fetch(dataUrl);
                 const blob = await response.blob();
                 const file = new File([blob], 'bill-receipt.png', { type: 'image/png' });

                 if (navigator.canShare && navigator.canShare({ files: [file] })) {
                     await Share.share({
                        title: 'Order Receipt',
                        text: shareText,
                        files: [dataUrl],
                     });
                 } else {
                     window.open(`whatsapp://send?text=${encodeURIComponent(shareText)}`, '_blank');
                 }
            } else {
                 await Share.share({
                    title: 'Order Receipt',
                    text: shareText,
                    url: dataUrl,
                });
            }

        } catch (error: any) {
            if (error.message && (error.message.includes('Share canceled') || error.message.includes('AbortError'))) {
              return;
            }
            console.error('Share failed', error);
            toast({
                variant: 'destructive',
                title: 'Sharing Failed',
                description: 'Could not share the receipt. Please try taking a screenshot.',
            });
             // Fallback for when image generation fails
            await Share.share({
                title: 'Order Receipt',
                text: shareText
            }).catch(() => { /* ignore fallback error */});
        }
    }


    return (
        <div className="space-y-4">
            <div id="receipt-container">
                <div ref={receiptRef} className="text-sm p-4 bg-background text-black" style={{ color: 'black' }}>
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold">{settings?.restaurant_name || 'KASPA POS'}</h3>
                        <p className="text-xs text-gray-600">Receipt</p>
                    </div>

                    {settings?.qr_code_url && order.order_type === 'delivery' && (
                      <div className="flex flex-col items-center gap-2 my-4">
                        <p className="text-sm font-medium">Scan to Pay</p>
                        <div className="p-2 border rounded-md bg-white">
                            <Image src={settings.qr_code_url} alt="Payment QR Code" width={150} height={150} data-ai-hint="QR code" />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                        <p><strong>Order ID:</strong> {order.id}</p>
                        <p><strong>Date:</strong> {formatDateTime(order.created_at)}</p>
                        <p><strong>Type:</strong> <span className="capitalize">{order.order_type}</span></p>
                         {order.order_type === 'dine-in' && <p><strong>Table:</strong> {order.table_number}</p>}
                    </div>

                    {order.order_type === 'delivery' && (
                        <>
                            <Separator className="my-2 bg-gray-400" />
                            <div className="space-y-1">
                                <h4 className="font-semibold">Delivery To:</h4>
                                {order.phone_no && <p>{order.phone_no}</p>}
                                {order.flat_no && <p>{order.flat_no}</p>}
                                {[order.building_no, order.address].filter(Boolean).join(', ') && <p>{[order.building_no, order.address].filter(Boolean).join(', ')}</p>}
                            </div>
                        </>
                    )}

                    <Separator className="my-2 bg-gray-400" />
                    <div>
                        {order.items.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex justify-between">
                                <div>
                                    <p>{item.name}</p>
                                    <p className="text-xs text-gray-600">({item.quantity} x Rs.{item.rate.toFixed(2)})</p>
                                </div>
                                <p>Rs.{(item.quantity * item.rate).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-2 bg-gray-400" />
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rs.{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>Rs.{order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span>Rs.{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                     <Separator className="my-2 bg-gray-400" />
                     <div className="text-center mt-4">
                        {order.payment_method ? (
                             <p><strong>Paid via:</strong> {order.payment_method}</p>
                        ) : (
                           <div className="space-y-1 text-xs">
                                <p className="font-bold">To be paid by Cash/UPI.</p>
                                <p className="text-gray-600">Please share a screenshot of the payment on WhatsApp.</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-600 mt-2">Thank you for your visit!</p>
                    </div>
                </div>
            </div>
             <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>
        </div>
    );
}
