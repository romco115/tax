import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Interview from "./components/Interview";

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/interview" element={<Interview />} />
    </Routes>
  </BrowserRouter>
);

export default App;
