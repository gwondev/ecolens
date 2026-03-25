import { useState } from "react";
import { Box, Container, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, saveAuth } from "../services/auth";

const NicknamePage = () => {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();
  const user = getUser();

  const handleSubmit = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/nickname`, {
        oauthId: user.oauthId,
        nickname: nickname
      });
      // 로컬 스토리지 정보 갱신
      const updatedUser = { ...user, nickname: nickname };
      saveAuth(updatedUser);
      navigate("/db");
    } catch (e) {
      alert("이미 있는 별명이거나 에러가 발생했습니다.");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10, textAlign: "center", color: "#fff" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>별명 설정</Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="사용할 별명을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1, input: { color: "#fff" }, mb: 3 }}
      />
      <Button 
        fullWidth 
        variant="contained" 
        size="large"
        onClick={handleSubmit}
        sx={{ bgcolor: "#7CFF72", color: "#000", "&:hover": { bgcolor: "#5ecc56" } }}
      >
        시작하기
      </Button>
    </Container>
  );
};

export default NicknamePage;