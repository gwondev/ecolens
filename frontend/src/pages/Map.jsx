import { useEffect } from "react";
import { Typography, Box, Paper, Stack, Chip, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getUser } from "../services/auth";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";

const Map = () => {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!user?.oauthId) {
      navigate("/");
    }
  }, [navigate, user?.oauthId]);

  if (!user?.oauthId) return null;

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, color: "#fff", bgcolor: "#030403", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            반가워요, <span style={{ color: "#7CFF72" }}>{user?.nickname || "사용자"}</span>님
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.7 }}>
            주변 GREENEYE 모듈 상태를 확인하고 배출할 모듈을 선택하세요.
          </Typography>
        </Box>
        <Chip
          icon={<SensorsRoundedIcon />}
          label="상태 실시간 모니터링"
          sx={{
            color: "#7CFF72",
            border: "1px solid rgba(124,255,114,0.28)",
            backgroundColor: "rgba(124,255,114,0.08)",
          }}
        />
      </Stack>

      <Paper
        sx={{
          height: "68vh",
          bgcolor: "rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #7CFF72",
          borderRadius: 3,
          gap: 1.5,
        }}
      >
        <PlaceRoundedIcon sx={{ fontSize: 38, color: "#7CFF72" }} />
        <Typography color="#7CFF72" sx={{ fontWeight: 700 }}>
          여기에 지도와 모듈 마커가 표시됩니다.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
          다음 단계: GPS 기반 현재 위치 + 모듈 API 연동
        </Typography>
        <Button variant="outlined" sx={{ mt: 1.5, color: "#7CFF72", borderColor: "rgba(124,255,114,0.35)" }}>
          모듈 목록 새로고침
        </Button>
      </Paper>
    </Box>
  );
};

export default Map;
