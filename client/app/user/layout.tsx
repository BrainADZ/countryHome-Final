// app/(user)/layout.tsx
import "@/styles/user.css";
import { ReactNode } from "react";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-blue-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
