import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import { GitHub, Twitter, LinkedIn, Email } from '@mui/icons-material';
import { theme } from '../../theme';

export default function Footer() {
  const socialLinks = [
    { icon: <GitHub />, url: '#', label: 'GitHub' },
    { icon: <Twitter />, url: '#', label: 'Twitter' },
    { icon: <LinkedIn />, url: '#', label: 'LinkedIn' },
    { icon: <Email />, url: '#', label: 'Email' }
  ];

  const quickLinks = [
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' },
    { name: 'Security', url: '/security' },
    { name: 'Support', url: '/support' },
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' }
  ];

  return (
    <Box 
      sx={{
        background: theme.colors.backgroundLight,
        borderTop: `1px solid ${theme.colors.border}`,
        py: { xs: 4, sm: 4, md: 6, lg: 8 },
        mt: 8
      }}
    >
      <Grid container spacing={4} sx={{ px: { xs: 2, sm: 2, md: 4, lg: 8 } }}>
        {/* Brand Section */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              sx={{
                fontFamily: theme.font.family, 
                textAlign: 'left', 
                fontWeight: 800, 
                fontSize: '1.8rem', 
                color: theme.colors.primary,
                mb: 1
              }}
            >
              OmniNet
            </Typography>
            <Typography 
              sx={{
                fontFamily: theme.font.family, 
                fontSize: '1rem', 
                textAlign: 'left', 
                fontWeight: 400, 
                color: theme.colors.fontBodyLight,
                lineHeight: 1.6,
                maxWidth: '300px'
              }}
            >
              Your gateway to secure networking. Protecting your digital life with advanced security solutions and comprehensive protection.
            </Typography>
          </Box>

          {/* Social Links */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {socialLinks.map((social, index) => (
              <IconButton
                key={index}
                href={social.url}
                sx={{
                  color: theme.colors.fontBodyLight,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: theme.colors.primary,
                    borderColor: theme.colors.primary,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 8px ${theme.colors.primary}20`
                  }
                }}
                aria-label={social.label}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Grid>

        {/* Quick Links Section */}
        <Grid item xs={12} md={4}>
          <Typography 
            sx={{
              fontFamily: theme.font.family, 
              textAlign: 'left', 
              fontWeight: 700, 
              fontSize: '1.2rem', 
              color: theme.colors.font,
              mb: 2
            }}
          >
            Quick Links
          </Typography>      
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.url}
                underline="none"
                sx={{
                  fontFamily: theme.font.family, 
                  fontSize: '0.95rem', 
                  fontWeight: 500, 
                  color: theme.colors.fontBodyLight,
                  transition: 'all 0.3s ease',
                  py: 0.5,
                  display: 'inline-block',
                  '&:hover': {
                    color: theme.colors.primary,
                    transform: 'translateX(5px)'
                  }
                }}
              >
                {link.name}
              </Link>
            ))}
          </Box>
        </Grid>

        {/* Contact & Newsletter Section */}
        <Grid item xs={12} md={4}>
          <Typography 
            sx={{
              fontFamily: theme.font.family, 
              textAlign: 'left', 
              fontWeight: 700, 
              fontSize: '1.2rem', 
              color: theme.colors.font,
              mb: 2
            }}
          >
            Stay Connected
          </Typography>
          <Typography 
            sx={{
              fontFamily: theme.font.family, 
              fontSize: '0.95rem', 
              color: theme.colors.fontBodyLight,
              mb: 2,
              lineHeight: 1.6
            }}
          >
            Subscribe to our newsletter for the latest security updates and features.
          </Typography>
          <Box
            sx={{
              background: theme.colors.background,
              borderRadius: 2,
              p: 2,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <Typography 
              sx={{
                fontFamily: theme.font.family, 
                fontSize: '0.9rem', 
                color: theme.colors.fontBodyLight,
                textAlign: 'center'
              }}
            >
              📧 contact@omninet.security
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Copyright Section */}
      <Box 
        sx={{ 
          borderTop: `1px solid ${theme.colors.border}`, 
          mt: 4, 
          pt: 3,
          textAlign: 'center'
        }}
      >
        <Typography 
          sx={{
            fontFamily: theme.font.family, 
            fontSize: '0.9rem', 
            color: theme.colors.fontMuted,
            fontWeight: 400
          }}
        >
          © 2024 OmniNet Security. All rights reserved. | Built with security in mind.
        </Typography>
      </Box>
    </Box>
  );
}
