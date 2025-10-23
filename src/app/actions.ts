"use server";

import { carbonCreditSuggestions, CarbonCreditSuggestionsInput, CarbonCreditSuggestionsOutput } from "@/ai/flows/carbon-credit-suggestions";

export async function getCarbonCreditSuggestions(
  input: CarbonCreditSuggestionsInput
): Promise<{ data?: CarbonCreditSuggestionsOutput; error?: string }> {
  try {
    const result = await carbonCreditSuggestions(input);
    return { data: result };
  } catch (e: any) {
    console.error("Error in getCarbonCreditSuggestions:", e);
    return { error: e.message || "An unknown error occurred." };
  }
}
