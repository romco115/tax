import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Interview from "./components/Interview";
import W7Interview from "./components/W7Interview";

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/form/3520" element={<Interview />} />
      <Route path="/form/w7" element={<W7Interview />} />
      {/* Legacy redirect */}
      <Route path="/interview" element={<Navigate to="/form/3520" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
