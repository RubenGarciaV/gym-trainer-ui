import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css'
import { lazy } from 'react';
import Header from './views/header/header';
import Footer from './views/footer/footer';
import { SessionProvider } from './hooks/auth/session-context';

const Login = lazy(() => import('./views/login/login'));
const Home = lazy(() => import('./views/home/home'));
const Workouts = lazy(() => import('./views/workouts/workouts'));
const Training = lazy(() => import('./views/training/training'));
const Profile = lazy(() => import('./views/profile/profile'));
const History = lazy(() => import('./views/history/history'));

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
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/training" element={<Training />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
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
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
