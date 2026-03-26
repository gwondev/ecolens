import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Camera = () => {
  const navigate = useNavigate();

  const handleMockResult = () => {
    // 실제 구현 전 임시: 캔으로 인식되었다고 가정하고 지도 화면으로 복귀
    navigate("/map");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#030403", color: "#fff", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Camera</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
            추후 Gemini API 연동 예정입니다. 현재는 테스트용 모의 인식 버튼으로 흐름을 검증합니다.
          </Typography>
          <Button variant="contained" sx={{ bgcolor: "#7CFF72", color: "#000" }} onClick={handleMockResult}>
            인식 완료(임시)
          </Button>
          <Button variant="outlined" sx={{ color: "#7CFF72", borderColor: "rgba(124,255,114,0.35)" }} onClick={() => navigate("/map")}>
            지도로 돌아가기
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default Camera;
