import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export function TopNav() {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar id="top-nav" position="fixed">
        <Toolbar>
          <img
            id="v-logo"
            data-testid="v-logo"
            className="clickable"
            src="/assets/v-logo-white.png"
            onClick={() => navigate('/')}
          />
          <Typography variant="h6" component="div" className="clickable" onClick={() => navigate('/')}>
            React Boilerplate
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
