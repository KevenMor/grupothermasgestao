"use client";

import React, { memo } from "react";
import { Box, CssBaseline, useTheme, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";
import { usePathname } from "next/navigation";

interface SystemLayoutProps {
  children: React.ReactNode;
}

const SystemLayout = memo(function SystemLayout({ children }: SystemLayoutProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Se estiver na página de login, não mostrar o sidebar nem AuthGuard
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh", width: "100vw", position: "relative" }}>
        <CssBaseline />
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: "100vh",
            backgroundColor: "#f8fafc",
            // Mobile: ocupar toda a largura, padding menor
            ...(isMobile && {
              padding: "12px",
              paddingTop: "80px", // Espaço para o botão mobile do sidebar
              width: "100%",
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
              position: "relative",
              height: "100vh",
            }),
            // Desktop: ocupar espaço restante após sidebar sem margens
            ...(!isMobile && {
              width: "calc(100vw - 280px)",
              padding: "16px 20px",
              overflow: "auto",
              position: "relative",
              height: "100vh",
            }),
            transition: "all 0.3s ease",
            "& > *": {
              maxWidth: "100%",
              width: "100%",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
});

export default SystemLayout; 