import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import RoomRoundedIcon from "@mui/icons-material/RoomRounded";
import CameraswitchRoundedIcon from "@mui/icons-material/CameraswitchRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getUser } from "../services/auth";
import { apiFetch, apiFetchMultipart } from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TYPE_LABELS = {
  CAN: "캔",
  GENERAL: "일반",
  PET: "플라스틱/PET",
  HAZARD: "위험물",
};

const FALLBACK_CENTER = [35.1469, 126.9228];
const GWANGJU_REVERSE_VENDING = [
  {
    id: "gwangju-rvm-1",
    serialNumber: "GJ-RVM-CAN-01",
    organization: "GWANGJU_CITY",
    lat: 35.15987,
    lon: 126.8526,
    type: "CAN",
    status: "READY",
    totalDisposalCount: 0,
  },
  {
    id: "gwangju-rvm-2",
    serialNumber: "GJ-RVM-PET-01",
    organization: "GWANGJU_CITY",
    lat: 35.14669,
    lon: 126.92227,
    type: "PET",
    status: "READY",
    totalDisposalCount: 0,
  },
  {
    id: "gwangju-rvm-3",
    serialNumber: "GJ-RVM-CAN-02",
    organization: "GWANGJU_CITY",
    lat: 35.15412,
    lon: 126.91374,
    type: "CAN",
    status: "READY",
    totalDisposalCount: 0,
  },
  {
    id: "gwangju-rvm-4",
    serialNumber: "GJ-RVM-PET-02",
    organization: "GWANGJU_CITY",
    lat: 35.13248,
    lon: 126.90216,
    type: "PET",
    status: "READY",
    totalDisposalCount: 0,
  },
  {
    id: "gwangju-rvm-5",
    serialNumber: "GJ-RVM-CAN-03",
    organization: "GWANGJU_CITY",
    lat: 35.1786,
    lon: 126.9114,
    type: "CAN",
    status: "READY",
    totalDisposalCount: 0,
  },
  {
    id: "gwangju-rvm-6",
    serialNumber: "GJ-RVM-PET-03",
    organization: "GWANGJU_CITY",
    lat: 35.16602,
    lon: 126.87995,
    type: "PET",
    status: "READY",
    totalDisposalCount: 0,
  },
];

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const inferGwangjuArea = (lat, lon) => {
  if (lat == null || lon == null) return "광주광역시(근사)";
  if (lat >= 35.16) return "광주광역시 북구(근사)";
  if (lon <= 126.88) return "광주광역시 광산구(근사)";
  if (lat <= 35.14 && lon <= 126.91) return "광주광역시 서구(근사)";
  if (lat <= 35.14 && lon > 126.91) return "광주광역시 남구(근사)";
  return "광주광역시 동구(근사)";
};

const createModuleIcon = (type, highlighted = false) =>
  L.divIcon({
    html:
      type === "CAN"
        ? `<div style="width:${highlighted ? 38 : 30}px;height:${highlighted ? 38 : 30}px;border-radius:50%;background:${highlighted ? "#f59e0b" : "#111"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${highlighted ? 20 : 16}px;box-shadow:${highlighted ? "0 0 0 8px rgba(245,158,11,0.35), 0 6px 18px rgba(245,158,11,0.5)" : "0 3px 10px rgba(0,0,0,0.25)"};">🥫</div>`
        : `<div style="width:${highlighted ? 38 : 30}px;height:${highlighted ? 38 : 30}px;border-radius:50%;background:${highlighted ? "#22c55e" : "#0ea5e9"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${highlighted ? 20 : 16}px;box-shadow:${highlighted ? "0 0 0 8px rgba(34,197,94,0.35), 0 6px 18px rgba(34,197,94,0.5)" : "0 3px 10px rgba(0,0,0,0.25)"};">♻️</div>`,
    className: "",
    iconSize: [highlighted ? 38 : 30, highlighted ? 38 : 30],
    iconAnchor: [highlighted ? 19 : 15, highlighted ? 38 : 30],
    popupAnchor: [0, highlighted ? -34 : -26],
  });

const MapPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const oauthId = user?.oauthId;

  const [myPos, setMyPos] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modules, setModules] = useState([]);

  const cameraInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [guide, setGuide] = useState("");
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    if (!oauthId) {
      navigate("/");
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setMyPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        if (cancelled) return;
        setGeoError("현재 위치를 가져오지 못해 기본 지도로 표시합니다.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => {
      cancelled = true;
    };
  }, [oauthId, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const moduleList = await apiFetch("/modules");
      setModules(Array.isArray(moduleList) ? moduleList : []);
    } catch (e) {
      setError(e.message || "지도 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const mapModules = useMemo(() => {
    const serialSet = new Set(modules.map((m) => m.serialNumber));
    const virtual = GWANGJU_REVERSE_VENDING.filter((m) => !serialSet.has(m.serialNumber));
    return [...modules, ...virtual];
  }, [modules]);

  const center = myPos || FALLBACK_CENTER;
  const approxArea = inferGwangjuArea(myPos?.[0], myPos?.[1]);
  const loadGuideForType = async (wasteType) => {
    try {
      setGuideLoading(true);
      const payload = {
        wasteType,
        latitude: myPos?.[0] ?? "",
        longitude: myPos?.[1] ?? "",
      };
      const res = await apiFetch("/ai/disposal-guide", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const cleanGuide = (res?.guide || "안내를 불러오지 못했습니다.").replace(/\*\*/g, "");
      setGuide(cleanGuide);
    } catch (e) {
      setError(e.message || "분리수거 안내를 가져오지 못했습니다.");
    } finally {
      setGuideLoading(false);
    }
  };

  const onFileChosen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    setGuide("");
    setPreview(URL.createObjectURL(f));
  };

  const analyzeImage = async () => {
    if (!oauthId || !file) return;
    try {
      setAnalyzing(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("oauthId", oauthId);
      if (myPos?.[0] != null && myPos?.[1] != null) {
        fd.append("latitude", String(myPos[0]));
        fd.append("longitude", String(myPos[1]));
      }
      const res = await apiFetchMultipart("/ai/analyze", fd);
      setAnalysis(res);
      const nextWasteType = res?.finalType || res?.predictedType || "GENERAL";
      await loadGuideForType(nextWasteType);
    } catch (e) {
      setError(e.message || "이미지 분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#f8fafc", py: 2 }}>
      <Container maxWidth="xl">
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: { xs: 2, md: 2.5 } }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              gap={2}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.3rem", md: "1.6rem" } }}>
                  반가워요, {user?.nickname || "green-user"}님
                </Typography>
                <Typography sx={{ color: "#64748b", mt: 0.5 }}>
                  지도에서 수거 포인트를 확인하고, 사진 촬영 후 바로 분리배출 안내를 받아보세요.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<AdminPanelSettingsRoundedIcon />}
                  onClick={() => navigate("/manage")}
                  sx={{ borderColor: "#cbd5e1", color: "#0f172a", textTransform: "none", fontWeight: 700 }}
                >
                  MANAGE
                </Button>
              </Stack>
            </Stack>
            {geoError && <Alert severity="info" sx={{ mt: 1.5 }}>{geoError}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          </Paper>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <Paper
              elevation={0}
              sx={{
                flex: { xs: 1, lg: 1.35 },
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                overflow: "hidden",
                minHeight: 620,
              }}
            >
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 620 }}>
                  <CircularProgress />
                </Stack>
              ) : (
                <MapContainer center={center} zoom={16} style={{ height: 620, width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {myPos && (
                    <Marker position={myPos}>
                      <Popup>
                        <strong>내 현재 위치</strong>
                      </Popup>
                    </Marker>
                  )}

                  {mapModules.map((m) => {
                    const lat = toNumber(m.lat);
                    const lon = toNumber(m.lon);
                    if (lat == null || lon == null) return null;
                    return (
                      <Marker
                        key={m.id}
                        position={[lat, lon]}
                        icon={createModuleIcon(
                          m.type,
                          (analysis?.finalType || analysis?.predictedType) === m.type
                        )}
                      >
                        <Popup>
                          <strong>{m.serialNumber}</strong>
                          <br />
                          {m.type === "CAN" ? "캔 순환자원 무인회수기" : "플라스틱 순환자원 무인회수기"}
                          <br />
                          지자체 설치 위치 안내
                        </Popup>
                      </Marker>
                    );
                  })}

                </MapContainer>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                p: 2,
                minHeight: 520,
              }}
            >
              <Stack spacing={1.4}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.08rem" }}>
                  AI 분리수거 도우미
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.9rem" }}>
                  사진 업로드 후 Gemini API로 폐기물 분류를 진행하고, 결과와 함께 분리배출 방법을 바로 보여줍니다.
                </Typography>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={onFileChosen}
                />
                <Button
                  variant="outlined"
                  startIcon={<CameraswitchRoundedIcon />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{ textTransform: "none", borderColor: "#cbd5e1", color: "#0f172a", fontWeight: 700 }}
                >
                  카메라/파일로 사진 선택
                </Button>

                {preview && (
                  <Box
                    component="img"
                    src={preview}
                    alt="waste preview"
                    sx={{
                      width: "100%",
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                      maxHeight: 240,
                      minHeight: 170,
                      objectFit: "contain",
                      bgcolor: "#f8fafc",
                    }}
                  />
                )}

                <Button
                  variant="contained"
                  disabled={!file || analyzing}
                  onClick={analyzeImage}
                  sx={{ bgcolor: "#0f172a", textTransform: "none", fontWeight: 800 }}
                >
                  {analyzing ? "Gemini 분석 중..." : "사진 분석"}
                </Button>

                {analysis && (
                  <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      분석 결과: {TYPE_LABELS[analysis.finalType || analysis.predictedType] || analysis.finalType || analysis.predictedType}
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "#475569", fontSize: "0.86rem", whiteSpace: "pre-wrap" }}>
                      {analysis.rawSnippet || "AI 응답 텍스트가 없습니다."}
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "#64748b", fontSize: "0.8rem" }}>
                      오늘 남은 분석: {analysis.remainingToday ?? "-"}회
                    </Typography>
                  </Paper>
                )}

                {guide && (
                  <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5, bgcolor: "#f8fafc" }}>
                    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>
                      <RoomRoundedIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "text-top" }} />
                      지금 지역에 기반한 분리수거 배출방법 - {approxArea}
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: "0.88rem", lineHeight: 1.55 }}>
                      {guide}
                    </Typography>
                  </Paper>
                )}

                <Divider />

                <Typography sx={{ fontWeight: 700 }}>
                  근처 수거 포인트: {mapModules.length}개
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                  지도 마커에서 광주광역시 지자체 설치 회수 포인트 위치를 확인할 수 있습니다.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default MapPage;
