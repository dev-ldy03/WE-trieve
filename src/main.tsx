import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Alerts from './pages/Alerts.tsx'
import ItemDetail from './pages/ItemDetail.tsx'
import Items from './pages/Items.tsx'
import MapHome from './pages/MapHome.tsx'
import MyPage from './pages/MyPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<MapHome />} />
          <Route path="items" element={<Items />} />
          <Route path="items/:id" element={<ItemDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="my" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
