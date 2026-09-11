import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Security, Shield, Lock, Verified } from '@mui/icons-material';
import { Fade, Slide } from '@mui/material';
import { theme } from '../../theme.js';

function Body() {
    const features = [
        {
            icon: <Security sx={{ fontSize: 40, color: 'white' }} />,
            title: 'Advanced Security',
            description: 'Military-grade encryption to protect your data'
        },
        {
            icon: <Shield sx={{ fontSize: 40, color: 'white' }} />,
            title: 'Complete Protection',
            description: 'Comprehensive security solutions for all your needs'
        },
        {
            icon: <Lock sx={{ fontSize: 40, color: 'white' }} />,
            title: 'Privacy First',
            description: 'Your privacy is our top priority, always'
        },
        {
            icon: <Verified sx={{ fontSize: 40, color: 'white' }} />,
            title: 'Trusted Platform',
            description: 'Verified and trusted by thousands of users'
        }
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '80vh' }}>
            {/* Hero Section */}
            <Box sx={{ 
                mt: { xs: 8, sm: 12, md: 15, lg: 18 },
                textAlign: 'center',
                mb: 8
            }}>
                <Fade in timeout={1000}>
                    <Typography 
                        variant="h1" 
                        sx={{
                            fontFamily: theme.font.family,
                            fontWeight: 800,
                            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
                            background: `linear-gradient(45deg, ${theme.colors.font} 30%, ${theme.colors.fontLight} 90%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2,
                            letterSpacing: '-0.02em'
                        }}
                    >
                        OmniNet
                    </Typography>
                </Fade>

                <Fade in timeout={1200}>
                    <Typography 
                        variant="h5" 
                        sx={{
                            color: theme.colors.fontBody,
                            fontWeight: 300,
                            mb: 4,
                            fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                            maxWidth: '600px',
                            mx: 'auto',
                            lineHeight: 1.6
                        }}
                    >
                        Your security is our priority. Experience next-generation protection with our comprehensive security solutions.
                    </Typography>
                </Fade>

                <Slide direction="up" in timeout={1400}>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => window.location.href = '/login'}
                            sx={{
                                py: 2,
                                px: 4,
                                borderRadius: 3,
                                background: theme.colors.primary,
                                boxShadow: `0 8px 20px ${theme.colors.primary}40`,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    boxShadow: `0 12px 25px ${theme.colors.primary}50`,
                                    background: theme.colors.secondary
                                }
                            }}
                        >
                            Get Started
                        </Button>
                    </Box>
                </Slide>
            </Box>

            {/* Features Section */}
            <Fade in timeout={1600}>
                <Grid container spacing={4} sx={{ mt: 8 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    background: theme.colors.background,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 3,
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        border: `1px solid ${theme.colors.primary}`,
                                        boxShadow: `0 20px 40px ${theme.colors.primary}20`
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2,
                                            boxShadow: `0 8px 20px ${theme.colors.primary}30`
                                        }}
                                    >
                                        {feature.icon}
                                    </Box>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: theme.colors.font,
                                            fontWeight: 700,
                                            mb: 1,
                                            fontSize: '1.2rem'
                                        }}
                                    >
                                        {feature.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.colors.fontBody,
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Fade>
        </Container>
    );
}

export default Body;
