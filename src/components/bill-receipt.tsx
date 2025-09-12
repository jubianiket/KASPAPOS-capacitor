
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
    
    console.log('[BillReceipt] Order:', order);
    console.log('[BillReceipt] Settings:', settings);
    
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

        try {
            console.log('[Share] Starting share process...');
            const platform = Capacitor.getPlatform();
            console.log('[Share] Platform:', platform);

            // Create a temporary div for capturing
            const nodeToCapture = receiptRef.current.cloneNode(true) as HTMLDivElement;
            nodeToCapture.style.position = 'absolute';
            nodeToCapture.style.left = '-9999px';
            nodeToCapture.style.top = '0px';
            nodeToCapture.style.backgroundColor = 'white';
            document.body.appendChild(nodeToCapture);

            try {
                console.log('[Share] Converting receipt to image...');
                
                // Clone styles before capturing
                const styles = window.getComputedStyle(receiptRef.current);
                const cssText = Object.values(styles).reduce((css, property) => {
                    return `${css}${property}:${styles.getPropertyValue(property)};`;
                }, '');
                
                // Apply computed styles directly
                nodeToCapture.style.cssText = cssText;
                nodeToCapture.style.width = '100%';
                nodeToCapture.style.maxWidth = '400px';
                nodeToCapture.style.margin = '0 auto';
                nodeToCapture.style.backgroundColor = 'white';
                nodeToCapture.style.color = 'black';
                nodeToCapture.style.padding = '20px';
                nodeToCapture.style.boxSizing = 'border-box';
                
                // Make sure all text elements are visible
                const textElements = nodeToCapture.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
                textElements.forEach(el => {
                    (el as HTMLElement).style.color = 'black';
                });

                const dataUrl = await htmlToImage.toPng(nodeToCapture, {
                    quality: 1,
                    backgroundColor: 'white',
                    pixelRatio: 3,
                    skipAutoScale: true,
                    width: 400 * 3, // Fixed width with high resolution
                    height: nodeToCapture.offsetHeight * 3,
                    style: {
                        backgroundColor: 'white'
                    },
                    filter: (node) => {
                        if (node instanceof Element) {
                            const computedStyle = window.getComputedStyle(node);
                            // Only capture visible elements
                            return computedStyle.display !== 'none' && 
                                   computedStyle.visibility !== 'hidden' &&
                                   computedStyle.opacity !== '0';
                        }
                        return true;
                    },
                    fontEmbedCSS: `
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        * { font-family: 'Inter', sans-serif; }
                    `
                });
                console.log('[Share] Image generated successfully');

                if (platform === 'web') {
                    console.log('[Share] Using Web Share API');
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'bill-receipt.png', { type: 'image/png' });

                    if (navigator.share) {
                        await navigator.share({
                            files: [file],
                            title: 'Order Receipt',
                            text: `Here is the receipt for order #${order.id}. Total: Rs.${order.total.toFixed(2)}`
                        });
                    } else {
                        toast({ variant: 'destructive', title: 'Error', description: 'Web Share API is not supported in this browser.' });
                    }
                } else {
                    console.log('[Share] Using Capacitor Share plugin');
                    // For native apps (Android/iOS)
                    const base64Data = dataUrl.split(',')[1];
                    
                    // Import required plugins
                    const { Filesystem, Directory } = await import('@capacitor/filesystem');
                    
                    try {
                        // First, save the image to temporary storage
                        console.log('[Share] Saving image to temporary storage...');
                        const fileName = `receipt-${order.id}-${Date.now()}.png`;
                        await Filesystem.writeFile({
                            path: fileName,
                            data: base64Data,
                            directory: Directory.Cache,
                            recursive: true
                        });

                        // Get the saved file URI
                        console.log('[Share] Getting saved file URI...');
                        const fileInfo = await Filesystem.getUri({
                            path: fileName,
                            directory: Directory.Cache
                        });

                        console.log('[Share] File URI obtained:', fileInfo.uri);

                        // Share the file using its URI
                        await Share.share({
                            title: 'Order Receipt',
                            text: `Order Receipt #${order.id}`,
                            files: [fileInfo.uri],
                            dialogTitle: 'Share Order Receipt'
                        });

                        // Clean up: delete the temporary file
                        console.log('[Share] Cleaning up temporary file...');
                        await Filesystem.deleteFile({
                            path: fileName,
                            directory: Directory.Cache
                        });
                    } catch (error) {
                        console.error('[Share] Error in native sharing:', error);
                        throw error;
                    }
                }
                console.log('[Share] Share completed successfully');
            } finally {
                // Clean up the temporary node
                document.body.removeChild(nodeToCapture);
            }
        } catch (error) {
            console.error('[Share] Share failed:', error);
            if (error instanceof Error) {
                if (error.message.includes('Share canceled') || error.message.includes('AbortError')) {
                    console.log('[Share] Share was cancelled by user');
                    return; // User cancelled the share action, do nothing.
                }
                console.error('[Share] Error details:', error.message);
            }
            toast({
                variant: 'destructive',
                title: 'Sharing Failed',
                description: 'Could not generate or share the receipt image. Please try again.'
            });
        }
    }


    const dotLine = '-'.repeat(45);

    return (
        <div style={{ margin: '0' }}>
            <div 
                ref={receiptRef} 
                style={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '8px',
                    width: '272px',
                    margin: '0 auto',
                    fontSize: '12px',
                    position: 'relative',
                    zIndex: 10,
                    fontFamily: 'monospace',
                    lineHeight: '1.2',
                    boxSizing: 'border-box',
                    whiteSpace: 'pre-wrap',
                    letterSpacing: '0.5px'
                }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ 
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '4px'
                    }}>{settings?.restaurant_name || 'KASPA POS'}</div>
                </div>

                {settings?.qr_code_url && (
                  <>
                    <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                        <div>Scan to Pay</div>
                        <div style={{ 
                          width: '100px',
                          height: '100px',
                          marginLeft: 'auto',
                          position: 'relative'
                        }}>
                            <Image 
                                src={settings.qr_code_url} 
                                alt="Payment QR Code" 
                                layout="fill"
                                objectFit="contain"
                                data-ai-hint="QR code" 
                            />
                        </div>
                    </div>
                    <div>{dotLine}</div>
                  </>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Date: {formatDateTime(order.created_at)}</span>
                        {order.order_type === 'dine-in' && <span>Table: {order.table_number}</span>}
                    </div>
                    <div>Type: {order.order_type.toUpperCase()}</div>
                </div>

                {order.order_type === 'delivery' && (
                    <>
                        <div style={{ marginBottom: '8px' }}>
                            <div>Delivery To:</div>
                            {order.phone_no && <div>{order.phone_no}</div>}
                            {order.flat_no && <div>{order.flat_no}</div>}
                            {[order.building_no, order.address].filter(Boolean).join(', ') && (
                                <div>
                                    {[order.building_no, order.address].filter(Boolean).join(', ')}
                                </div>
                            )}
                        </div>
                        <div>{dotLine}</div>
                    </>
                )}

                <Separator className="my-2 bg-gray-400" />
                <div style={{ marginBottom: '8px' }}>
                    {order.items.map((item, index) => (
                        <div key={`${item.id}-${index}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ flex: 1 }}>{item.name}</span>
                                <span style={{ marginLeft: '16px' }}>Rs.{(item.quantity * item.rate).toFixed(2)}</span>
                            </div>
                            <div style={{ color: '#444' }}>
                                {item.quantity} x Rs.{item.rate.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
                <div>{dotLine}</div>
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal</span>
                        <span>Rs.{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tax</span>
                        <span>Rs.{order.tax.toFixed(2)}</span>
                    </div>
                    <div>{dotLine}</div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontWeight: 'bold'
                    }}>
                        <span>Total:</span>
                        <span>Rs.{order.total.toFixed(2)}</span>
                    </div>
                </div>
                 <div>{dotLine}</div>
                 <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    {order.payment_method ? (
                        <div>Paid via: {order.payment_method}</div>
                    ) : (
                        <div>To be paid by Cash/UPI</div>
                    )}
                </div>
                <div>{dotLine}</div>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div>Thank you for your visit!</div>
                </div>
            </div>
            <div 
                style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '8px',
                    marginTop: '8px'
                }}
            >
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
