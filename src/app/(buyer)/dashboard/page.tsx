
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import Image from "next/image";

import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { IndianRupee, MapPin, Phone, Search, Scale, User } from "lucide-react";
import { UserProfile } from "@/context/AuthContext";

interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  produceName: string;
  quantity: number;
  quantityUnit: 'Quintal' | 'Ton';
  askPrice: number;
  location: string;
}

interface FullListing extends ProduceListing {
    farmerDetails?: UserProfile;
}

export default function BuyerMarketplacePage() {
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", location: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<FullListing | null>(null);

  useEffect(() => {
    const q = query(collection(db, "produceListings"), where("status", "==", "available"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProduceListing));
      setListings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleViewDetails = async (listing: ProduceListing) => {
      const fullListing: FullListing = {...listing};
      const farmerRef = doc(db, "users", listing.farmerId);
      const farmerSnap = await getDoc(farmerRef);
      if(farmerSnap.exists()){
          fullListing.farmerDetails = farmerSnap.data() as UserProfile;
      }
      setSelectedListing(fullListing);
      setIsModalOpen(true);
  }

  const filteredListings = listings.filter(item => {
    return (
      item.produceName.toLowerCase().includes(filters.search.toLowerCase()) &&
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
              placeholder="Search for produce (e.g., Wheat)..."
              className="pl-10"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Location (District)..."
            className="w-full md:w-[240px]"
            value={filters.location}
            onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-64 w-full" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredListings.map(item => {
              const placeholder = PlaceHolderImages.find(p => p.id === item.produceName.toLowerCase());
              return (
                <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <Image
                    src={placeholder?.imageUrl || "https://picsum.photos/seed/default/600/400"}
                    alt={item.produceName}
                    width={600}
                    height={400}
                    className="w-full h-48 object-cover"
                    data-ai-hint={placeholder?.imageHint || 'produce'}
                  />
                  <CardHeader><CardTitle>{item.produceName}</CardTitle></CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <p className="flex items-center text-sm text-muted-foreground"><User className="h-4 w-4 mr-2" />{item.farmerName}</p>
                    <p className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{item.location}</p>
                    <p className="font-semibold text-lg flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />{item.askPrice}
                        <span className="text-sm font-normal text-muted-foreground ml-1">/ {item.quantityUnit}</span>
                    </p>
                    <p className="flex items-center text-sm text-muted-foreground"><Scale className="h-4 w-4 mr-2" />{item.quantity} {item.quantityUnit} available</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" onClick={() => handleViewDetails(item)}>View Details</Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
        {filteredListings.length === 0 && !loading && (
            <div className="text-center py-16 col-span-full">
                <p className="text-muted-foreground">No produce listings found matching your criteria.</p>
            </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            {selectedListing && (
            <>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">{selectedListing.produceName}</DialogTitle>
                    <DialogDescription>
                        Listed by {selectedListing.farmerName} from {selectedListing.location}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Asking Price</span>
                        <span className="font-bold text-xl"><IndianRupee className="inline h-5 w-5 mr-1" />{selectedListing.askPrice} / {selectedListing.quantityUnit}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Available Quantity</span>
                        <span className="font-semibold">{selectedListing.quantity} {selectedListing.quantityUnit}</span>
                    </div>
                    {selectedListing.farmerDetails && (
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="text-base">Contact Farmer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground"/>{selectedListing.farmerDetails.name}</p>
                                <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground"/>{selectedListing.farmerDetails.phoneNumber}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
