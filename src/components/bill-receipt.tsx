
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

            // Create a temporary wrapper for capture
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-9999px';
            wrapper.style.top = '0';
            document.body.appendChild(wrapper);

            // Clone the receipt content
            const nodeToCapture = receiptRef.current.cloneNode(true) as HTMLElement;
            
            // Remove the buttons container
            const buttons = nodeToCapture.querySelector('.receipt-actions');
            if (buttons) buttons.remove();

            // Apply specific styles for capture
            nodeToCapture.style.width = '272px';
            nodeToCapture.style.margin = '0';
            nodeToCapture.style.padding = '0';
            nodeToCapture.style.backgroundColor = 'white';
            nodeToCapture.style.color = 'black';
            nodeToCapture.style.fontFamily = "'Inconsolata', monospace";
            nodeToCapture.style.fontSize = '12px';
            nodeToCapture.style.lineHeight = '1.2';
            nodeToCapture.style.position = 'static';
            nodeToCapture.style.boxSizing = 'border-box';

            // Add cloned node to wrapper
            wrapper.appendChild(nodeToCapture);

            // Calculate actual content height
            const contentHeight = nodeToCapture.scrollHeight;

            const dataUrl = await htmlToImage.toPng(nodeToCapture, {
                quality: 1,
                backgroundColor: 'white',
                pixelRatio: 3,
                width: 272 * 3,
                height: contentHeight * 3,
                style: {
                    width: '272px',
                    margin: '0',
                    padding: '4px 8px',
                    boxSizing: 'border-box'
                },
                filter: (node) => {
                    // Skip any non-content elements
                    if (node instanceof Element) {
                        const style = window.getComputedStyle(node);
                        return style.display !== 'none' && !node.classList.contains('receipt-actions');
                    }
                    return true;
                },
                fontEmbedCSS: `@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');`
            });

            // Clean up
            document.body.removeChild(wrapper);

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

    const dotLine = '-'.repeat(32); // Adjusted for 72mm width

    return (
        <div ref={receiptRef} style={{ 
                fontFamily: "'Inconsolata', monospace",
                width: '272px', // Exactly 72mm for thermal printer
                padding: '4px 8px',
                margin: '0 auto',
                backgroundColor: 'white',
                color: 'black',
                boxSizing: 'border-box',
                fontSize: '12px',
                lineHeight: '1.15',
                minHeight: 'fit-content'
            }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>{settings?.restaurant_name || 'KASPA POS'}</div>
                {settings?.address && <div style={{ fontSize: '10px', marginBottom: '1px' }}>{settings.address}</div>}
                {settings?.phone && <div style={{ fontSize: '10px' }}>Ph: {settings.phone}</div>}
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

            <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold',
                    fontSize: '12px'
                }}>
                    <span style={{ flex: '1' }}>Item</span>
                    <span style={{ width: '70px', textAlign: 'right' }}>Amount</span>
                </div>
                <div>{dotLine}</div>
                {order.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} style={{ marginTop: '4px' }}>
                        <div style={{ 
                            fontSize: '12px',
                            width: '100%',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                        }}>{item.name} {item.portion && item.portion !== 'Regular' ? `(${item.portion})` : ''}</div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: '11px'
                        }}>
                            <span style={{ paddingLeft: '4px' }}>{item.quantity} x Rs.{item.rate.toFixed(2)}</span>
                            <span style={{ width: '70px', textAlign: 'right' }}>Rs.{(item.quantity * item.rate).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div>{dotLine}</div>
            <div style={{ margin: '8px 0', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span style={{ width: '70px', textAlign: 'right' }}>Rs.{order.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax</span>
                    <span style={{ width: '70px', textAlign: 'right' }}>Rs.{order.tax.toFixed(2)}</span>
                </div>
                <div>{dotLine}</div>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: '13px'
                }}>
                    <span>Total:</span>
                    <span style={{ width: '70px', textAlign: 'right' }}>Rs.{order.total.toFixed(2)}</span>
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

    