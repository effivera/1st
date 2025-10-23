"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, IndianRupee, MapPin } from "lucide-react";

import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Label } from "@/components/ui/label";

interface Equipment {
  id: string;
  equipmentName: string;
  equipmentType: 'Tractor' | 'Harvester' | 'Drone' | 'Tiller';
  rate: number;
  rateType: 'perHour' | 'perDay' | 'perAcre';
  imageUrl: string;
  location: string;
  isAvailable: boolean;
}

const equipmentSchema = z.object({
  equipmentName: z.string().min(1, "Equipment name is required."),
  equipmentType: z.enum(['Tractor', 'Harvester', 'Drone', 'Tiller']),
  rate: z.coerce.number().min(1, "Rate must be at least 1."),
  rateType: z.enum(['perHour', 'perDay', 'perAcre']),
});

export default function MyEquipmentPage() {
  const { userProfile } = useAuth();
  const [myEquipment, setMyEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
  });

  useEffect(() => {
    if (!userProfile) return;
    const q = query(collection(db, "equipment"), where("ownerId", "==", userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setMyEquipment(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleAddEquipment = async (values: z.infer<typeof equipmentSchema>) => {
    if (!userProfile) return;
    
    try {
      const placeholder = PlaceHolderImages.find(p => p.id === values.equipmentType.toLowerCase());
      await addDoc(collection(db, "equipment"), {
        ownerId: userProfile.uid,
        ownerName: userProfile.name,
        equipmentName: values.equipmentName,
        equipmentType: values.equipmentType,
        rate: values.rate,
        rateType: values.rateType,
        imageUrl: placeholder?.imageUrl || "",
        location: userProfile.district,
        isAvailable: true,
        createdAt: Timestamp.now(),
      });
      toast({ title: "Equipment Added!", description: `${values.equipmentName} has been listed.` });
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Failed to Add Equipment", description: "An error occurred. Please try again.", variant: "destructive" });
    }
  };

  const toggleAvailability = async (equipmentId: string, currentStatus: boolean) => {
    const equipmentRef = doc(db, "equipment", equipmentId);
    await updateDoc(equipmentRef, { isAvailable: !currentStatus });
    toast({ title: `Equipment status updated to "${!currentStatus ? 'Available' : 'Unavailable'}"` });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">My Equipment</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Equipment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Equipment</DialogTitle><DialogDescription>Fill in the details to list your equipment for rent.</DialogDescription></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddEquipment)} className="space-y-4">
                <FormField control={form.control} name="equipmentName" render={({ field }) => (
                  <FormItem><FormLabel>Equipment Name</FormLabel><FormControl><Input placeholder="e.g., John Deere Tractor" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="equipmentType" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Tractor">Tractor</SelectItem>
                        <SelectItem value="Harvester">Harvester</SelectItem>
                        <SelectItem value="Drone">Drone</SelectItem>
                        <SelectItem value="Tiller">Tiller</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="rate" render={({ field }) => (
                    <FormItem><FormLabel>Rate</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="rateType" render={({ field }) => (
                    <FormItem><FormLabel>Per</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select rate type"/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="perHour">Hour</SelectItem>
                          <SelectItem value="perDay">Day</SelectItem>
                          <SelectItem value="perAcre">Acre</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )}/>
                </div>
                <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit">Add Equipment</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : myEquipment.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myEquipment.map(item => {
            const placeholder = PlaceHolderImages.find(p => p.id === item.equipmentType.toLowerCase());
            return (
              <Card key={item.id} className="shadow-lg flex flex-col">
                <Image src={placeholder?.imageUrl || ""} alt={item.equipmentName} width={600} height={400} className="w-full h-48 object-cover rounded-t-lg" data-ai-hint={placeholder?.imageHint || 'equipment'} />
                <CardHeader>
                  <CardTitle>{item.equipmentName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <p className="flex items-center text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{item.location}</p>
                  <p className="font-semibold text-lg flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />{item.rate}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/{item.rateType.replace('per', '')}</span>
                  </p>
                </CardContent>
                <CardContent className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch id={`available-${item.id}`} checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)} />
                    <Label htmlFor={`available-${item.id}`}>{item.isAvailable ? "Available" : "Unavailable"}</Label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Equipment Listed Yet</h3>
          <p className="text-muted-foreground mt-2">Click "Add New Equipment" to get started.</p>
        </div>
      )}
    </>
  );
}
