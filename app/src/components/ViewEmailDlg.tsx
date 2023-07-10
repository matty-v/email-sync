import { Button, Dialog, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import createDOMPurify from 'dompurify';
import { syncEmail } from '../services/api-client';
import { Email, LoaderPayload, NotificationPayload } from '../types';
import { Events, broadcast } from '../utils/Broadcaster';

const DOMPurify = createDOMPurify(window);

interface ViewEmailDlgProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  email: Email;
}

export function ViewEmailDlg(props: ViewEmailDlgProps) {
  const { email, open, setOpen } = props;

  const handleClose = () => {
    setOpen(false);
  };

  const handleSync = async () => {
    broadcast<LoaderPayload>(Events.UpdateLoader, { Enabled: true });
    const emailPage = await syncEmail(email.id);
    handleClose();
    broadcast<LoaderPayload>(Events.UpdateLoader, { Enabled: false });
    broadcast<NotificationPayload>(Events.Notify, { Message: `Successfully synced email!`, Severity: 'success' });
  };

  return (
    <Dialog
      fullWidth
      sx={{ zIndex: 998 }}
      maxWidth={'lg'}
      PaperProps={{
        style: {
          height: '600px',
        },
      }}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>{email.headers.subject}</DialogTitle>
      <DialogContent>
        <Typography variant="caption" display="block">
          From: {email.headers.from}
        </Typography>
        <Typography variant="caption" display="block">
          To: {email.headers.to}
        </Typography>
        <Typography variant="caption" display="block">
          Sent At: {email.headers.date}
        </Typography>
        <Button onClick={handleSync} variant="contained">
          Sync to Notion
        </Button>
        <Divider sx={{ mt: 2, mb: 2 }} />
        <iframe
          style={{ width: '100%', height: '100%', marginBottom: '8px', backgroundColor: 'white' }}
          srcDoc={DOMPurify.sanitize(email.textHtml)}
        ></iframe>
      </DialogContent>
    </Dialog>
  );
}
