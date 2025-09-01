
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
                    body { font-family: sans-serif; margin: 20px; color: black !important; }
                    .receipt { border: 1px solid #ccc; padding: 15px; width: 300px; margin: 0 auto; background-color: white; color: black; }
                    .receipt * { color: black !important; }
                    .header { text-align: center; }
                    .items-table { width: 100%; border-collapse: collapse; }
                    .items-table th, .items-table td { padding: 5px; text-align: left; }
                    .totals { margin-top: 15px; }
                    .totals div { display: flex; justify-content: space-between; }
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
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not generate bill image.'
            });
            return;
        }

        try {
            const dataUrl = await htmlToImage.toPng(receiptRef.current, { 
                cacheBust: true, 
                quality: 0.95,
                backgroundColor: 'white'
            });
            
            await Share.share({
                title: `Bill for Order #${order.id}`,
                text: `Here is your bill for Order #${order.id}. Total: Rs.${order.total.toFixed(2)}`,
                url: dataUrl, // Capacitor Share plugin can handle base64 data URLs
                dialogTitle: 'Share Bill',
            });

        } catch (error) {
            console.error('Error sharing bill image:', error);
            // Check if the error is a "not implemented" error, which means it's not in a Capacitor environment
            if (error instanceof Error && error.message.includes("not implemented")) {
                 toast({
                    variant: 'destructive',
                    title: 'Sharing Not Supported',
                    description: 'Sharing is only available on the mobile app.',
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Sharing Failed',
                    description: 'Could not share the bill image.',
                });
            }
        }
    }

    return (
        <div className="space-y-4">
            <div id="receipt-container">
                <div ref={receiptRef} className="text-sm p-4 bg-background text-black">
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
                        {order.order_type === 'dine-in' && <p><strong>Table:</strong> {order.table_number}</p>}
                        <p><strong>Type:</strong> <span className="capitalize">{order.order_type}</span></p>
                    </div>

                    {order.order_type === 'delivery' && (
                        <>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                                <h4 className="font-semibold">Delivery To:</h4>
                                <p>{order.phone_no}</p>
                                <p>{[order.flat_no, order.building_no, order.address].filter(Boolean).join(', ')}</p>
                            </div>
                        </>
                    )}

                    <Separator className="my-2" />
                    <div>
                        {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <div>
                                    <p>{item.name}</p>
                                    <p className="text-xs text-gray-600">({item.quantity} x Rs.{item.rate.toFixed(2)})</p>
                                </div>
                                <p>Rs.{(item.quantity * item.rate).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-2" />
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
                     <Separator className="my-2" />
                     <div className="text-center">
                        {order.order_type === 'delivery' ? (
                            <div className="space-y-1 text-xs">
                                <p><strong>To be paid by Cash/UPI.</strong></p>
                                <p className="text-gray-600">Please share a screenshot of the payment on WhatsApp.</p>
                            </div>
                        ) : (
                            order.payment_method && <p><strong>Paid via:</strong> {order.payment_method}</p>
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
