import { Dialog, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import createDOMPurify from 'dompurify';
import { Email } from '../types';

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

  return (
    <Dialog
      fullWidth
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
        <Divider sx={{ mt: 2, mb: 2 }} />
        <iframe
          style={{ width: '100%', height: '100%', marginBottom: '8px', backgroundColor: 'white' }}
          srcDoc={DOMPurify.sanitize(email.textHtml)}
        ></iframe>
      </DialogContent>
    </Dialog>
  );
}
