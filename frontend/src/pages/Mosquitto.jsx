import { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

export default function Mosquitto() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/mosquitto/logs?limit=20");
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "로그를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#030403", color: "#fff", py: { xs: 1.5, sm: 2.5 } }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: "1rem", sm: "1.5rem" } }}>/mosquitto</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={load} sx={{ color: "#000", bgcolor: "#7CFF72", fontWeight: 800 }}>
              새로고침
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate("/manage")} sx={{ color: "#7CFF72", borderColor: "rgba(124,255,114,0.35)" }}>
              Manage
            </Button>
          </Stack>
        </Stack>
        {error && (
          <Paper sx={{ p: 1, mb: 1, bgcolor: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.35)" }}>
            <Typography sx={{ color: "#ffb0b0", fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>{error}</Typography>
          </Paper>
        )}
        <Paper sx={{ p: 1.25, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,255,114,0.2)", maxHeight: "78dvh", overflow: "auto" }}>
          {loading && logs.length === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.78rem", sm: "0.9rem" } }}>불러오는 중...</Typography>
          ) : logs.length === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.78rem", sm: "0.9rem" } }}>최근 MQTT 로그가 없습니다.</Typography>
          ) : (
            <Stack spacing={1}>
              {logs.map((row, idx) => (
                <Paper key={`${row.time}-${idx}`} sx={{ p: 1, bgcolor: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography sx={{ color: "#7CFF72", fontSize: { xs: "0.65rem", sm: "0.72rem" }, mb: 0.3 }}>
                    [{row.direction}] {row.time}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.92)", fontSize: { xs: "0.72rem", sm: "0.82rem" }, wordBreak: "break-all" }}>
                    {row.topic}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: { xs: "0.68rem", sm: "0.78rem" }, wordBreak: "break-all" }}>
                    {row.payload}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
