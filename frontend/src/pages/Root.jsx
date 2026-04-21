import { Box, Typography, Container, Stack, Button } from "@mui/material";
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

const floatY = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0%, 100% { text-shadow: 0 8px 20px rgba(15,23,42,0.08); }
  50% { text-shadow: 0 12px 28px rgba(16,185,129,0.16); }
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
        bgcolor: "#ffffff",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(22,163,74,0.08) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 75%, rgba(0,0,0,0.05) 0%, rgba(255,255,255,0) 45%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -90,
          left: -120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(255,255,255,0) 68%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: -120,
          bottom: -120,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(15,23,42,0.13) 0%, rgba(255,255,255,0) 72%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="md">
        <Stack
          spacing={5}
          alignItems="center"
          textAlign="center"
          sx={{ py: { xs: 5, md: 8 } }}
        >
          <Box sx={{ width: "100%", p: { xs: 3, sm: 4 }, position: "relative" }}>
            <Stack spacing={2.2} alignItems="center">
              <Box sx={{ position: "relative", width: "fit-content", px: 1.5, py: 1, animation: `${floatY} 4.2s ease-in-out infinite` }}>
                <Typography
                  sx={{
                    position: "relative",
                    fontSize: { xs: "2.7rem", sm: "4.3rem" },
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    color: "#111",
                    animation: `${glow} 4.5s ease-in-out infinite`,
                  }}
                >
                  ECOLENS
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: "1.04rem", sm: "1.2rem" },
                  color: "#3f5f56",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                AI 분리수거 안내 및 자원회수 위치 안내
              </Typography>
            </Stack>
          </Box>

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
                    bgcolor: "#111",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
                    "&:hover": { bgcolor: "#166534", color: "#fff" },
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
                    bgcolor: "#111",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
                    "&:hover": { bgcolor: "#166534", color: "#fff" },
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
                  bgcolor: "#111",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 800,
                  boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
                  "&:hover": { bgcolor: "#166534", color: "#fff" },
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
