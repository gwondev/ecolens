import { Box, Typography, Button, Container, Divider, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
// 아이콘 사용을 위해 @mui/icons-material 설치가 필요합니다 (npm i @mui/icons-material)
import { Hub, Map, SettingsInputAntenna } from "@mui/icons-material";

const RootPage = () => {
  const navigate = useNavigate();

  // B&W 테마를 위한 색상 상수를 정의합니다.
  const COLOR = {
    bg: "#121212", // 아주 짙은 블랙 (배경)
    text: "#FFFFFF", // 완전 화이트 (메인 텍스트)
    subText: "#A0A0A0", // 그레이 (서브 텍스트)
    accent: "#333333", // 약간 밝은 블랙 (요소 배경)
    border: "#444444", // 보더 색상
  };

  return (
    <Box sx={{ bgcolor: COLOR.bg, color: COLOR.text, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          
          {/* 왼쪽 섹션: 소개 및 버튼 */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="h6" fontWeight="300" color={COLOR.subText} sx={{ letterSpacing: '0.2em' }}>
                INFRASTRUCTURE & PORTFOLIO
              </Typography>
              
              <Typography variant="h1" fontWeight="bold" sx={{ 
                fontSize: { xs: '3rem', md: '5rem' }, 
                lineHeight: 0.9,
                mb: 1
              }}>
                GWON
              </Typography>
              
              <Typography variant="body1" color={COLOR.subText} sx={{ maxWidth: '400px', mb: 3 }}>
                안녕하세요. lsgwon입니다. 제 개인 포트폴리오 웹사이트와 자취방 서버 인프라를 통합하여 관리하는 플랫폼입니다. 정상적으로 연결되었습니다.
              </Typography>

              <Divider sx={{ borderColor: COLOR.border, mb: 3 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate('/portfolio')}
                  sx={{ 
                    bgcolor: COLOR.text, 
                    color: COLOR.bg, 
                    '&:hover': { bgcolor: COLOR.subText },
                    fontWeight: 'bold',
                    px: 4
                  }}
                >
                  포트폴리오 보기
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/db')}
                  sx={{ 
                    borderColor: COLOR.text, 
                    color: COLOR.text, 
                    '&:hover': { borderColor: COLOR.subText, bgcolor: 'rgba(255,255,255,0.05)' },
                    px: 4
                  }}
                >
                  DB 인프라
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* 오른쪽 섹션: 추상적인 지도/토폴로지 시각화 */}
          <Grid item xs={12} md={7}>
            <Box sx={{ 
              p: 4, 
              bgcolor: COLOR.accent, 
              borderRadius: 4, 
              border: `1px solid ${COLOR.border}`,
              aspectRatio: '16/10', // 일정한 비율 유지
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* 추상적인 지도 배경 (나중에 SVG나 이미지를 넣으셔도 됩니다.) */}
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.1,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")', // 점박이 패턴
              }} />

              {/* 중앙 네트워크 토폴로지 시각화 (간단한 아이콘으로 구성) */}
              <Grid container spacing={2} sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Grid item xs={4}>
                  <InfoNode Icon={Hub} label="Core Server" value="Ubuntu 24.04" color={COLOR.text} />
                </Grid>
                <Grid item xs={4}>
                  <InfoNode Icon={SettingsInputAntenna} label="GreenEYE IoT" value="MQTT (Active)" color={COLOR.text} />
                </Grid>
                <Grid item xs={4}>
                  <InfoNode Icon={Map} label="Service Map" value="Public Hostnames" color={COLOR.text} />
                </Grid>
              </Grid>
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

// 오른쪽 섹션의 아이콘 노드를 그리는 헬퍼 컴포넌트입니다.
const InfoNode = ({ Icon, label, value, color }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <Icon sx={{ fontSize: '4rem', color: color }} />
    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>{label}</Typography>
    <Typography variant="body2" color="#A0A0A0">{value}</Typography>
  </Box>
);

export default RootPage;