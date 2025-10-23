
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Coins, Handshake, Tractor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CarbonCreditData {
  credits: number;
}

export default function FarmerDashboard() {
  const { userProfile } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [listingCount, setListingCount] = useState(0);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCreditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("farmerId", "==", userProfile.uid),
      where("status", "in", ["pending", "confirmed"])
    );
    const bookingsUnsub = onSnapshot(bookingsQuery, (snapshot) => {
      setBookingCount(snapshot.size);
    });

    const listingsQuery = query(
      collection(db, "produceListings"),
      where("farmerId", "==", userProfile.uid),
      where("status", "==", "available")
    );
    const listingsUnsub = onSnapshot(listingsQuery, (snapshot) => {
      setListingCount(snapshot.size);
    });
    
    const carbonCreditsQuery = query(
      collection(db, "carbonCredits"),
      where("userId", "==", userProfile.uid)
    );
    const carbonCreditsUnsub = onSnapshot(carbonCreditsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setCarbonCredits(snapshot.docs[0].data() as CarbonCreditData);
      } else {
        setCarbonCredits({ credits: 0 });
      }
      setLoading(false);
    });


    return () => {
      bookingsUnsub();
      listingsUnsub();
      carbonCreditsUnsub();
    };
  }, [userProfile]);

  if (loading || !userProfile) {
    return (
        <div>
            <div className="mb-6">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-80 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-24" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-24" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-24" /></CardContent></Card>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline">Welcome, {userProfile.name}!</h2>
        <p className="text-muted-foreground">Here&apos;s a summary of your farm activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingCount}</div>
            <p className="text-xs text-muted-foreground">Active equipment bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Produce Listings</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingCount}</div>
            <p className="text-xs text-muted-foreground">Listings available for buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Carbon Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carbonCredits?.credits || 0}</div>
            <p className="text-xs text-muted-foreground">Earned from sustainable practices</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tractor/> Book Equipment</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground">Find and rent tractors, harvesters, and more from owners near you.</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Link href="/farmer/equipment">
                    <Button>Browse Equipment</Button>
                </Link>
            </div>
        </Card>
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Handshake/> Sell Your Produce</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground">Connect with buyers and get the best price for your hard work.</p>
            </CardContent>
             <div className="p-6 pt-0">
                <Link href="/farmer/produce">
                    <Button>List Produce</Button>
                </Link>
            </div>
        </Card>
      </div>
    </div>
  );
}
