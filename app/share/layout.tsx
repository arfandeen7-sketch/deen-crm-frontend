import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DEEN Properties · Listing",
  description: "Premium real estate presentation by DEEN Properties, Dubai.",
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen scroll-smooth bg-[#FAFAF7] font-sans text-[#1A1A1A] antialiased">
      {children}
    </div>
  );
}
