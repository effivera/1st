'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing carbon credit suggestions to farmers.
 *
 * It takes the farmer's carbon footprint as input and suggests ways to save on fertilizer and improve carbon sequestration.
 * - carbonCreditSuggestions - A function that handles the carbon credit suggestions process.
 * - CarbonCreditSuggestionsInput - The input type for the carbonCreditSuggestions function.
 * - CarbonCreditSuggestionsOutput - The return type for the carbonCreditSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CarbonCreditSuggestionsInputSchema = z.object({
  farmerId: z.string().describe('The ID of the farmer.'),
  district: z.string().describe('The district where the farmer is located.'),
  carbonFootprintDetails: z
    .string()
    .describe(
      'Details of the farmer’s current carbon footprint, including fertilizer usage, farming practices, and other relevant data.'
    ),
});

export type CarbonCreditSuggestionsInput = z.infer<
  typeof CarbonCreditSuggestionsInputSchema
>;

const CarbonCreditSuggestionsOutputSchema = z.object({
  fertilizerSavingsSuggestions: z
    .string()
    .describe(
      'Specific suggestions for reducing fertilizer usage while maintaining crop yield.'
    ),
  carbonSequestrationRecommendations: z
    .string()
    .describe(
      'Recommendations for improving carbon sequestration through farming practices.'
    ),
  estimatedCreditIncrease: z
    .string()
    .describe(
      'An estimate of how much the farmer’s carbon credits could increase by implementing the suggestions.'
    ),
});

export type CarbonCreditSuggestionsOutput = z.infer<
  typeof CarbonCreditSuggestionsOutputSchema
>;

export async function carbonCreditSuggestions(
  input: CarbonCreditSuggestionsInput
): Promise<CarbonCreditSuggestionsOutput> {
  return carbonCreditSuggestionsFlow(input);
}

const carbonCreditSuggestionsPrompt = ai.definePrompt({
  name: 'carbonCreditSuggestionsPrompt',
  input: {schema: CarbonCreditSuggestionsInputSchema},
  output: {schema: CarbonCreditSuggestionsOutputSchema},
  prompt: `You are an expert in sustainable agriculture and carbon credit optimization for Indian farmers.

  Based on the farmer's carbon footprint details, provide specific and actionable suggestions for:

  1.  Reducing fertilizer usage without impacting crop yield.
  2.  Improving carbon sequestration through farming practices.

  Also, estimate the potential increase in carbon credits if the farmer implements these suggestions.

  Farmer Details:
  - Farmer ID: {{{farmerId}}}
  - District: {{{district}}}

  Carbon Footprint Details: {{{carbonFootprintDetails}}}

  Format your response as follows:

  Fertilizer Savings Suggestions: [suggestions for reducing fertilizer usage]
  Carbon Sequestration Recommendations: [recommendations for improving carbon sequestration]
  Estimated Credit Increase: [estimated increase in carbon credits]
`,
});

const carbonCreditSuggestionsFlow = ai.defineFlow(
  {
    name: 'carbonCreditSuggestionsFlow',
    inputSchema: CarbonCreditSuggestionsInputSchema,
    outputSchema: CarbonCreditSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await carbonCreditSuggestionsPrompt(input);
    return output!;
  }
);

