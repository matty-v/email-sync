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
      console.log(payload);
      setEnabled(payload.Enabled);
      if (payload.Progress) {
        setProgress(payload.Progress);
        setType('determinate');
      }
    });
  }, []);

  return <CircularProgress hidden={!enabled} variant={type} value={progress} />;
}
