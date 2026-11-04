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
import { ModalProvider, useModal } from './components/modal-provider';

const Login = lazy(() => import('./views/login/login'));
const Home = lazy(() => import('./views/home/home'));
const Workouts = lazy(() => import('./views/workouts/workouts'));
const WorkoutSession = lazy(() => import('./views/workouts/workout-session'));
const Training = lazy(() => import('./views/training/training'));
const Profile = lazy(() => import('./views/profile/profile'));
const History = lazy(() => import('./views/history/history'));

function AppContent() {
  const location = useLocation();
  const { pathname } = location;
  const { user, isSessionLoading, sessionError } = useSession();
  const { showAlert } = useModal();
  const showNavigation = pathname !== '/';

  useEffect(() => {
    if (sessionError) showAlert('error', sessionError);
  }, [sessionError, showAlert]);

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
    <div className="app-frame flex flex-col">
      {showNavigation && <Header />}
      <main
        className={`app-main flex-1 ${showNavigation ? 'mobile-nav-space' : 'min-h-screen'}`}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/workouts/:routineId/start" element={<WorkoutSession />} />
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
      <ModalProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </ModalProvider>
    </BrowserRouter>
  );
}

export default App;
