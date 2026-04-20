import { Box, Typography, Container, Stack, Button, Paper } from "@mui/material";
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
        bgcolor: "#fff",
        color: "#111",
        display: "flex",
        alignItems: "center",
      }}
    >
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
              border: "1px solid #e8e8e8",
            }}
          >
            <Stack spacing={2.5} alignItems="center">
              <Typography sx={{ fontSize: { xs: "2.2rem", sm: "3.2rem" }, fontWeight: 900, letterSpacing: "0.06em" }}>
                ECOLENS
              </Typography>
              <Typography sx={{ fontSize: "1rem", color: "#555", lineHeight: 1.6 }}>
                로그인 후 닉네임을 설정하면 지도 기반 분리수거 화면으로 이동합니다.
              </Typography>
            </Stack>
          </Paper>

          <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
            {!user ? (
              isLocalDev ? (
                <Button
                  onClick={handleLocalGoogleShortcut}
                  variant="contained"
                  sx={{ minWidth: 220, height: 48, borderRadius: 2, bgcolor: "#111", color: "#fff", textTransform: "none", fontWeight: 700 }}
                >
                  구글 로그인 (로컬 테스트)
                </Button>
              ) : isDevBypass() ? (
                <Button onClick={handleLocalDevLogin} variant="contained" sx={{ minWidth: 220, height: 48, borderRadius: 2, bgcolor: "#111", color: "#fff", textTransform: "none", fontWeight: 700 }}>
                  개발용 로그인
                </Button>
              ) : (
                <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="signin_with"
                    ux_mode="popup"
                    width={280}
                  />
                </Box>
              )
            ) : (
              <Button onClick={() => navigate("/map")} variant="contained" sx={{ minWidth: 240, height: 50, borderRadius: 2, bgcolor: "#111", color: "#fff", textTransform: "none", fontWeight: 700 }}>
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
