import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { motion } from "framer-motion";
import { apiFetch } from "../services/api";

const headCell = {
  color: "#0f172a",
  fontWeight: 800,
  borderColor: "#e2e8f0",
  bgcolor: "#f8fafc",
};

const bodyCell = {
  color: "#334155",
  borderColor: "#f1f5f9",
};

const Manage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    users: [],
    recognitionEvents: [],
  });

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/admin/overview");
      setOverview({
        users: data?.users || [],
        recognitionEvents: data?.recognitionEvents || [],
      });
    } catch (e) {
      setError(e.message || "관리 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const recentRecognition = useMemo(
    () =>
      [...overview.recognitionEvents]
        .sort((a, b) => b.id - a.id)
        .slice(0, 10),
    [overview.recognitionEvents]
  );

  const sectorSummary = useMemo(() => {
    const summary = new Map();
    overview.recognitionEvents.forEach((event) => {
      const key = event.sector || "광주광역시(근사)";
      summary.set(key, (summary.get(key) || 0) + 1);
    });
    return Array.from(summary.entries())
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
  }, [overview.recognitionEvents]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{ minHeight: "100dvh", bgcolor: "#f8fafc", py: { xs: 2, sm: 3 } }}
    >
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.25rem", sm: "1.8rem" }, fontWeight: 900, color: "#0f172a" }}>
              MANAGE
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.9rem" }}>
              회원정보와 인식발생장소를 한 화면에서 확인합니다.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />}
              variant="outlined"
              onClick={() => navigate("/map")}
              sx={{ color: "#0f172a", borderColor: "#cbd5e1", textTransform: "none", fontWeight: 700 }}
            >
              MAP
            </Button>
            <Button
              onClick={loadOverview}
              sx={{ bgcolor: "#0f172a", color: "#fff", textTransform: "none", fontWeight: 800 }}
            >
              새로고침
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1.2} sx={{ mb: 2 }}>
          {loading && <Alert severity="info">로딩 중...</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>
            회원관리 ({overview.users.length}명)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>ID</TableCell>
                <TableCell sx={headCell}>닉네임</TableCell>
                <TableCell sx={headCell}>ROLE</TableCell>
                <TableCell sx={headCell}>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell sx={bodyCell}>{u.id}</TableCell>
                  <TableCell sx={bodyCell}>{u.nickname || "-"}</TableCell>
                  <TableCell sx={bodyCell}>{u.role || "-"}</TableCell>
                  <TableCell sx={bodyCell}>{u.status || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>
            인식발생장소 (최근 10건)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>기록ID</TableCell>
                <TableCell sx={headCell}>인식결과</TableCell>
                <TableCell sx={headCell}>LAT</TableCell>
                <TableCell sx={headCell}>LON</TableCell>
                <TableCell sx={headCell}>섹터</TableCell>
                <TableCell sx={headCell}>시간</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRecognition.map((e) => (
                <TableRow key={e.id}>
                  <TableCell sx={bodyCell}>{e.id}</TableCell>
                  <TableCell sx={bodyCell}>{e.finalType || e.predictedType || "-"}</TableCell>
                  <TableCell sx={bodyCell}>{e.latitude ?? "-"}</TableCell>
                  <TableCell sx={bodyCell}>{e.longitude ?? "-"}</TableCell>
                  <TableCell sx={bodyCell}>{e.sector || "광주광역시(근사)"}</TableCell>
                  <TableCell sx={bodyCell}>{e.createdAt || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>
            인식발생장소 섹터별 집계
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>섹터</TableCell>
                <TableCell sx={headCell}>인식 발생 횟수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sectorSummary.map((row) => (
                <TableRow key={row.sector}>
                  <TableCell sx={bodyCell}>{row.sector}</TableCell>
                  <TableCell sx={bodyCell}>{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </Box>
  );
};

export default Manage;
