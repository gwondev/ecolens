import { Box, Typography, Container, Stack, Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import {
  loginWithGoogleCredential,
  saveAuth,
  getUser,
  isDevBypass,
  saveUser,
  DEV_OAUTH_ID,
} from "../services/auth";
import { GoogleLogin } from "@react-oauth/google";

const pulseRing = keyframes`
  0% { transform: scale(0.92); opacity: 0.42; }
  50% { transform: scale(1.08); opacity: 0.14; }
  100% { transform: scale(0.92); opacity: 0.42; }
`;

const scanline = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 0 220px; }
`;

const Root = () => {
  const navigate = useNavigate();
  const user = getUser();
  const navigateRef = useRef(navigate);
  const isLocalDev = import.meta.env.DEV;

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

  const handleLocalGoogleShortcut = () => {
    saveUser({
      oauthId: DEV_OAUTH_ID,
      nickname: "",
      role: "ADMIN",
      status: "ACTIVE",
    });
    navigate("/nickname");
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#050505",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 55%)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="sm">
        <Stack
          spacing={4}
          alignItems="center"
          textAlign="center"
          sx={{ py: { xs: 5, md: 8 } }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              border: "1px solid rgba(255,255,255,0.18)",
              background: "linear-gradient(170deg, #0f0f0f 0%, #070707 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 6px)",
                animation: `${scanline} 8s linear infinite`,
                pointerEvents: "none",
              }}
            />
            <Stack spacing={2.5} alignItems="center">
              <Box sx={{ position: "relative", width: "fit-content", px: 1.5, py: 1 }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: -10,
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.35)",
                    animation: `${pulseRing} 2.8s ease-in-out infinite`,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "2.4rem", sm: "3.6rem" },
                    fontWeight: 900,
                    letterSpacing: "0.11em",
                    textShadow: "0 0 20px rgba(255,255,255,0.28)",
                  }}
                >
                  ECOLENS
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.72)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Black and White Smart Recycling
              </Typography>
              <Typography sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.76)", lineHeight: 1.6 }}>
                사진 인식과 지도 기반 수거 포인트를 한 화면에서 연결해요.
              </Typography>
            </Stack>
          </Paper>

          <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
            {!user ? (
              isLocalDev ? (
                <Button
                  onClick={handleLocalGoogleShortcut}
                  variant="contained"
                  sx={{
                    minWidth: 220,
                    height: 48,
                    borderRadius: 999,
                    bgcolor: "#fff",
                    color: "#111",
                    textTransform: "none",
                    fontWeight: 800,
                    "&:hover": { bgcolor: "#f1f1f1" },
                  }}
                >
                  구글 로그인 (로컬 테스트)
                </Button>
              ) : isDevBypass() ? (
                <Button
                  onClick={handleLocalDevLogin}
                  variant="contained"
                  sx={{
                    minWidth: 220,
                    height: 48,
                    borderRadius: 999,
                    bgcolor: "#fff",
                    color: "#111",
                    textTransform: "none",
                    fontWeight: 800,
                    "&:hover": { bgcolor: "#f1f1f1" },
                  }}
                >
                  개발용 로그인
                </Button>
              ) : (
                <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
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
                variant="contained"
                sx={{
                  minWidth: 240,
                  height: 50,
                  borderRadius: 999,
                  bgcolor: "#fff",
                  color: "#111",
                  textTransform: "none",
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#f1f1f1" },
                }}
              >
                지도 페이지로 이동
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Root;
