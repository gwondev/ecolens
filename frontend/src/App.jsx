import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Root from "./pages/Root";
import Nickname from "./pages/Nickname";
import Camera from "./pages/Camera";
import MapPage from "./pages/Map";
import Manage from "./pages/Manage";
import { isAuthenticated } from "./services/auth";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    primary: { main: "#111111" },
    text: { primary: "#111111", secondary: "#555555" },
  },
});

function App() {
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/nickname" element={<Nickname />} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/camera" element={<ProtectedRoute><Camera /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;