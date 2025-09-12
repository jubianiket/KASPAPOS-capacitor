
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
    
    if (!order) {
        return <div className="p-4 text-red-500">No order data available</div>;
    }

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
            const printWindow = window.open('', '', 'height=600,width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Bill</title>');
                printWindow.document.write(`
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');
                        body { 
                            font-family: 'Inconsolata', monospace; 
                            margin: 0; 
                            color: black !important;
                            width: 300px;
                        }
                        .receipt-print {
                            padding: 10px;
                            width: 100%;
                            background-color: white; 
                            color: black;
                            box-sizing: border-box;
                        }
                        .receipt-print * { 
                            color: black !important; 
                            font-family: 'Inconsolata', monospace !important;
                        }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                // We create a new div to wrap the content for printing
                const printDiv = document.createElement('div');
                printDiv.className = 'receipt-print';
                printDiv.innerHTML = printableContent.innerHTML;
                
                // Remove buttons before printing
                const buttons = printDiv.querySelector('.receipt-actions');
                if (buttons) {
                    buttons.remove();
                }

                printWindow.document.body.appendChild(printDiv);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                
                setTimeout(() => { // Timeout to ensure styles are loaded
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    }
    
    const handleShare = async () => {
        if (!receiptRef.current) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not capture receipt to share.' });
            return;
        }

        try {
            const platform = Capacitor.getPlatform();

            const nodeToCapture = receiptRef.current;
            
            // Remove buttons from capture
            const buttons = nodeToCapture.querySelector('.receipt-actions') as HTMLElement | null;
            if(buttons) buttons.style.display = 'none';

            const dataUrl = await htmlToImage.toPng(nodeToCapture, {
                quality: 0.95,
                backgroundColor: 'white',
                pixelRatio: 2,
                fontEmbedCSS: `@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');`,
            });

            if(buttons) buttons.style.display = 'flex'; // Show buttons again

            if (platform === 'web') {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const file = new File([blob], 'bill-receipt.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Order Receipt',
                        text: `Here is the receipt for order #${order.id}. Total: Rs.${order.total.toFixed(2)}`
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Web Share API is not supported in this browser.' });
                }
            } else {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const fileName = `receipt-${order.id}-${Date.now()}.png`;

                await Filesystem.writeFile({
                    path: fileName,
                    data: dataUrl, // Share the full dataUrl
                    directory: Directory.Cache,
                });

                const { uri } = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Order Receipt',
                    text: `Order Receipt #${order.id}`,
                    files: [uri],
                    dialogTitle: 'Share Order Receipt'
                });

                await Filesystem.deleteFile({
                    path: fileName,
                    directory: Directory.Cache
                });
            }
        } catch (error) {
            if (error instanceof Error && (error.message.includes('Share canceled') || error.name === 'AbortError')) {
                return; 
            }
            toast({
                variant: 'destructive',
                title: 'Sharing Failed',
                description: 'Could not generate or share the receipt image. Please try again.'
            });
        }
    }

    const dotLine = '-'.repeat(38);

    return (
        <div ref={receiptRef} style={{ fontFamily: "'Inconsolata', monospace" }} className="bg-white text-black w-[300px] p-2 mx-auto text-xs">
            <div className="text-center mb-2">
                <div className="text-sm font-bold mb-1">{settings?.restaurant_name || 'KASPA POS'}</div>
                {settings?.address && <div className="text-[10px]">{settings.address}</div>}
                {settings?.phone && <div className="text-[10px]">Ph: {settings.phone}</div>}
            </div>
             <div className="text-center mb-2 font-bold">
                Receipt #{order.id}
             </div>

            {settings?.qr_code_url && (
              <>
                <div className="flex flex-col items-center my-2">
                    <div>Scan to Pay</div>
                    <div className="w-24 h-24 relative">
                        <Image 
                            src={settings.qr_code_url} 
                            alt="Payment QR Code" 
                            layout="fill"
                            objectFit="contain"
                            data-ai-hint="QR code" 
                        />
                    </div>
                </div>
              </>
            )}
            
            <div className="mb-2">
                <div>{dotLine}</div>
                <div className="flex justify-between">
                    <span>Date: {formatDateTime(order.created_at)}</span>
                    {order.order_type === 'dine-in' && <span>Table: {order.table_number}</span>}
                </div>
                <div>Type: {order.order_type.toUpperCase()}</div>
                <div>{dotLine}</div>
            </div>

            {order.order_type === 'delivery' && (
                <>
                    <div className="mb-2">
                        <div className="font-bold">Delivery To:</div>
                        {order.phone_no && <div>{order.phone_no}</div>}
                        {order.flat_no && <div>{order.flat_no}</div>}
                        {[order.building_no, order.address].filter(Boolean).join(', ') && (
                            <div>
                                {[order.building_no, order.address].filter(Boolean).join(', ')}
                            </div>
                        )}
                         <div>{dotLine}</div>
                    </div>
                </>
            )}

            <div className="mb-2">
                <div className="flex justify-between font-bold">
                    <span>Item</span>
                    <span>Amount</span>
                </div>
                 <div>{dotLine}</div>
                {order.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="mt-1">
                        <div>{item.name} {item.portion && item.portion !== 'Regular' ? `(${item.portion})` : ''}</div>
                        <div className="flex justify-between">
                            <span className="pl-2">{item.quantity} x Rs.{item.rate.toFixed(2)}</span>
                            <span>Rs.{(item.quantity * item.rate).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div>{dotLine}</div>
            <div className="my-2 space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rs.{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Rs.{order.tax.toFixed(2)}</span>
                </div>
                <div>{dotLine}</div>
                <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span>Rs.{order.total.toFixed(2)}</span>
                </div>
            </div>
            <div>{dotLine}</div>
             <div className="text-center my-2">
                {order.payment_method ? (
                    <div>Paid via: {order.payment_method}</div>
                ) : (
                    <div>Payment Pending</div>
                )}
            </div>
            <div>{dotLine}</div>
            <div className="text-center mt-2">
                <div>Thank you for your visit!</div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-2 mt-4 receipt-actions">
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
