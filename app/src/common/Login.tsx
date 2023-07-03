import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import { useState } from 'react';

export function Login() {
  const [name, setName] = useState('');

  useGoogleOneTapLogin({
    onSuccess: credentialResponse => {
      console.log(credentialResponse);
      const decoded: any = jwt_decode(credentialResponse.credential ?? '');
      console.log(decoded);
      setName(decoded.name);
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  return (
    <Box>
      <Typography variant="h3">{name ? `Hello ${name}` : 'You are logged out'}</Typography>
    </Box>
  );
}
