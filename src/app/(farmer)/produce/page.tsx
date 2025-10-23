"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, IndianRupee, MapPin, Scale } from "lucide-react";

import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";


interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  produceName: string;
  quantity: number;
  quantityUnit: 'Quintal' | 'Ton';
  askPrice: number;
  location: string;
  status: 'available' | 'sold';
}

const produceSchema = z.object({
  produceName: z.string().min(1, "Produce name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  quantityUnit: z.enum(['Quintal', 'Ton']),
  askPrice: z.coerce.number().min(1, "Price must be at least 1."),
});

export default function SellProducePage() {
  const { userProfile } = useAuth();
  const [myListings, setMyListings] = useState<ProduceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof produceSchema>>({
    resolver: zodResolver(produceSchema),
  });

  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, "produceListings"),
      where("farmerId", "==", userProfile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProduceListing));
      setMyListings(data.sort((a, b) => a.status.localeCompare(b.status)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleListProduce = async (values: z.infer<typeof produceSchema>) => {
    if (!userProfile) return;
    
    try {
      await addDoc(collection(db, "produceListings"), {
        farmerId: userProfile.uid,
        farmerName: userProfile.name,
        produceName: values.produceName,
        quantity: values.quantity,
        quantityUnit: values.quantityUnit,
        askPrice: values.askPrice,
        location: userProfile.district,
        status: 'available',
        createdAt: Timestamp.now(),
      });

      toast({
        title: "Produce Listed!",
        description: `Your ${values.produceName} is now on the marketplace.`,
      });
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Listing Failed",
        description: "Could not list your produce. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">My Produce Listings</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Sell Your Fasal</Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>List Your Produce for Sale</DialogTitle>
                    <DialogDescription>Fill in the details to add your produce to the marketplace.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleListProduce)} className="space-y-4">
                        <FormField control={form.control} name="produceName" render={({ field }) => (
                            <FormItem><FormLabel>Produce Name</FormLabel><FormControl><Input placeholder="e.g., Wheat" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="quantityUnit" render={({ field }) => (
                                <FormItem><FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select unit"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Quintal">Quintal</SelectItem>
                                        <SelectItem value="Ton">Ton</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="askPrice" render={({ field }) => (
                            <FormItem><FormLabel>Asking Price (per unit)</FormLabel><FormControl><Input type="number" placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">List Produce</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        myListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myListings.map(item => {
              const placeholder = PlaceHolderImages.find(p => p.id === item.produceName.toLowerCase());
              return (
                <Card key={item.id} className={cn("shadow-lg", item.status === 'sold' && 'bg-gray-100 dark:bg-gray-800/20 opacity-70')}>
                  <div className="flex">
                    <div className="w-2/5">
                        <Image
                            src={placeholder?.imageUrl || "https://picsum.photos/seed/default/600/400"}
                            alt={item.produceName}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover rounded-l-lg"
                            data-ai-hint={placeholder?.imageHint || 'farm produce'}
                        />
                    </div>
                    <div className="w-3/5">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                {item.produceName}
                                <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className={cn(item.status === 'available' && 'bg-green-600')}>{item.status}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="flex items-center"><Scale className="h-4 w-4 mr-2 text-muted-foreground" /> {item.quantity} {item.quantityUnit}</p>
                            <p className="flex items-center"><IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" /> {item.askPrice} / {item.quantityUnit}</p>
                            <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> {item.location}</p>
                        </CardContent>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Produce Listed Yet</h3>
            <p className="text-muted-foreground mt-2">Click "Sell Your Fasal" to add your produce to the marketplace.</p>
          </div>
        )
      )}
    </>
  );
}
