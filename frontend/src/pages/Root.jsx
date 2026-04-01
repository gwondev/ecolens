import { Box, Typography, Container, Stack, Button } from "@mui/material";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  loginWithGoogleCredential,
  saveAuth,
  getUser,
  isDevBypass,
  saveUser,
  DEV_OAUTH_ID,
} from "../services/auth";
import { GoogleLogin } from "@react-oauth/google";

const floatSlow = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -8px, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

const glowPulse = keyframes`
  0% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.08); }
  100% { opacity: 0.45; transform: scale(1); }
`;

const Root = () => {
  const navigate = useNavigate();
  const user = getUser();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const handleLocalDevLogin = () => {
    saveUser({
      oauthId: DEV_OAUTH_ID,
      nickname: "gwon",
      role: "ADMIN",
      status: "ACTIVE",
    });
    navigate("/map");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error("Google credential is missing");

      const loginResponse = await loginWithGoogleCredential(credential);
      console.log("google loginResponse:", loginResponse);

      const user = loginResponse?.user;
      const oauthId = user?.oauthId ?? user?.oauth_id;
      if (!oauthId) throw new Error("로그인 응답의 oauthId가 없습니다.");

      // 백엔드 직렬화/필드명에 따라 oauthId 키가 달라질 수 있어 정규화
      const normalizedLoginResponse = {
        ...loginResponse,
        user: {
          ...user,
          oauthId,
        },
      };

      saveAuth(normalizedLoginResponse);
      if (loginResponse?.isNewUser) {
        navigateRef.current("/nickname");
      } else {
        navigateRef.current("/map");
      }
    } catch (error) {
      console.error(error);
      alert("로그인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleGoogleError = () => {
    alert("구글 로그인에 실패했습니다.");
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#030403",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-8%",
          left: "-10%",
          width: { xs: 220, md: 420 },
          height: { xs: 220, md: 420 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(57,255,20,0.16) 0%, rgba(57,255,20,0.06) 35%, rgba(57,255,20,0) 72%)",
          filter: "blur(24px)",
          animation: `${glowPulse} 6s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          right: "-12%",
          bottom: "-10%",
          width: { xs: 260, md: 460 },
          height: { xs: 260, md: 460 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,255,140,0.14) 0%, rgba(0,255,140,0.05) 34%, rgba(0,255,140,0) 72%)",
          filter: "blur(30px)",
          animation: `${glowPulse} 7.5s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: { xs: "28px 28px", md: "40px 40px" },
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.1) 100%)",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          spacing={{ xs: 4, md: 5 }}
          alignItems="center"
          textAlign="center"
          sx={{ py: { xs: 6, md: 8 } }}
        >
          <Stack spacing={2} alignItems="center" component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <Typography
              sx={{
                fontSize: { xs: "2.7rem", sm: "4.3rem", md: "6rem" },
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "0.14em",
                color: "#ffffff",
                textTransform: "uppercase",
                textShadow:
                  "0 0 10px rgba(57,255,20,0.10), 0 0 30px rgba(57,255,20,0.10)",
                animation: `${floatSlow} 6s ease-in-out infinite`,
              }}
            >
              ECOLENS
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "0.98rem", sm: "1.15rem", md: "1.3rem" },
                color: "rgba(255,255,255,0.74)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                maxWidth: 820,
                lineHeight: 1.7,
              }}
            >
              AI 기반 지역별 분리배출 안내 플랫폼
            </Typography>
          </Stack>

          {!user ? (
            isDevBypass() ? (
              <Button
                onClick={handleLocalDevLogin}
                sx={{
                  mt: 1,
                  minWidth: 220,
                  height: 52,
                  borderRadius: 999,
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 800,
                  border: "1px solid rgba(57,255,20,0.26)",
                }}
              >
                개발용 로그인
              </Button>
            ) : (
              <Box sx={{ mt: 1, mx: "auto", width: "100%", maxWidth: 280, display: "flex", justifyContent: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  shape="pill"
                  text="signin_with"
                  ux_mode="popup"
                  width={280}
                />
              </Box>
            )
          ) : (
            <Button
              onClick={() => navigate("/map")}
              sx={{
                mt: 1,
                minWidth: { xs: 220, sm: 250 },
                height: 54,
                px: 3.5,
                borderRadius: 999,
                color: "#fff",
                textTransform: "none",
                fontWeight: 800,
                fontSize: "1rem",
                border: "1px solid rgba(57,255,20,0.26)",
                background:
                  "linear-gradient(90deg, rgba(9,20,9,0.96), rgba(10,16,10,0.98), rgba(9,20,9,0.96))",
                "&:hover": {
                  boxShadow: "0 0 24px rgba(57,255,20,0.16)",
                  background:
                    "linear-gradient(90deg, rgba(10,28,10,1), rgba(10,18,10,1), rgba(10,28,10,1))",
                },
              }}
            >
              서비스 시작
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Root;
