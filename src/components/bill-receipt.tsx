
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
import { Filesystem, Directory } from '@capacitor/filesystem';

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

        // Use a cloned node to avoid issues with original node styling and state
        const nodeToCapture = receiptRef.current;
        
        try {
            const dataUrl = await htmlToImage.toPng(nodeToCapture, { 
                quality: 0.95,
                backgroundColor: 'white',
                skipFonts: true,
                cacheBust: true
             });

            const platform = Capacitor.getPlatform();

            if (platform === 'web') {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const file = new File([blob], 'bill-receipt.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file]
                        });
                    } catch (error) {
                        // If sharing fails, try downloading
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = 'bill-receipt.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        toast({
                            title: "Image Downloaded",
                            description: "The bill image has been downloaded. You can now share it on WhatsApp.",
                        });
                    }
                } else {
                    // If native sharing is not supported, download directly
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = 'bill-receipt.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    toast({
                        title: "Image Downloaded",
                        description: "The bill image has been downloaded. You can now share it on WhatsApp.",
                    });
                }
            } else {
                // For native apps (Android/iOS)
                try {
                    // Convert data URL to base64
                    const base64Data = dataUrl.split(',')[1];
                    
                    // Save the image with a unique timestamp
                    const timestamp = new Date().getTime();
                    const fileName = `receipt_${order.id}_${timestamp}.png`;
                    
                    // First try to write to cache directory
                    const savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache,
                        recursive: true
                    });

                    // Log the file details for debugging
                    console.log('Saved file:', {
                        path: savedFile.uri,
                        directory: Directory.Cache,
                        exists: await Filesystem.stat({
                            path: fileName,
                            directory: Directory.Cache
                        }).catch(() => null)
                    });

                    // Share the file using both url and files array for maximum compatibility
                    await Share.share({
                        title: 'Order Receipt',
                        text: 'Order Receipt',
                        url: savedFile.uri,
                        files: [savedFile.uri],
                        dialogTitle: 'Share Order Receipt'
                    });

                    // Wait a bit before cleaning up to ensure sharing is complete
                    setTimeout(async () => {
                        try {
                            await Filesystem.deleteFile({
                                path: fileName,
                                directory: Directory.Cache
                            });
                        } catch (cleanupError) {
                            console.log('Cleanup error (safe to ignore):', cleanupError);
                        }
                    }, 3000);
                } catch (e) {
                    console.error('Native sharing failed:', e);
                    
                    // Try fallback sharing with just the base64 data
                    try {
                        await Share.share({
                            title: 'Order Receipt',
                            text: 'Order Receipt',
                            url: dataUrl,
                            dialogTitle: 'Share Order Receipt'
                        });
                    } catch (fallbackError) {
                        console.error('Fallback sharing failed:', fallbackError);
                        throw e; // Re-throw the original error if fallback also fails
                    }
                }
            }
        } catch (error) {
            console.error('Share failed:', error);
            
            // Don't show error for user cancellation
            if (error instanceof Error && error.message && 
               (error.message.includes('Share canceled') || error.message.includes('AbortError') || 
                error.message.includes('User cancelled'))) {
                return;
            }
            
            // Show appropriate error message based on the error type and platform
            const platform = Capacitor.getPlatform();
            let errorMessage = '';
            
            if (error instanceof Error) {
                if (error.message.includes('permission')) {
                    errorMessage = 'Please grant storage permission to share the receipt.';
                } else if (error.message.includes('file') || error.message.includes('File')) {
                    errorMessage = 'Error creating the receipt image. Please try again.';
                } else {
                    errorMessage = platform === 'web' 
                        ? 'Could not share the receipt. Please try taking a screenshot.'
                        : 'Could not share the receipt. Please check your storage permissions and try again.';
                }
                
                // Log detailed error for debugging
                console.log('Sharing error details:', {
                    platform,
                    errorType: error.name,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
            } else {
                errorMessage = 'An unexpected error occurred while sharing.';
            }
            
            toast({
                variant: 'destructive',
                title: 'Sharing Failed',
                description: errorMessage
            });
        }
    }


    return (
        <div className="space-y-4 max-h-[calc(100vh-200px)] flex flex-col">
            <div id="receipt-container" className="flex-1 overflow-y-auto">
                <div ref={receiptRef} className="text-sm p-4 bg-background text-black max-w-md mx-auto" style={{ color: 'black' }}>
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold">{settings?.restaurant_name || 'KASPA POS'}</h3>
                        <p className="text-xs text-gray-600">Receipt</p>
                    </div>

                    {settings?.qr_code_url && order.order_type === 'delivery' && (
                      <div className="flex flex-col items-center gap-2 my-4">
                        <p className="text-sm font-medium">Scan to Pay</p>
                        <div className="p-2 border rounded-md bg-white">
                            <div className="relative w-[120px] h-[120px]">
                                <Image 
                                    src={settings.qr_code_url} 
                                    alt="Payment QR Code" 
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    data-ai-hint="QR code" 
                                />
                            </div>
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
                                {order.phone_no && <p className="break-words">{order.phone_no}</p>}
                                {order.flat_no && <p className="break-words">{order.flat_no}</p>}
                                {[order.building_no, order.address].filter(Boolean).join(', ') && (
                                    <p className="break-words text-sm leading-tight">
                                        {[order.building_no, order.address].filter(Boolean).join(', ')}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <Separator className="my-2 bg-gray-400" />
                    <div>
                        {order.items.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex justify-between gap-2 py-1">
                                <div className="flex-1 min-w-0">
                                    <p className="break-words">{item.name}</p>
                                    <p className="text-xs text-gray-600">({item.quantity} x Rs.{item.rate.toFixed(2)})</p>
                                </div>
                                <p className="whitespace-nowrap">Rs.{(item.quantity * item.rate).toFixed(2)}</p>
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
             <div className="sticky bottom-0 bg-background pt-2 border-t flex justify-end gap-2">
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
