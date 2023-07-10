import { Backdrop } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect, useState } from 'react';
import { LoaderPayload } from '../types';
import { Events, on } from '../utils/Broadcaster';

type LoaderVariant = 'indeterminate' | 'determinate' | undefined;

export default function Loader() {
  const [enabled, setEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [type, setType] = useState('indeterminate' as LoaderVariant);

  useEffect(() => {
    on<LoaderPayload>(Events.UpdateLoader).subscribe(payload => {
      setEnabled(payload.Enabled);
      if (payload.Progress) {
        setProgress(payload.Progress);
        setType('determinate');
      }
    });
  }, []);

  return (
    <Backdrop sx={{ color: '#fff', zIndex: 999 }} open={enabled}>
      <CircularProgress variant={type} value={progress} color="inherit" />
    </Backdrop>
  );
}
