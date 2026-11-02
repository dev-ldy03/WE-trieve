import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Alerts from './pages/Alerts.tsx'
import Home from './pages/Home.tsx'
import ItemDetail from './pages/ItemDetail.tsx'
import Predict from './pages/Predict.tsx'
import Report from './pages/Report.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="items/:id" element={<ItemDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="predict" element={<Predict />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
