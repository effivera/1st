
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, Tractor, XCircle, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  equipmentName: string;
  bookingDate: { toDate: () => Date };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalCost: number;
}

const statusConfig = {
    pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-500' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'bg-green-500' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
};


export default function MyBookingsPage() {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "bookings"),
      where("farmerId", "==", userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data.sort((a, b) => b.bookingDate.toDate().getTime() - a.bookingDate.toDate().getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <div>
        <h2 className="text-2xl font-bold font-headline mb-6">My Equipment Bookings</h2>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(booking => {
            const config = statusConfig[booking.status];
            return (
            <Card key={booking.id}>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-4 col-span-2">
                    <Tractor className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{booking.equipmentName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4"/> {booking.bookingDate.toDate().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.totalCost}</span>
                </div>
                <div>
                  <Badge variant="outline" className="flex items-center gap-2 text-sm">
                    <config.icon className={cn("h-4 w-4", config.color.replace('bg-', 'text-'))} />
                    {config.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Bookings Yet</h3>
            <p className="text-muted-foreground mt-2">When you book equipment, your requests will appear here.</p>
        </div>
      )}
    </div>
  );
}
