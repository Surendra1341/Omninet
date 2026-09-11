import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import Navbar from "./Navbar";
import Container from "@mui/material/Container";
import Footer from "./Footer";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Storage from "../pages/Storage/Storage";
import Todo from "../pages/Todo/Todo";
import Profile from "../pages/Profile/Profile";
import Notes from "../pages/Notes/Notes";
import Category from "../pages/Category/Category";
import Chat from "../pages/Chat/Chat";
import AiChat from "../pages/AiChat/AiChat";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
} from "@mui/material";
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
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress color="primary" />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading user data...
        </Typography>
      </Box>
    );
  }

  // Show error state if we should be authenticated but have no user
  if (!user) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading user data
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <Container maxWidth={false} disableGutters sx={{ padding: 0, margin: 0 }}>
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
          <Route path="/category" element={<Category />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route
            path="/*"
            element={<Navigate to="/home/storage" replace />}
          />
        </Routes>
        {/* <Footer /> */}
      </Container>
    </ThemeProvider>
  );
};

export default Home;
