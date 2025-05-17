import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface DialogLayoutProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  dialogProps?: any;
}

const DialogLayout: React.FC<DialogLayoutProps> = ({ open, onClose, title, actions, children, dialogProps }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xl"
    fullWidth
    PaperProps={{
      sx: {
        minWidth: 700,
        minHeight: 500,
        width: '90vw',
        height: '90vh',
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'flex',
        flexDirection: 'column',
      }
    }}
    {...(dialogProps || {})}
  >
    <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
    <DialogContent
      dividers
      sx={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 3,
      }}
    >
      {children}
    </DialogContent>
    {actions && (
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', justifyContent: 'flex-end' }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

export default DialogLayout;
