"use client";
import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Container,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (formData.email && formData.senha) {
        // Buscar usuário no Supabase
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', formData.email)
          .eq('senha', formData.senha)
          .eq('ativo', true)
          .single();

        if (error) {
          console.error('Erro no login:', error);
          if (error.code === 'PGRST116') {
            setError("Email ou senha incorretos. Verifique suas credenciais.");
          } else {
            setError("Erro ao fazer login. Tente novamente.");
          }
          return;
        }

        if (!data) {
          setError("Email ou senha incorretos.");
          return;
        }

        // Salvar dados do usuário autenticado
        localStorage.setItem("user", JSON.stringify({
          id: data.id,
          email: data.email,
          nome: data.nome,
          cargo: data.cargo,
          ativo: data.ativo
        }));
        
        // Redirecionar para o dashboard
        router.push("/");
      } else {
        setError("Por favor, preencha todos os campos.");
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Logo e Título */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: 3,
                border: "4px solid #1976d2",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  textAlign: "center",
                  lineHeight: 1.2,
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  border: "2px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                GRUPO<br />THERMAS
              </Box>
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                mb: 1,
                letterSpacing: 1,
              }}
            >
              Grupo Thermas
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                mb: 3,
              }}
            >
              Sistema de Gestão
            </Typography>
          </Box>

          <Divider sx={{ mb: 4, opacity: 0.3 }} />

          {/* Formulário de Login */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                textAlign: "center",
                color: "text.primary",
              }}
            >
              Acesse sua conta
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Campo Email */}
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              required
              sx={{ 
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Campo Senha */}
            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={formData.senha}
              onChange={handleChange("senha")}
              required
              sx={{ 
                mb: 4,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "primary.main" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Botão de Login */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1.1rem",
                textTransform: "none",
                boxShadow: 3,
                "&:hover": {
                  boxShadow: 6,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </Box>

          {/* Links de Ajuda */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Esqueceu sua senha?{" "}
              <MuiLink
                component={Link}
                href="#"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Recuperar senha
              </MuiLink>
            </Typography>
            
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Precisa de ajuda?{" "}
              <MuiLink
                component={Link}
                href="#"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Contate o suporte
              </MuiLink>
            </Typography>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              fontWeight: 500,
            }}
          >
            © 2024 Grupo Thermas. Todos os direitos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 