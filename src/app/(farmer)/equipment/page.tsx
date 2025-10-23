"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Timestamp, addDoc, doc, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { IndianRupee, MapPin, Search } from "lucide-react";
import { addDays } from "date-fns";

interface Equipment {
  id: string;
  ownerId: string;
  ownerName: string;
  equipmentName: string;
  equipmentType: 'Tractor' | 'Harvester' | 'Drone' | 'Tiller';
  rate: number;
  rateType: 'perHour' | 'perDay' | 'perAcre';
  imageUrl: string;
  location: string;
  isAvailable: boolean;
}

const bookingSchema = z.object({
  bookingDate: z.date({
    required_error: "A booking date is required.",
  }),
});

export default function BookEquipmentPage() {
  const { userProfile } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", type: "all", location: "" });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    const q = query(collection(db, "equipment"), where("isAvailable", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setEquipmentList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleBooking = async (values: z.infer<typeof bookingSchema>) => {
    if (!userProfile || !selectedEquipment) return;
    
    try {
      await addDoc(collection(db, "bookings"), {
        farmerId: userProfile.uid,
        ownerId: selectedEquipment.ownerId,
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.equipmentName,
        bookingDate: Timestamp.fromDate(values.bookingDate),
        totalCost: selectedEquipment.rate, // Simplified cost
        status: 'pending',
      });

      toast({
        title: "Booking Request Sent!",
        description: `${selectedEquipment.equipmentName} has been requested for ${values.bookingDate.toLocaleDateString()}.`,
      });
      setIsBookingModalOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Could not send booking request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredEquipment = equipmentList.filter(item => {
    return (
      item.equipmentName.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.type === "all" || item.equipmentType === filters.type) &&
      item.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for equipment..."
              className="pl-10"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select
            value={filters.type}
            onValueChange={value => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Equipment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Tractor">Tractor</SelectItem>
              <SelectItem value="Harvester">Harvester</SelectItem>
              <SelectItem value="Drone">Drone</SelectItem>
              <SelectItem value="Tiller">Tiller</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Location (District)..."
            className="w-full md:w-[180px]"
            value={filters.location}
            onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
                <CardFooter className="p-4">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEquipment.map(item => {
              const placeholder = PlaceHolderImages.find(p => p.id === item.equipmentType.toLowerCase());
              return (
              <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <Image
                  src={placeholder?.imageUrl || "https://picsum.photos/seed/default/600/400"}
                  alt={item.equipmentName}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={placeholder?.imageHint}
                />
                <CardHeader>
                  <CardTitle>{item.equipmentName}</CardTitle>
                  <Badge variant="secondary">{item.equipmentType}</Badge>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <p className="flex items-center text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{item.location}</p>
                    <p className="font-semibold text-lg flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />{item.rate}
                        <span className="text-sm font-normal text-muted-foreground ml-1">/{item.rateType.replace('per', '')}</span>
                    </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="secondary" onClick={() => {
                    setSelectedEquipment(item);
                    setIsBookingModalOpen(true);
                  }}>Book Now</Button>
                </CardFooter>
              </Card>
            )})}
          </div>
        )}
        {filteredEquipment.length === 0 && !loading && (
            <div className="text-center py-16 col-span-full">
                <p className="text-muted-foreground">No equipment found matching your criteria.</p>
            </div>
        )}
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book: {selectedEquipment?.equipmentName}</DialogTitle>
            <DialogDescription>Select a date to send a booking request to the owner.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBooking)} className="space-y-8">
              <FormField
                control={form.control}
                name="bookingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Booking Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < addDays(new Date(), -1)
                        }
                        initialFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                <Button type="submit">Confirm Booking</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
