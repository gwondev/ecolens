import { Box, Button, Container, Stack, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import RecyclingRoundedIcon from "@mui/icons-material/RecyclingRounded";

const steps = [
  {
    n: 1,
    title: "쓰레기 촬영",
    icon: <PhotoCameraRoundedIcon sx={{ fontSize: 36, color: "#7CFF72" }} />,
    body:
      "Map 화면 아래 「쓰레기 촬영」으로 이동해 폐기물 사진을 찍거나 갤러리에서 고릅니다. Gemini가 분류를 제안하고, 필요하면 종류를 직접 고를 수 있습니다.",
  },
  {
    n: 2,
    title: "지도에서 쓰레기통(모듈) 선택",
    icon: <MapRoundedIcon sx={{ fontSize: 36, color: "#7CFF72" }} />,
    body:
      "지도에 초록 점으로 표시된 곳이 스마트 쓰레기통(모듈)입니다. 마커를 누르면 시리얼 번호와 상태가 나오고, 실제로 버릴 통을 골라 「버리기(READY)」를 누릅니다. 그 전에 Camera에서 맞는 분류(CAN / PET 등)를 잡아 두면 READY에 함께 반영됩니다.",
  },
  {
    n: 3,
    title: "READY 후 현장 배출",
    icon: <SensorsRoundedIcon sx={{ fontSize: 36, color: "#7CFF72" }} />,
    body:
      "READY가 전송되면 안내에 따라 통 근처에서 배출합니다. 이후 「투입 안내」 화면에서 LED·센서 동작을 확인할 수 있습니다.",
  },
  {
    n: 4,
    title: "팁",
    icon: <RecyclingRoundedIcon sx={{ fontSize: 36, color: "#7CFF72" }} />,
    body:
      "내 위치는 파란 점(🔵)으로 보입니다. 위치 권한을 켜야 정확히 맞춰집니다. 목록의 READY 버튼은 지도 팝업과 같은 동작입니다.",
  },
];

const MapGuide = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#030403", color: "#fff", py: { xs: 2.5, md: 4 } }}>
      <Container maxWidth="md" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.03em" }}>
              사이트 이용 방법
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 1, maxWidth: 520 }}>
              GREENEYE는 촬영 → 지도에서 통 선택 → READY 순으로 이어집니다. 아래 순서대로 따라가면 됩니다.
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/map")}
            variant="outlined"
            sx={{ color: "#7CFF72", borderColor: "rgba(124,255,114,0.45)", fontWeight: 700, flexShrink: 0 }}
          >
            Map으로
          </Button>
        </Stack>

        <Stack spacing={2.5}>
          {steps.map((s) => (
            <Paper
              key={s.n}
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                border: "1px solid rgba(124,255,114,0.22)",
                bgcolor: "rgba(255,255,255,0.04)",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "rgba(124,255,114,0.1)",
                  border: "1px solid rgba(124,255,114,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: 900,
                  color: "#7CFF72",
                  fontSize: "1.1rem",
                }}
              >
                {s.n}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }} flexWrap="wrap">
                  {s.icon}
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {s.title}
                  </Typography>
                </Stack>
                <Typography sx={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.75, wordBreak: "keep-all" }}>{s.body}</Typography>
              </Box>
            </Paper>
          ))}
        </Stack>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<TouchAppRoundedIcon />}
            onClick={() => navigate("/map")}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: "#7CFF72",
              color: "#0a0f0a",
              textTransform: "none",
              "&:hover": { bgcolor: "#9dff92" },
            }}
          >
            지도로 돌아가기
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default MapGuide;
