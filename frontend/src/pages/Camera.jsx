import { useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Chip,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import { getUser } from "../services/auth";
import { apiFetchMultipart } from "../services/api";

const TYPE_LABELS = {
  CAN: "캔",
  GENERAL: "일반(일쓰)",
  PET: "플라스틱(페트)",
  HAZARD: "위험물",
};

const Camera = () => {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [override, setOverride] = useState(null);

  const oauthId = getUser()?.oauthId;

  const onFileChosen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOverride(null);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const analyze = async () => {
    if (!oauthId) {
      alert("로그인이 필요합니다.");
      navigate("/");
      return;
    }
    if (!file) {
      alert("사진을 선택하거나 촬영해 주세요.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("oauthId", oauthId);
      if (override) {
        fd.append("userSelectedType", override);
      }
      const data = await apiFetchMultipart("/ai/analyze", fd);
      setResult(data);
    } catch (e) {
      alert(e.message || "분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const finalType = override || result?.finalType || result?.predictedType;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        minHeight: "100dvh",
        bgcolor: "#fff",
        color: "#111",
        py: { xs: 2, sm: 3.5 },
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowX: "hidden",
      }}
    >
      <Container maxWidth={false} sx={{ display: "flex", justifyContent: "center", px: { xs: 1.25, sm: 2 } }}>
        <Stack
          spacing={{ xs: 2.1, sm: 3 }}
          alignItems="stretch"
          textAlign="center"
          sx={{ width: "min(100%, 520px)", mx: "auto" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.03em" }}>
            쓰레기 촬영 · 분류
          </Typography>
          <Typography sx={{ color: "#555", lineHeight: 1.55, px: { xs: 0.4, sm: 1 }, fontSize: { xs: "0.86rem", sm: "1rem" } }}>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              모바일은 촬영, PC는 파일 선택 후 분석하세요.
            </Box>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              모바일은 카메라, PC는 파일 선택. AI로 분석하고, 아래에서 직접 고를 수도 있습니다.
            </Box>
          </Typography>
          <Typography sx={{ color: "#111", fontWeight: 700, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
            안내: 사진을 올리고 분석하면 아래에 분리배출 안내가 바로 표시됩니다.
          </Typography>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={onFileChosen}
          />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChosen} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%", justifyContent: "center", alignItems: "stretch" }}>
            <Button
              variant="contained"
              startIcon={<PhotoCameraRoundedIcon />}
              onClick={() => cameraInputRef.current?.click()}
              sx={{ bgcolor: "#111", color: "#fff", fontWeight: 700, py: 1.2, width: { xs: "100%", sm: "calc(50% - 6px)" } }}
            >
              카메라 / 촬영
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImageRoundedIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ color: "#111", borderColor: "#111", fontWeight: 700, width: { xs: "100%", sm: "calc(50% - 6px)" } }}
            >
              파일에서 선택
            </Button>
          </Stack>

          {preview && (
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                alignSelf: "stretch",
                borderRadius: 2,
                border: "1px solid #ddd",
                bgcolor: "#fafafa",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                minHeight: { xs: 200, sm: 220 },
                maxHeight: { xs: "42vh", sm: "40vh" },
                p: { xs: 1, sm: 1.25 },
              }}
            >
              <Box
                component="img"
                src={preview}
                alt="선택한 폐기물 미리보기"
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: { xs: "calc(42vh - 24px)", sm: "calc(40vh - 32px)" },
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "center center",
                  margin: "0 auto",
                }}
              />
            </Paper>
          )}

          <Button
            disabled={loading || !file}
            variant="contained"
            onClick={analyze}
            sx={{ bgcolor: "#111", color: "#fff", fontWeight: 700, minWidth: 220 }}
          >
            {loading ? "분석 중…" : "분석"}
          </Button>

          {result && (
            <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px solid #ddd", width: "100%", textAlign: "left" }}>
              <Typography sx={{ color: "#111", fontWeight: 800, mb: 1, textAlign: "center" }}>
                AI 예측: {TYPE_LABELS[result.predictedType] ?? result.predictedType}
              </Typography>
              {result.rawSnippet && (
                <Typography variant="body2" sx={{ color: "#444", whiteSpace: "pre-wrap" }}>
                  {result.rawSnippet}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 1, textAlign: "center" }}>
                오늘 남은 분석: {result.remainingToday ?? "-"}회
              </Typography>
            </Paper>
          )}

          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 800, mb: 1.5, color: "#222", textAlign: "center" }}>
              직접 선택 (부가 확인)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center" useFlexGap>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  onClick={() => setOverride(key)}
                  sx={{
                    borderColor: override === key ? "#111" : "#aaa",
                    color: override === key ? "#fff" : "#111",
                    bgcolor: override === key ? "#111" : "#fff",
                    fontWeight: 700,
                    "&:hover": { bgcolor: override === key ? "#000" : "#f5f5f5" },
                  }}
                  variant={override === key ? "filled" : "outlined"}
                />
              ))}
            </Stack>
            <Typography variant="caption" sx={{ color: "#666", mt: 1.5, display: "block", textAlign: "center" }}>
              자동 분류가 애매하면 직접 타입을 선택해 주세요.
            </Typography>
          </Box>

          {finalType && (
            <Typography sx={{ textAlign: "center", color: "#111", fontWeight: 700, pt: 1 }}>
              최종 분류: {TYPE_LABELS[finalType] ?? finalType}
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Camera;
