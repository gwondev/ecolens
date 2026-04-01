import { useEffect, useMemo, useRef, useState } from "react";
import { Typography, Box, Paper, Stack, Button, Alert, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getUser } from "../services/auth";
import { apiFetch, apiFetchMultipart } from "../services/api";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

const TYPE_LABELS = {
  CAN: "캔",
  GENERAL: "일반쓰레기",
  PET: "페트/플라스틱 병",
  HAZARD: "유해폐기물",
};

const Map = () => {
  const navigate = useNavigate();
  const user = getUser();
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userPos, setUserPos] = useState(null);
  const [geoMessage, setGeoMessage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzedType, setAnalyzedType] = useState("");
  const [manualType, setManualType] = useState("");
  const [guide, setGuide] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.oauthId) {
      navigate("/");
      return;
    }

    if (!navigator.geolocation) {
      setGeoMessage("이 브라우저는 위치 정보를 지원하지 않습니다. 지도는 데모 좌표 기준으로 표시됩니다.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoMessage("");
      },
      () => {
        setGeoMessage("위치 권한이 필요합니다. 브라우저 설정에서 위치를 허용한 뒤 새로고침 해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [navigate, user?.oauthId]);

  const requestGeoAgain = () => {
    setGeoMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoMessage("");
      },
      () => setGeoMessage("위치를 가져오지 못했습니다. 권한을 허용했는지 확인해 주세요."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const onFileChosen = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAnalyzedType("");
    setManualType("");
    setGuide("");
    setError("");
  };

  const finalType = useMemo(() => manualType || analyzedType, [manualType, analyzedType]);
  const locationText = useMemo(() => {
    if (!userPos) return "위치를 아직 가져오지 못했습니다.";
    return `위도 ${userPos[0].toFixed(5)}, 경도 ${userPos[1].toFixed(5)}`;
  }, [userPos]);

  const analyzeAndGuide = async () => {
    if (!user?.oauthId) return;
    if (!file) {
      setError("사진을 촬영하거나 선택해 주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setGuide("");

      const fd = new FormData();
      fd.append("image", file);
      fd.append("oauthId", user.oauthId);
      if (manualType) fd.append("userSelectedType", manualType);
      const analyzed = await apiFetchMultipart("/ai/analyze", fd);
      const nextType = manualType || analyzed?.finalType || analyzed?.predictedType || "GENERAL";
      setAnalyzedType(nextType);

      const guideResponse = await apiFetch("/ai/disposal-guide", {
        method: "POST",
        body: JSON.stringify({
          wasteType: nextType,
          latitude: userPos?.[0] ?? null,
          longitude: userPos?.[1] ?? null,
        }),
      });
      setGuide(guideResponse?.guide || "지역별 배출 안내를 생성하지 못했습니다.");
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.oauthId) return null;
  const displayName = user?.nickname || "사용자";
  return (
    <Box
      sx={{
        position: "relative",
        height: "100dvh",
        minHeight: "100vh",
        color: "#fff",
        bgcolor: "#030403",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        p: { xs: 1.25, sm: 2, md: 2.5 },
        boxSizing: "border-box",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ flexShrink: 0, mb: 1.1, pr: { xs: 0, sm: 0 }, pt: { xs: 0.75, sm: 0.55 } }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flexWrap: "wrap", pr: { xs: 18, sm: 30 } }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1rem", sm: "1.35rem" },
              lineHeight: 1.25,
              wordBreak: "keep-all",
            }}
          >
            안녕하세요, <Box component="span" sx={{ color: "#7CFF72" }}>{displayName}</Box>님
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: { xs: "0.74rem", sm: "0.86rem" } }}>
            AI 기반 지역별 분리배출 안내 플랫폼
          </Typography>
        </Stack>
      </Stack>

      {geoMessage && (
        <Alert
          severity="warning"
          sx={{
            mb: 1.5,
            flexShrink: 0,
            bgcolor: "rgba(255,193,7,0.12)",
            color: "#fff",
            border: "1px solid rgba(255,193,7,0.35)",
          }}
          action={
            <Button color="inherit" size="small" onClick={requestGeoAgain}>
              다시 요청
            </Button>
          }
        >
          {geoMessage}
        </Alert>
      )}

      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          mt: { xs: 2, sm: 1.35 },
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(124,255,114,0.25)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          bgcolor: "#0a0f0a",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(124,255,114,0.08), transparent 40%), radial-gradient(circle at 85% 75%, rgba(124,255,114,0.07), transparent 44%), linear-gradient(180deg, #071007 0%, #050905 100%)",
          }}
        />
        <Stack
          spacing={1.3}
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 760,
            mx: "auto",
            p: { xs: 1.2, sm: 1.8 },
            bgcolor: "rgba(0,0,0,0.58)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOnRoundedIcon sx={{ color: "#7CFF72" }} />
            <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
              현재 위치 기준: {locationText}
            </Typography>
          </Stack>
          <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: { xs: "0.78rem", sm: "0.9rem" } }}>
            지도 위 카메라 패널에서 촬영하면 지역별 분리배출 방침에 맞는 안내를 제공합니다.
          </Typography>
        </Stack>

        <Paper
          sx={{
            position: "absolute",
            left: "50%",
            bottom: { xs: 10, sm: 16 },
            transform: "translateX(-50%)",
            width: { xs: "95%", sm: "min(920px, 95%)" },
            zIndex: 3,
            borderRadius: 3,
            border: "1px solid rgba(124,255,114,0.25)",
            bgcolor: "rgba(0,0,0,0.82)",
            p: { xs: 1.25, sm: 1.8 },
          }}
        >
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onFileChosen} />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChosen} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1}>
            <Button startIcon={<PhotoCameraRoundedIcon />} variant="contained" onClick={() => cameraInputRef.current?.click()} sx={{ bgcolor: "#7CFF72", color: "#081108", fontWeight: 800 }}>
              촬영
            </Button>
            <Button startIcon={<ImageRoundedIcon />} variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ color: "#7CFF72", borderColor: "rgba(124,255,114,0.4)" }}>
              파일 선택
            </Button>
            <Button variant="contained" disabled={!file || loading} onClick={analyzeAndGuide} sx={{ bgcolor: "#1a2e1a", color: "#7CFF72", border: "1px solid rgba(124,255,114,0.4)", fontWeight: 800 }}>
              {loading ? "분석 중..." : "AI 안내 받기"}
            </Button>
          </Stack>

          {preview && (
            <Box sx={{ mt: 1.3, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", height: { xs: 140, sm: 180 }, display: "flex", justifyContent: "center", bgcolor: "#050805" }}>
              <Box component="img" src={preview} alt="waste preview" sx={{ maxWidth: "100%", objectFit: "contain" }} />
            </Box>
          )}
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.1 }}>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                label={label}
                onClick={() => setManualType(key)}
                variant={manualType === key ? "filled" : "outlined"}
                sx={{
                  color: manualType === key ? "#0b150b" : "#d9ffd0",
                  bgcolor: manualType === key ? "#7CFF72" : "transparent",
                  borderColor: "rgba(124,255,114,0.45)",
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
          {finalType && (
            <Typography sx={{ mt: 1, color: "#b8ff9e", fontWeight: 800 }}>
              분류: {TYPE_LABELS[finalType] || finalType}
            </Typography>
          )}
          {guide && (
            <Paper sx={{ mt: 1.2, p: 1.2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,255,114,0.2)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.92)", whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: { xs: "0.84rem", sm: "0.92rem" } }}>
                {guide}
              </Typography>
            </Paper>
          )}
          {error && (
            <Typography sx={{ mt: 1, color: "#ff9b9b", fontSize: "0.86rem" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default Map;
