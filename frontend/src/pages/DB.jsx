import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { getEffectiveUser, isDevBypass } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const cellHead = {
  color: "#7CFF72",
  fontWeight: 800,
  borderColor: "rgba(124,255,114,0.2)",
  bgcolor: "rgba(124,255,114,0.08)",
};

const cellBody = {
  color: "rgba(255,255,255,0.92)",
  borderColor: "rgba(255,255,255,0.08)",
};

const DB = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const currentUser = getEffectiveUser();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nickname: "",
    role: "USER",
    status: "ACTIVE",
    totalRewards: 0,
    nowRewards: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setErr("");
      const data = await apiFetch("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setErr("유저 목록을 불러오지 못했습니다. 백엔드·프록시를 확인하세요.");
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role !== "ADMIN" && !isDevBypass()) {
      alert("관리자 전용 페이지입니다.");
      navigate("/map");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadUsers();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, navigate, loadUsers]);

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      nickname: u.nickname ?? "",
      role: u.role === "ADMIN" ? "ADMIN" : "USER",
      status: u.status ?? "ACTIVE",
      totalRewards: u.totalRewards ?? 0,
      nowRewards: u.nowRewards ?? 0,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      await apiFetch(`/users/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nickname: form.nickname.trim() || null,
          role: form.role,
          status: form.status.trim() || "ACTIVE",
          totalRewards: Number(form.totalRewards) || 0,
          nowRewards: Number(form.nowRewards) || 0,
        }),
      });
      setEditOpen(false);
      setEditing(null);
      await loadUsers();
    } catch (e) {
      alert(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await apiFetch(`/users/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadUsers();
    } catch (e) {
      alert(e.message || "삭제 실패 (연관 기록이 있으면 DB 제약일 수 있음)");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== "ADMIN" && !isDevBypass()) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#030403", color: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
              유저 DB
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
              조회 · 수정 · 삭제 (역할 USER/ADMIN)
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate("/map")}
              sx={{ color: "#7CFF72", borderColor: "rgba(124,255,114,0.4)" }}
              variant="outlined"
            >
              Map
            </Button>
            <Button onClick={() => navigate("/manage")} sx={{ color: "#000", bgcolor: "#7CFF72", fontWeight: 800 }}>
              Manage
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress sx={{ color: "#7CFF72" }} />
          </Stack>
        )}
        {err && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(211,47,47,0.15)", color: "#ffc9c9" }}>
            {err}
          </Alert>
        )}

        {!loading && !err && (
          <Paper
            sx={{
              bgcolor: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              overflow: "auto",
              border: "1px solid rgba(124,255,114,0.22)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={cellHead}>ID</TableCell>
                  <TableCell sx={cellHead}>oauth (앞)</TableCell>
                  <TableCell sx={cellHead}>별명</TableCell>
                  <TableCell sx={cellHead}>역할</TableCell>
                  <TableCell sx={cellHead}>누적 리워드</TableCell>
                  <TableCell sx={cellHead}>상태</TableCell>
                  <TableCell sx={cellHead} align="right">
                    작업
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    sx={{
                      "&:nth-of-type(odd)": { bgcolor: "rgba(255,255,255,0.02)" },
                      "&:last-child td": { border: 0 },
                    }}
                  >
                    <TableCell sx={cellBody}>{u.id}</TableCell>
                    <TableCell sx={{ ...cellBody, fontFamily: "monospace", fontSize: "0.85rem" }}>
                      {(u.oauthId || "").slice(0, 12)}…
                    </TableCell>
                    <TableCell sx={cellBody}>{u.nickname || "—"}</TableCell>
                    <TableCell sx={cellBody}>{u.role}</TableCell>
                    <TableCell sx={cellBody}>{u.totalRewards ?? 0}</TableCell>
                    <TableCell sx={cellBody}>{u.status}</TableCell>
                    <TableCell sx={cellBody} align="right">
                      <IconButton size="small" aria-label="수정" onClick={() => openEdit(u)} sx={{ color: "#7CFF72" }}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="삭제"
                        onClick={() => setDeleteTarget(u)}
                        sx={{ color: "#ff8a8a" }}
                        disabled={currentUser?.id != null && u.id === currentUser.id}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: "#121816", color: "#fff", border: "1px solid rgba(124,255,114,0.25)" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>유저 수정 {editing ? `#${editing.id}` : ""}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="별명"
            value={form.nickname}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.7)" } }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>역할</InputLabel>
            <Select
              value={form.role}
              label="역할"
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124,255,114,0.35)" } }}
            >
              <MenuItem value="USER">USER</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="상태"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            fullWidth
            placeholder="ACTIVE"
            sx={{ input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.7)" } }}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="누적 리워드"
              type="number"
              value={form.totalRewards}
              onChange={(e) => setForm((f) => ({ ...f, totalRewards: e.target.value }))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.7)" } }}
            />
            <TextField
              label="현재 리워드"
              type="number"
              value={form.nowRewards}
              onChange={(e) => setForm((f) => ({ ...f, nowRewards: e.target.value }))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.7)" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ color: "rgba(255,255,255,0.7)" }}>
            취소
          </Button>
          <Button onClick={saveEdit} disabled={saving} variant="contained" sx={{ bgcolor: "#7CFF72", color: "#000", fontWeight: 800 }}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} PaperProps={{ sx: { bgcolor: "#121816", color: "#fff" } }}>
        <DialogTitle>유저 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말 삭제할까요? ID {deleteTarget?.id} ({deleteTarget?.nickname || deleteTarget?.oauthId?.slice(0, 8)})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            취소
          </Button>
          <Button onClick={confirmDelete} disabled={saving} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DB;
