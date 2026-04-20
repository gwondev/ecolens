import { useState, useEffect } from "react";
import { Box, Container, TextField, Button, Typography, Stack, InputAdornment, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { DEV_OAUTH_ID, getUser, saveUser } from "../services/auth";
import { apiFetch } from "../services/api";

const NicknamePage = () => {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();
  const user = getUser();
  const isLocalDev = import.meta.env.DEV;

  useEffect(() => {
    if (!user?.oauthId) {
      navigate("/");
    }
  }, [user?.oauthId, navigate]);

  const handleSubmit = async () => {
    if (!user?.oauthId && !isLocalDev) {
      alert("로그인이 필요합니다.");
      return;
    }
    // 닉네임 입력 안 했을 때 방어 로직 추가
    if (!nickname.trim()) {
      alert("사용하실 별명을 입력해주세요.");
      return;
    }

    if (isLocalDev) {
      saveUser({
        ...(user || {}),
        oauthId: user?.oauthId || DEV_OAUTH_ID,
        nickname: nickname.trim(),
        role: user?.role || "ADMIN",
        status: user?.status || "ACTIVE",
      });
      navigate("/map");
      return;
    }

    try {
      const response = await apiFetch("/auth/nickname", {
        method: "PUT",
        body: JSON.stringify({
          oauthId: user.oauthId,
          nickname: nickname.trim(), // 앞뒤 공백 제거
        }),
      });
      // 서버 기준 사용자 정보로 로컬 저장 동기화
      const updatedUser = response?.user || { ...user, nickname: nickname.trim() };
      saveUser(updatedUser);
      // 성공하면 지도 페이지로 이동
      navigate("/map");
    } catch (e) {
      alert("이미 사용 중인 별명이거나 에러가 발생했습니다.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#fff",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Container maxWidth="sm">
        <Stack
          spacing={3}
          alignItems="center"
          sx={{ width: "100%" }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: 3,
              border: "1px solid #e8e8e8",
              p: { xs: 3, sm: 4 },
            }}
          >
            <Stack spacing={2.5} alignItems="center">
              <AccountCircleRoundedIcon sx={{ fontSize: 40, color: "#111" }} />
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                닉네임 설정
              </Typography>
              <Typography sx={{ color: "#555", fontSize: "0.98rem", lineHeight: 1.6 }}>
                닉네임 입력 후 바로 지도 페이지로 이동합니다.
              </Typography>
            </Stack>
          </Paper>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="별명 입력 (예: 나는그린아이)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircleRoundedIcon sx={{ color: "#888" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                color: "#111",
                backgroundColor: "#fff",
                fontSize: "1rem",
                fontWeight: 600,
                '& fieldset': {
                  borderColor: "#d7d7d7",
                  borderRadius: 2,
                },
                '&:hover fieldset': {
                  borderColor: "#111",
                },
                '&.Mui-focused fieldset': {
                  borderColor: "#111",
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: "#999",
                opacity: 1,
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            sx={{
              maxWidth: 320,
              height: 52,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
              backgroundColor: "#111",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#000",
              },
            }}
          >
            지도 시작하기
          </Button>

        </Stack>
      </Container>
    </Box>
  );
};

export default NicknamePage;