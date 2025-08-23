'use server';

/**
 * @fileOverview Provides AI-driven upsell suggestions for restaurant orders.
 *
 * - upsellSuggestions - A function that suggests menu items for upselling based on the current order.
 * - UpsellSuggestionsInput - The input type for the upsellSuggestions function, representing the current order.
 * - UpsellSuggestionsOutput - The return type for the upsellSuggestions function, providing a list of suggested items.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpsellSuggestionsInputSchema = z.object({
  orderItems: z
    .array(z.string())
    .describe('The list of items currently in the order.'),
  menuItems: z
    .array(z.string())
    .describe('The list of all available menu items with description and price.'),
});
export type UpsellSuggestionsInput = z.infer<typeof UpsellSuggestionsInputSchema>;

const UpsellSuggestionsOutputSchema = z.object({
  suggestedItems: z
    .array(z.string())
    .describe('A list of menu items suggested for upselling.'),
});
export type UpsellSuggestionsOutput = z.infer<typeof UpsellSuggestionsOutputSchema>;

export async function upsellSuggestions(input: UpsellSuggestionsInput): Promise<UpsellSuggestionsOutput> {
  return upsellSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'upsellSuggestionsPrompt',
  input: {schema: UpsellSuggestionsInputSchema},
  output: {schema: UpsellSuggestionsOutputSchema},
  prompt: `You are a helpful AI assistant that suggests menu items for upselling in a restaurant.

  Given the current order items and the available menu items, suggest additional items that the customer might enjoy.
  The goal is to increase the order value and improve customer satisfaction.

  Current Order Items:
  {{#each orderItems}}- {{this}}\n{{/each}}

  Available Menu Items:
  {{#each menuItems}}- {{this}}\n{{/each}}

  Suggested Items (only return names of the items, not descriptions):`,
});

const upsellSuggestionsFlow = ai.defineFlow(
  {
    name: 'upsellSuggestionsFlow',
    inputSchema: UpsellSuggestionsInputSchema,
    outputSchema: UpsellSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
