import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_JWT_KEY } from '../consts';
import { Events, broadcast } from '../utils/Broadcaster';

export function TopNav() {
  const [name, setName] = useState('');

  const navigate = useNavigate();

  useGoogleOneTapLogin({
    onSuccess: credentialResponse => {
      if (credentialResponse?.credential) {
        localStorage.setItem(GOOGLE_JWT_KEY, credentialResponse.credential);
        const decoded: any = jwt_decode(credentialResponse.credential ?? '');
        setName(decoded.name);
        broadcast(Events.Login, true);
      }
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

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
            Email Sync Tester
          </Typography>
          <div style={{ flexGrow: 1 }}></div>
          {name ? (
            <Typography variant="h6" component="div" className="clickable" onClick={() => navigate('/')}>
              {`Hello, ${name}`}
            </Typography>
          ) : (
            <></>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
