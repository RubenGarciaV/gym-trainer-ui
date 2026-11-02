import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css'
import { lazy } from 'react';
import Header from './views/header/header';
import Footer from './views/footer/footer';

const Login = lazy(() => import('./views/login/login'));
const Home = lazy(() => import('./views/home/home'));

function AppContent() {
  const { pathname } = useLocation();
  const showNavigation = pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col">
      {showNavigation && <Header />}
      <main className={`flex-1 ${showNavigation ? 'pb-18' : ''}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </main>
      {showNavigation && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
