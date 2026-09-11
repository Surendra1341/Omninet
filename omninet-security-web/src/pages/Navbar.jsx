import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
  Avatar,
  Fade,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Assignment as TodoIcon,
  Note as NotesIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ExitToApp as LogoutAllIcon,
  Security as SecurityIcon,
  Category as CategoryIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { theme } from '../theme.js';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = ({ handleLogout, handleLogoutAll, user}) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const pages = [
    // { name: 'Dashboard', path: '/home/dashboard', icon: <DashboardIcon /> },
    { name: 'Storage', path: '/home/storage', icon: <StorageIcon /> },
    { name: 'Todo', path: '/home/todo', icon: <TodoIcon /> },
    { name: 'Notes', path: '/home/notes', icon: <NotesIcon /> },
    { name: 'Category', path: '/home/category', icon: <CategoryIcon /> },
    { name: 'Chat', path: '/home/chat', icon: <ChatIcon /> },
    { name: 'AI Chat', path: '/home/ai-chat', icon: <ChatIcon /> },
    { name: 'Profile', path: '/home/profile', icon: <ProfileIcon /> }
  ];
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: theme.colors.background,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }} 
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          {/* Logo on lg screens */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', mr: 3 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 2,
                background: `linear-gradient(45deg, ${theme.colors.primaryLight} 30%, ${theme.colors.primary} 90%)`,
                boxShadow: `0 4px 12px ${theme.colors.primaryLight}30`,
              }}
            >
              <SecurityIcon />
            </Avatar>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/home"
              sx={{
                fontFamily: theme.font.family,
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: 1,
                color: theme.colors.background,
                textDecoration: 'none',
                background: theme.colors.font,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                }
              }}
            >
              OmniNet
            </Typography>
          </Box>

          {/* Menu on xs,sm screens */}
          <Box sx={{display: { xs: 'flex',  lg: 'none' } }}>
            <IconButton
              id="menu-button"
              size="large"
              aria-label="navigation menu"
              aria-controls={anchorElNav ? "menu-appbar" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorElNav)}
              onClick={handleOpenNavMenu}
              sx={{
                  color: theme.colors.primary,
                  background: theme.colors.backgroundLight,
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              aria-labelledby="menu-button"
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiPaper-root': {
                  background: `${theme.colors.background}f0`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  mt: 1,
                }
              }}
              MenuListProps={{
                'aria-labelledby': 'menu-button',
                role: 'menu'
              }}
              slotProps={{
                backdrop: {
                  'aria-hidden': 'false'
                }
              }}
            >
              {pages.map((page) => (
                <MenuItem 
                component={Link} 
                to={page.path} 
                  key={page.name} 
                  onClick={handleCloseNavMenu}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.colors.primaryLight}20 30%, ${theme.colors.primary}20 90%)`,
                      transform: 'translateX(5px)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: theme.colors.primaryLight }}>
                    {page.icon}
                  </Box>
                  <Typography 
                    textAlign="center"
                    sx={{ 
                      textDecoration: 'none', 
                      color: theme.colors.fontBody,
                      fontWeight: 500,
                      fontFamily: theme.font.family,
                    }}
                  >
                    {page.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 1.5,
                background: `linear-gradient(45deg, ${theme.colors.primaryLight} 30%, ${theme.colors.primary} 90%)`,
                boxShadow: `0 4px 12px ${theme.colors.primaryLight}30`,
              }}
            >
              <SecurityIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/home" 
              sx={{
                fontFamily: theme.font.family,
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: 1,
                color: theme.colors.background,
                textDecoration: 'none',
                background: theme.colors.font,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              OmniNet
            </Typography>
          </Box>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none',  lg: 'flex' }, justifyContent: 'center', gap: 1 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link} 
                to={page.path} 
                onClick={handleCloseNavMenu}
                startIcon={page.icon}
                sx={{ 
                  mx: 1,
                  px: { xs: 0,sm: 0, md: 0, lg: 1, xl: 3 },
                  py: 1.2,
                  color: theme.colors.fontBody, 
                  borderRadius: 3,
                  fontWeight: 500,
                  fontFamily: theme.font.family,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: theme.colors.backgroundLight,
                    color: theme.colors.font,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            <IconButton 
              id="user-menu-button"
              onClick={handleOpenUserMenu}
              aria-label="user account menu"
              aria-controls={anchorElUser ? "user-menu-appbar" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorElUser)}
              sx={{ 
                p: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              {user.avatarUrl ? (
                <Avatar 
                  alt={user.name} 
                  src={user.avatarUrl}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                />
              ) : (
                <Avatar 
                  alt={user.name} 
                  src={user.avatarUrl}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
            </IconButton>
            <Menu
              sx={{ 
                mt: '50px',
                '& .MuiPaper-root': {
                  background: `${theme.colors.background}f0`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  minWidth: 200,
                }
              }}
              id="user-menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              aria-labelledby="user-menu-button"
              MenuListProps={{
                'aria-labelledby': 'user-menu-button',
                role: 'menu'
              }}
              slotProps={{
                backdrop: {
                  'aria-hidden': 'false'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                <Typography variant="subtitle2" color={theme.colors.fontMuted} fontFamily={theme.font.family}>
                  Signed in as
                </Typography>
                <Typography variant="body2" fontWeight={600} color={theme.colors.fontBody} fontFamily={theme.font.family}>
                  {user?.name || 'User'}
                </Typography>
              </Box>
              
              {/* <MenuItem 
                onClick={handleCloseUserMenu}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.colors.primaryLight}20 30%, ${theme.colors.primary}20 90%)`,
                    transform: 'translateX(5px)',
                  }
                }}
              >
                <SettingsIcon sx={{ mr: 2, color: theme.colors.primaryLight }} />
                <Typography textAlign="center" fontWeight={500} color={theme.colors.fontBody} fontFamily={theme.font.family}>Settings</Typography>
              </MenuItem> */}
              
              
              <MenuItem 
                onClick={() => { handleLogout(); handleCloseUserMenu(); }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, rgba(244, 67, 54, 0.1) 30%, rgba(255, 152, 152, 0.1) 90%)',
                    transform: 'translateX(5px)',
                  }
                }}
              >
                <LogoutIcon sx={{ mr: 2, color: '#f44336' }} />
                <Typography textAlign="center" fontWeight={500} color={theme.colors.fontBody} fontFamily={theme.font.family}>Logout</Typography>
              </MenuItem>
              
              <MenuItem 
                onClick={() => { handleLogoutAll(); handleCloseUserMenu(); }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, rgba(244, 67, 54, 0.1) 30%, rgba(255, 152, 152, 0.1) 90%)',
                    transform: 'translateX(5px)',
                  }
                }}
              >
                <LogoutAllIcon sx={{ mr: 2, color: '#f44336' }} />
                <Typography textAlign="center" fontWeight={500} color={theme.colors.fontBody} fontFamily={theme.font.family}>Logout All Devices</Typography>
              </MenuItem>
              
              <MenuItem 
                onClick={() => { 
                  toggleDarkMode(); 
                  handleCloseUserMenu(); 
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.colors.primaryLight}20 30%, ${theme.colors.primary}20 90%)`,
                    transform: 'translateX(5px)',
                  }
                }}
              >
                {isDarkMode ? (
                  <LightModeIcon sx={{ mr: 2, color: '#FFA726' }} />
                ) : (
                  <DarkModeIcon sx={{ mr: 2, color: theme.colors.primaryLight }} />
                )}
                <Typography textAlign="center" fontWeight={500} color={theme.colors.fontBody} fontFamily={theme.font.family}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
