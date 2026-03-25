import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootPage from "./pages/RootPage";
import DBPage from "./pages/DBPage";
import NicknamePage from "./pages/NicknamePage"; // 추가됨
import MapPage from "./pages/MapPage";           // 추가됨
import Recognition from "./pages/features/Recognition";
import Reward from "./pages/features/Reward";
import Control from "./pages/features/Control";
import Guide from "./pages/features/Guide";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 시작 및 계정 설정 */}
        <Route path="/" element={<RootPage />} />
        <Route path="/nickname" element={<NicknamePage />} />

        {/* 메인 서비스 (지도) */}
        <Route path="/map" element={<MapPage />} />

        {/* 관리자 전용 페이지 */}
        <Route path="/db" element={<DBPage />} />

        {/* 개별 기능 페이지 */}
        <Route path="/features/recognition" element={<Recognition />} />
        <Route path="/features/guide" element={<Guide />} />
        <Route path="/features/reward" element={<Reward />} />
        <Route path="/features/control" element={<Control />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;