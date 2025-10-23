
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Tractor, IndianRupee } from "lucide-react";

export default function OwnerDashboard() {
  const { userProfile } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [listedEquipment, setListedEquipment] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const requestsQuery = query(
      collection(db, "bookings"),
      where("ownerId", "==", userProfile.uid),
      where("status", "==", "pending")
    );
    const requestsUnsub = onSnapshot(requestsQuery, (snapshot) => {
      setPendingRequests(snapshot.size);
      if(loading) setLoading(false);
    });

    const equipmentQuery = query(
      collection(db, "equipment"),
      where("ownerId", "==", userProfile.uid)
    );
    const equipmentUnsub = onSnapshot(equipmentQuery, (snapshot) => {
      setListedEquipment(snapshot.size);
      if(loading) setLoading(false);
    });

    const earningsQuery = query(
        collection(db, "bookings"),
        where("ownerId", "==", userProfile.uid),
        where("status", "==", "completed")
    );
    const earningsUnsub = onSnapshot(earningsQuery, (snapshot) => {
        let earnings = 0;
        snapshot.forEach(doc => {
            earnings += doc.data().totalCost || 0;
        });
        setTotalEarnings(earnings);
        if(loading) setLoading(false);
    });

    return () => {
      requestsUnsub();
      equipmentUnsub();
      earningsUnsub();
    };
  }, [userProfile, loading]);

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
        <p className="text-muted-foreground">Here&apos;s a summary of your equipment rental business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Booking Requests</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">New requests to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Listed Equipment</CardTitle>
            <Tractor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listedEquipment}</div>
            <p className="text-xs text-muted-foreground">Items available for rent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">From completed bookings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
