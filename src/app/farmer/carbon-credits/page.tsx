
"use client";
import React, { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCarbonCreditSuggestions } from '@/app/actions';
import { CarbonCreditSuggestionsOutput } from '@/ai/flows/carbon-credit-suggestions';
import { Loader2, Sparkles, Sprout, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CarbonCreditsPage() {
    const { userProfile } = useAuth();
    const [footprintDetails, setFootprintDetails] = useState('');
    const [suggestions, setSuggestions] = useState<CarbonCreditSuggestionsOutput | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!userProfile) {
            toast({
                title: 'Error',
                description: 'You must be logged in to get suggestions.',
                variant: 'destructive',
            });
            return;
        }

        startTransition(async () => {
            const result = await getCarbonCreditSuggestions({
                farmerId: userProfile.uid,
                district: userProfile.district,
                carbonFootprintDetails: footprintDetails,
            });

            if (result.error) {
                toast({
                    title: 'Error Generating Suggestions',
                    description: result.error,
                    variant: 'destructive',
                });
                setSuggestions(null);
            } else {
                setSuggestions(result.data!);
                toast({
                    title: 'Suggestions Generated!',
                    description: 'New recommendations are ready for you to review.',
                });
            }
        });
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Carbon Credit Balance</CardTitle>
                        <CardDescription>Earn credits by adopting sustainable farming practices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-full">
                                <Sprout className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-4xl font-bold">120 Credits</p>
                                <p className="text-muted-foreground">Last updated: 2 days ago</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <p className="text-sm text-muted-foreground">Effivera is working to sell these credits to corporations. You will receive a payout soon. Keep up the great work!</p>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Optimize Your Credits</CardTitle>
                        <CardDescription>Get AI-powered suggestions to increase your earnings.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="footprintDetails">Describe your current practices</Label>
                                <Textarea
                                    id="footprintDetails"
                                    placeholder="e.g., 'Using 50kg of urea per acre for wheat, conventional tillage methods...'"
                                    value={footprintDetails}
                                    onChange={(e) => setFootprintDetails(e.target.value)}
                                    rows={5}
                                    required
                                />
                                <p className="text-sm text-muted-foreground">Include details on fertilizer usage, farming practices, and any other relevant data.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending || !footprintDetails}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Get Suggestions
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            <div>
                {isPending && (
                    <div className="flex items-center justify-center h-full rounded-lg border border-dashed p-8">
                        <div className="text-center">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">Generating Your Custom Plan</h3>
                            <p className="mt-1 text-muted-foreground">Our AI is analyzing your data to find the best opportunities.</p>
                        </div>
                    </div>
                )}
                {suggestions && !isPending && (
                    <Card className="bg-green-50/30 dark:bg-green-900/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl"><Sparkles className="text-accent" /> AI Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><TestTube2 className="text-primary" />Fertilizer Savings</h4>
                                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{suggestions.fertilizerSavingsSuggestions}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><Sprout className="text-primary" />Carbon Sequestration</h4>
                                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{suggestions.carbonSequestrationRecommendations}</p>
                            </div>
                            <div className="bg-background/80 p-4 rounded-lg border">
                                <h4 className="font-semibold">Estimated Credit Increase</h4>
                                <p className="text-lg font-bold text-primary mt-1">{suggestions.estimatedCreditIncrease}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 {!suggestions && !isPending && (
                    <div className="flex items-center justify-center h-full rounded-lg border border-dashed p-8">
                        <div className="text-center">
                            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Your suggestions will appear here</h3>
                            <p className="mt-1 text-muted-foreground">Fill out the form to get started.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
