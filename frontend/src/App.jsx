import "./App.css";
import Main from "./components/main.component.jsx";
import RegisterUser from "./components/register.component.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginUser from "./components/login.component.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginUser />} />
        <Route path="/RegisterUser" element={<RegisterUser />} />

        <Route path="/main" element={<Main />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
