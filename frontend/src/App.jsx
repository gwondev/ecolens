import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Root from "./pages/Root";
import Nickname from "./pages/Nickname";
import Map from "./pages/Map";
import { isAuthenticated } from "./services/auth";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#030403",
      paper: "rgba(255,255,255,0.06)",
    },
    primary: { main: "#7CFF72" },
    text: { primary: "#fff", secondary: "rgba(255,255,255,0.7)" },
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
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;