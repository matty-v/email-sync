import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { EmailList } from '../components/EmailList';

export function Main() {
  return (
    <Box>
      <Typography variant="h2">Emails</Typography>
      <EmailList />
    </Box>
  );
}
