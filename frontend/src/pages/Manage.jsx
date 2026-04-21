import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { motion } from "framer-motion";
import { apiFetch } from "../services/api";

const headCell = { color: "#0f172a", fontWeight: 800, borderColor: "#e2e8f0", bgcolor: "#f8fafc" };
const bodyCell = { color: "#334155", borderColor: "#f1f5f9" };

const defaultMachine = {
  serialNumber: "",
  organization: "GWANGJU_CITY",
  lat: "35.1469",
  lon: "126.9228",
  type: "CAN",
  status: "READY",
};

const Manage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({ users: [], modules: [], recognitionEvents: [] });

  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState(defaultMachine);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/admin/overview");
      setOverview({
        users: data?.users || [],
        modules: data?.modules || [],
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

  const openMachineDialog = (machine = null) => {
    if (!machine) {
      setEditingMachine(null);
      setMachineForm(defaultMachine);
    } else {
      setEditingMachine(machine);
      setMachineForm({
        serialNumber: machine.serialNumber || "",
        organization: machine.organization || "GWANGJU_CITY",
        lat: String(machine.lat ?? ""),
        lon: String(machine.lon ?? ""),
        type: (machine.type || "CAN").toUpperCase(),
        status: (machine.status || "READY").toUpperCase(),
      });
    }
    setMachineDialogOpen(true);
  };

  const saveMachine = async () => {
    try {
      setSaving(true);
      const payload = {
        serialNumber: machineForm.serialNumber.trim(),
        organization: machineForm.organization.trim(),
        lat: Number(machineForm.lat),
        lon: Number(machineForm.lon),
        type: machineForm.type.toUpperCase(),
        status: machineForm.status.toUpperCase(),
      };
      if (editingMachine) {
        await apiFetch(`/modules/${editingMachine.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/modules", { method: "POST", body: JSON.stringify(payload) });
      }
      setMachineDialogOpen(false);
      setEditingMachine(null);
      await loadOverview();
    } catch (e) {
      setError(e.message || "자판기 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const deleteMachine = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await apiFetch(`/modules/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadOverview();
    } catch (e) {
      setError(e.message || "자판기 삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const recentRecognition = useMemo(
    () => [...overview.recognitionEvents].sort((a, b) => b.id - a.id).slice(0, 10),
    [overview.recognitionEvents]
  );

  const sectorSummary = useMemo(() => {
    const map = new Map();
    overview.recognitionEvents.forEach((event) => {
      const key = event.sector || "광주광역시(근사)";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [overview.recognitionEvents]);

  return (
    <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ minHeight: "100dvh", bgcolor: "#f8fafc", py: 2 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.25rem", sm: "1.8rem" }, fontWeight: 900, color: "#0f172a" }}>MANAGE</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.9rem" }}>회원관리, 자판기 관리, 인식발생장소를 확인합니다.</Typography>
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
            <Button onClick={loadOverview} sx={{ bgcolor: "#0f172a", color: "#fff", textTransform: "none", fontWeight: 800 }}>
              새로고침
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1.2} sx={{ mb: 2 }}>
          {loading && <Alert severity="info">로딩 중...</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>회원관리 ({overview.users.length}명)</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={headCell}>ID</TableCell><TableCell sx={headCell}>닉네임</TableCell><TableCell sx={headCell}>ROLE</TableCell><TableCell sx={headCell}>상태</TableCell></TableRow></TableHead>
            <TableBody>
              {overview.users.map((u) => (
                <TableRow key={u.id}><TableCell sx={bodyCell}>{u.id}</TableCell><TableCell sx={bodyCell}>{u.nickname || "-"}</TableCell><TableCell sx={bodyCell}>{u.role || "-"}</TableCell><TableCell sx={bodyCell}>{u.status || "-"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
            <Typography sx={{ color: "#0f172a", fontWeight: 800 }}>자판기 관리 ({overview.modules.length}개)</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => openMachineDialog(null)} sx={{ color: "#fff", bgcolor: "#0f172a", fontWeight: 800 }}>자판기 추가</Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>ID</TableCell>
                <TableCell sx={headCell}>이름</TableCell>
                <TableCell sx={headCell}>종류</TableCell>
                <TableCell sx={headCell}>LAT</TableCell>
                <TableCell sx={headCell}>LON</TableCell>
                <TableCell sx={headCell}>수정/삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.modules.map((m) => (
                <TableRow key={m.id}>
                  <TableCell sx={bodyCell}>{m.id}</TableCell>
                  <TableCell sx={bodyCell}>{m.serialNumber}</TableCell>
                  <TableCell sx={bodyCell}>{m.type}</TableCell>
                  <TableCell sx={bodyCell}>{m.lat}</TableCell>
                  <TableCell sx={bodyCell}>{m.lon}</TableCell>
                  <TableCell sx={bodyCell}>
                    <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openMachineDialog(m)} sx={{ mr: 1, textTransform: "none" }}>수정</Button>
                    <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteTarget(m)} sx={{ textTransform: "none" }}>삭제</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>인식발생장소 (최근 10건)</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={headCell}>기록ID</TableCell><TableCell sx={headCell}>인식결과</TableCell><TableCell sx={headCell}>LAT</TableCell><TableCell sx={headCell}>LON</TableCell><TableCell sx={headCell}>섹터</TableCell></TableRow></TableHead>
            <TableBody>
              {recentRecognition.map((e) => (
                <TableRow key={e.id}><TableCell sx={bodyCell}>{e.id}</TableCell><TableCell sx={bodyCell}>{e.finalType || e.predictedType || "-"}</TableCell><TableCell sx={bodyCell}>{e.latitude ?? "-"}</TableCell><TableCell sx={bodyCell}>{e.longitude ?? "-"}</TableCell><TableCell sx={bodyCell}>{e.sector || "광주광역시(근사)"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 800, mb: 1.2 }}>인식발생장소 섹터별 집계</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={headCell}>섹터</TableCell><TableCell sx={headCell}>인식 발생 횟수</TableCell></TableRow></TableHead>
            <TableBody>
              {sectorSummary.map((row) => (
                <TableRow key={row.sector}><TableCell sx={bodyCell}>{row.sector}</TableCell><TableCell sx={bodyCell}>{row.count}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>

      <Dialog open={machineDialogOpen} onClose={() => !saving && setMachineDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingMachine ? "자판기 수정" : "자판기 추가"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          <TextField label="자판기 이름*" value={machineForm.serialNumber} onChange={(e) => setMachineForm((f) => ({ ...f, serialNumber: e.target.value }))} fullWidth />
          <TextField label="기관" value={machineForm.organization} onChange={(e) => setMachineForm((f) => ({ ...f, organization: e.target.value }))} fullWidth />
          <Stack direction="row" spacing={1.5}>
            <TextField label="위도(lat)" value={machineForm.lat} onChange={(e) => setMachineForm((f) => ({ ...f, lat: e.target.value }))} fullWidth />
            <TextField label="경도(lon)" value={machineForm.lon} onChange={(e) => setMachineForm((f) => ({ ...f, lon: e.target.value }))} fullWidth />
          </Stack>
          <TextField select label="종류" value={machineForm.type} onChange={(e) => setMachineForm((f) => ({ ...f, type: e.target.value }))} fullWidth>
            <MenuItem value="CAN">CAN</MenuItem>
            <MenuItem value="PET">PET</MenuItem>
          </TextField>
          <TextField select label="상태" value={machineForm.status} onChange={(e) => setMachineForm((f) => ({ ...f, status: e.target.value }))} fullWidth>
            <MenuItem value="READY">READY</MenuItem>
            <MenuItem value="DEFAULT">DEFAULT</MenuItem>
            <MenuItem value="CHECK">CHECK</MenuItem>
            <MenuItem value="FULL">FULL</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMachineDialogOpen(false)} disabled={saving}>취소</Button>
          <Button onClick={saveMachine} disabled={saving || !machineForm.serialNumber.trim()} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)}>
        <DialogTitle>자판기 삭제</DialogTitle>
        <DialogContent>
          <Typography>{deleteTarget?.serialNumber} 자판기를 삭제할까요?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>취소</Button>
          <Button onClick={deleteMachine} color="error" variant="contained" disabled={saving}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Manage;
