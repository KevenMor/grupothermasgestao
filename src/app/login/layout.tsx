import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Grupo Thermas",
  description: "Acesse o sistema de gestão do Grupo Thermas",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
} 