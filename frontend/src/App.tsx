
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { LoginPage } from "./pages/loginPage";
import { RegisterPage } from "./pages/registerPage";
import { HomePage } from "./pages/homePage";
import { OrgPage } from "./pages/orgPage";
import { ProtectedRoute } from "./components/auth/protectedRoute";



function App() {


  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          {/*public routes*/}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/org" element={<OrgPage />} />

          {/*private routes*/}
          <Route element={<ProtectedRoute />}>
            {/* <Route path="/home" element={<HomePage />} /> */}

          </Route>

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
