import Navbar from './Navbar';
import Body from './Body';
import Footer from './Footer';
import Box from '@mui/material/Box';
import { theme } from '../../theme';

function LandingPage() {
    return (
        <Box sx={{
            background: theme.colors.background,
            minHeight: '100vh'
        }}>
            <Navbar />
            <Body />
            <Footer />
        </Box>
    );
}

export default LandingPage;