
"use client";
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const demoUsers = [
    { email: 'farmer@test.com', role: 'Farmer' },
    { email: 'owner@test.com', role: 'Owner' },
    { email: 'buyer@test.com', role: 'Buyer' },
];

export default function LoginPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: 'password',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      // We are not awaiting this. The onAuthStateChanged listener in AuthProvider will handle the redirect.
      initiateEmailSignIn(auth, values.email, values.password);
    } catch (error: any) {
      console.error("Login Submission Error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
      // Also emit to our global handler
      errorEmitter.emit('permission-error', error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>

       <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Demo Accounts</CardTitle>
          <CardDescription>
            Use these accounts to test the app. The password for all accounts is <span className="font-mono font-bold text-foreground">password</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {demoUsers.map(user => (
            <div key={user.email} className="flex justify-between items-center">
              <span className="text-muted-foreground">{user.email}</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
