import EmotionCacheProvider from "@/components/EmotionCacheProvider";
import MuiProvider from "@/components/MuiProvider";
import SystemLayout from "@/components/SystemLayout";
import "./globals.css";

export const metadata = {
  title: "Grupo Thermas SaaS",
  description: "Gestão de usuários e vendas/sócios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        <EmotionCacheProvider>
          <MuiProvider>
            <SystemLayout>
              {children}
            </SystemLayout>
          </MuiProvider>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
