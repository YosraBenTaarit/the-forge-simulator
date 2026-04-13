import "./globals.css";
import { AuthSessionProvider } from "@/components/SessionProvider";

export const metadata = {
  title: 'The Forge Simulator',
  description: 'High-fidelity debugging simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
