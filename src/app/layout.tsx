import EmotionCacheProvider from "@/components/EmotionCacheProvider";
import MuiProvider from "@/components/MuiProvider";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { Box } from "@mui/material";

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
    <html lang="pt-BR">
      <body>
        <EmotionCacheProvider>
          <MuiProvider>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
              <Sidebar />
              <Box component="main" sx={{ flex: 1, p: { xs: 1, sm: 3, md: 4 }, width: '100%', minHeight: '100vh', bgcolor: 'background.default', transition: 'padding 0.3s' }}>
                {children}
              </Box>
            </Box>
          </MuiProvider>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
