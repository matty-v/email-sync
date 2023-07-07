import AttachmentIcon from '@mui/icons-material/Attachment';
import EmailIcon from '@mui/icons-material/Email';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchAttachmentById, fetchEmailsWithLabel } from '../services/api-client';
import { Email } from '../types';
import { Events, on } from '../utils/Broadcaster';
import { ViewEmailDlg } from './ViewEmailDlg';

export function EmailList() {
  const [viewEmailDialogOpen, setViewEmailDialogOpen] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const fetchEmails = async () => {
    const fetchedEmails = await fetchEmailsWithLabel('Sync to Notion');
    setEmails(fetchedEmails);
  };

  useEffect(() => {
    on(Events.Login).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        fetchEmails();
      }
    });
  }, []);

  const handleDownloadAttachment = async (email: Email) => {
    const attachment = await fetchAttachmentById(email.id, email.attachments[0].attachmentId);
    let link = document.createElement('a');
    link.download = email.attachments[0].filename;
    link.href = 'data:application/octet-stream;base64,' + attachment.payload;
    document.body.appendChild(link); // Needed for Firefox
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {emails.length > 0 ? (
        <>
          <List>
            {emails.map(email => (
              <ListItem
                key={email.id}
                secondaryAction={
                  email.attachments?.length > 0 ? (
                    <Tooltip title={email.attachments[0].filename}>
                      <IconButton onClick={async () => await handleDownloadAttachment(email)} edge="end">
                        <AttachmentIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <></>
                  )
                }
              >
                <ListItemAvatar
                  onClick={() => {
                    setSelectedEmail(email);
                    setViewEmailDialogOpen(true);
                  }}
                >
                  <Avatar>
                    <EmailIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={email.headers.subject} secondary={email.headers.date} />
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        <></>
      )}
      {selectedEmail ? (
        <ViewEmailDlg open={viewEmailDialogOpen} setOpen={setViewEmailDialogOpen} email={selectedEmail} />
      ) : (
        <></>
      )}
    </>
  );
}
