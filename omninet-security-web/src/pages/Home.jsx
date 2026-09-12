import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import Navbar from "./Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Storage from "../pages/Storage/Storage";
import Todo from "../pages/Todo/Todo";
import Profile from "../pages/Profile/Profile";
import Notes from "../pages/Notes/Notes";
import Category from "../pages/Category/Category";
import Chat from "../pages/Chat/Chat";
import AiChat from "../pages/AiChat/AiChat";
import { ThemeProvider } from "../contexts/ThemeContext";

const Home = () => {
  const { user, logout, logoutAll, isAuthenticated } = useAuthStore();

  // console.log('Dashboard - User:', user);
  // console.log('Dashboard - IsAuthenticated:', isAuthenticated);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error in component:", error);
      toast.error("Logout failed");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      toast.success("Logged out from all devices successfully");
    } catch (error) {
      console.error("Logout all error in component:", error);
      toast.error("Failed to logout from all devices");
    }
  };

  // Show loading state if user data is not available yet
  if (!user && isAuthenticated) {
    return <div className="grid min-h-screen place-items-center"><span className="loading loading-spinner" /></div>;
  }

  // Show error state if we should be authenticated but have no user
  if (!user) {
    return <main className="grid min-h-screen place-items-center p-6"><div role="alert" className="alert alert-error max-w-md"><span>We couldn’t load your workspace.</span><button className="btn btn-sm" onClick={() => window.location.reload()}>Reload</button></div></main>;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-200 text-base-content flex flex-col antialiased selection:bg-primary/20">
        <Navbar
          handleLogout={handleLogout}
          handleLogoutAll={handleLogoutAll}
          user={user}
        />
        <Routes>
          {/* <Route path="/" element={<Navigate to="/home/dashboard" replace />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/category" element={<Navigate to="/home/notes?tab=categories" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route
            path="/*"
            element={<Navigate to="/home/storage" replace />}
          />
        </Routes>
        {/* <Footer /> */}
      </div>
    </ThemeProvider>
  );
};

export default Home;
