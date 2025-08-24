'use server';

import { upsellSuggestions } from '@/ai/flows/upsell-suggestions';
import { getMenuItems } from '@/lib/supabase';

export async function getUpsellSuggestions(
  currentOrderItems: { name: string; quantity: number }[]
) {
  try {
    const menuItems = await getMenuItems();
    const allMenuItems = menuItems.map(
      (item) => `${item.name} - Rs.${item.rate.toFixed(2)}`
    );

    const orderItemsAsStrings = currentOrderItems.map(
        item => `${item.name} (x${item.quantity})`
    );

    const result = await upsellSuggestions({
      orderItems: orderItemsAsStrings,
      menuItems: allMenuItems,
    });

    // The AI might suggest items already in the order, so filter them out.
    const currentItemNames = new Set(currentOrderItems.map(item => item.name));
    const filteredSuggestions = result.suggestedItems.filter(
      (suggestion) => !currentItemNames.has(suggestion)
    );

    return { suggestions: filteredSuggestions };
  } catch (error) {
    console.error('Error getting upsell suggestions:', error);
    return { error: 'Failed to get suggestions. Please try again.' };
  }
}
