import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import './App.css'
import { lazy, useEffect } from 'react';
import Header from './views/header/header';
import Footer from './views/footer/footer';
import { SessionProvider, useSession } from './hooks/auth/session-context';
import { ToastProvider } from './components/toast-provider';
import { useToast } from './components/toast-provider';

const Login = lazy(() => import('./views/login/login'));
const Home = lazy(() => import('./views/home/home'));
const Workouts = lazy(() => import('./views/workouts/workouts'));
const Training = lazy(() => import('./views/training/training'));
const Profile = lazy(() => import('./views/profile/profile'));
const History = lazy(() => import('./views/history/history'));

function AppContent() {
  const location = useLocation();
  const { pathname } = location;
  const { user, isSessionLoading, sessionError } = useSession();
  const showToast = useToast();
  const showNavigation = pathname !== '/';

  useEffect(() => {
    if (sessionError) showToast('error', sessionError);
  }, [sessionError, showToast]);

  if (showNavigation && isSessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500" role="status">
        Cargando sesión...
      </main>
    );
  }

  if (showNavigation && !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

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
      <ToastProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
