import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import PersonAddAltTwoToneIcon from '@mui/icons-material/PersonAddAltTwoTone';
import { theme } from '../../theme.js';

const pages = ['Features', 'Security', 'Support'];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0} 
      sx={{ 
        px: {xs:0,sm: 0, md:2,lg:9},
        pt: {xs:0,sm:0,md:1,lg:1},
        background: theme.colors.background,
        borderBottom: `1px solid ${theme.colors.border}`,
        transition: 'all 0.3s ease'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/landing_page"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: theme.font.family,
              fontWeight: 800,
              letterSpacing: '.1rem',
              color: theme.colors.primary,
              textDecoration: 'none',
              fontSize: '1.5rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                color: theme.colors.primaryLight
              }
            }}
          >
            OmniNet
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ 
                color: theme.colors.font,
                '&:hover': {
                  background: theme.colors.backgroundLight,
                  transform: 'scale(1.1)'
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
              sx={{ 
                display: { xs: 'block', md: 'none' },
                '& .MuiPaper-root': {
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 2,
                  mt: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              {pages.map((page) => (
                <MenuItem 
                  key={page} 
                  onClick={handleCloseNavMenu}
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: theme.colors.backgroundLight
                    }
                  }}
                >
                  <Typography sx={{ textAlign: 'center', color: theme.colors.font, fontWeight: 500 }}>{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/landing_page"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: theme.font.family,
              fontWeight: 800,
              letterSpacing: '.1rem',
              color: theme.colors.primary,
              textDecoration: 'none'
            }}
          >
            OmniNet
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ 
                  my: 2, 
                  color: theme.colors.fontBody,
                  display: 'block', 
                  mx: { xs: 1, sm: 2, md: 3, lg: 4 },
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: theme.colors.backgroundLight,
                    color: theme.colors.font,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Sign in to your account">
              <IconButton 
                onClick={() => { window.location.href = '/login'; }} 
                sx={{
                  fontSize: 30, 
                  p: 1.5, 
                  color: theme.colors.primary,
                  background: theme.colors.backgroundLight,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: theme.colors.primary,
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                  }
                }}
              >
                <PersonAddAltTwoToneIcon sx={{fontSize: 28}} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;