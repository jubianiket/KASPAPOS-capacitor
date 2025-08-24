
"use client";

import { Order } from "@/types";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Printer, Share2 } from "lucide-react";

interface BillReceiptProps {
    order: Order;
}

export function BillReceipt({ order }: BillReceiptProps) {

    const formatDateTime = (dateString: string) => {
        if (typeof window === 'undefined') {
            // Return a placeholder or the original string during SSR
            return new Date(dateString).toISOString(); 
        }
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    const generateWhatsAppMessage = () => {
        const formattedDate = formatDateTime(order.created_at);
        let message = `*KASPA POS Bill*\n\n`;
        message += `Order ID: ${order.id}\n`;
        message += `Date: ${formattedDate}\n`;
        if (order.order_type === 'dine-in') {
            message += `Table: ${order.table_number}\n`;
        }
        message += `Type: ${order.order_type}\n\n`;
        message += `*Items:*\n`;
        order.items.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - Rs.${(item.rate * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Subtotal:* Rs.${order.subtotal.toFixed(2)}\n`;
        message += `*Tax:* Rs.${order.tax.toFixed(2)}\n`;
        message += `*Total:* Rs.${order.total.toFixed(2)}\n`;
        message += `*Paid via:* ${order.payment_method}\n\n`;
        message += `_Thank you for your visit!_`;
        return encodeURIComponent(message);
    }

    const handlePrint = () => {
        const printableContent = document.getElementById(`printable-receipt-${order.id}`);
        if (printableContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow?.document.write('<html><head><title>Print Bill</title>');
            // A very basic styling for the print window
            printWindow?.document.write(`
                <style>
                    body { font-family: sans-serif; margin: 20px; }
                    .receipt { border: 1px solid #ccc; padding: 15px; width: 300px; margin: 0 auto; }
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

    const handleShare = () => {
        const message = generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }

    return (
        <div className="space-y-4">
            <div id={`printable-receipt-${order.id}`} className="text-sm">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">KASPA POS</h3>
                    <p className="text-xs text-muted-foreground">Receipt</p>
                </div>
                <div className="space-y-1">
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Date:</strong> {formatDateTime(order.created_at)}</p>
                    {order.order_type === 'dine-in' && <p><strong>Table:</strong> {order.table_number}</p>}
                    <p><strong>Type:</strong> <span className="capitalize">{order.order_type}</span></p>
                </div>
                <Separator className="my-2" />
                <div>
                    {order.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <div>
                                <p>{item.name}</p>
                                <p className="text-xs text-muted-foreground">({item.quantity} x Rs.{item.rate.toFixed(2)})</p>
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
                    <p><strong>Paid via:</strong> {order.payment_method}</p>
                    <p className="text-xs text-muted-foreground mt-2">Thank you for your visit!</p>
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
