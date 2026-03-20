import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const RootPage = () => {
  const navigate = useNavigate();

  const menuCards = [
    { title: "쓰레기 인식", desc: "AI 이미지 분석" },
    { title: "분리배출 안내", desc: "배출 방법 가이드" },
    { title: "리워드 검증", desc: "IoT 감지 기반" },
    { title: "관제 페이지", desc: "쓰레기통 관리" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={5} alignItems="center" textAlign="center">
          {/* 팀명 */}
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.04em",
                mb: 1,
              }}
            >
              GreenEYE
            </Typography>

            {/* 주제명 */}
            <Typography
              variant="h6"
              sx={{
                color: "#bdbdbd",
                fontWeight: 400,
              }}
            >
              AI 기반 쓰레기 인식 및 분리배출 안내 플랫폼
            </Typography>
          </Box>

          {/* 메뉴 카드 */}
          <Grid container spacing={2} justifyContent="center">
            {menuCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#111",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                    borderRadius: 3,
                    p: 3,
                    textAlign: "left",
                    minHeight: 140,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cfcfcf" }}>
                    {card.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* 버튼 */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => navigate("/signup")}
              sx={{
                bgcolor: "#fff",
                color: "#000",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#ddd",
                },
              }}
            >
              회원가입
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/login")}
              sx={{
                color: "#fff",
                borderColor: "#444",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "#fff",
                  bgcolor: "rgba(255,255,255,0.04)",
                },
              }}
            >
              로그인
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default RootPage;