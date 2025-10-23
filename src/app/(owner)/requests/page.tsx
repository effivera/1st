"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, Clock, IndianRupee, Tractor, User, X } from "lucide-react";

interface Booking {
  id: string;
  equipmentName: string;
  bookingDate: { toDate: () => Date };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalCost: number;
  farmerId: string;
}

interface FarmerProfile {
  name: string;
}

export default function BookingRequestsPage() {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [farmers, setFarmers] = useState<Record<string, FarmerProfile>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "bookings"),
      where("ownerId", "==", userProfile.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setRequests(data);
      setLoading(false);
      
      // Fetch farmer names
      data.forEach(req => {
        if (!farmers[req.farmerId]) {
          const farmerRef = doc(db, "users", req.farmerId);
          onSnapshot(farmerRef, (farmerDoc) => {
            if (farmerDoc.exists()) {
              setFarmers(prev => ({ ...prev, [req.farmerId]: farmerDoc.data() as FarmerProfile }));
            }
          });
        }
      });
    });

    return () => unsubscribe();
  }, [userProfile, farmers]);

  const handleRequest = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { status: newStatus });
    toast({ title: `Booking has been ${newStatus}.` });
  };

  return (
    <div>
        <h2 className="text-2xl font-bold font-headline mb-6">Pending Booking Requests</h2>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id}>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <div className="space-y-2">
                  <p className="font-semibold flex items-center gap-2"><Tractor className="h-4 w-4 text-muted-foreground"/> {req.equipmentName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> {farmers[req.farmerId]?.name || 'Loading...'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> {req.bookingDate.toDate().toLocaleDateString()}</p>
                  <p className="text-sm font-semibold flex items-center gap-2"><IndianRupee className="h-4 w-4 text-muted-foreground"/> {req.totalCost}</p>
                </div>
                <div className="flex items-center gap-2 justify-self-start md:justify-self-center">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Pending Approval</span>
                </div>
                <div className="flex gap-2 justify-self-start md:justify-self-end">
                  <Button size="sm" onClick={() => handleRequest(req.id, 'confirmed')}>
                    <Check className="mr-2 h-4 w-4"/> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRequest(req.id, 'cancelled')}>
                    <X className="mr-2 h-4 w-4"/> Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Pending Requests</h3>
            <p className="text-muted-foreground mt-2">New booking requests will appear here when farmers request your equipment.</p>
        </div>
      )}
    </div>
  );
}
