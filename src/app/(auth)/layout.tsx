import AppLogo from "@/components/app/AppLogo";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <AppLogo className="justify-center" />
            <h1 className="text-3xl font-bold font-headline mt-2">Welcome</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {heroImage && (
            <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width="1920"
            height="1080"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            data-ai-hint={heroImage.imageHint}
            />
        )}
      </div>
    </div>
  );
}
