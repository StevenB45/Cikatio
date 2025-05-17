import { Box, Typography, BoxProps } from '@mui/material';

export default function Footer(props: BoxProps) {
  return (
    <Box
      {...props}
      sx={{
        mt: 'auto',
        pt: 2,
        pb: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        ...props.sx,
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 0.5 }}>
        Développé avec ❤️ par StevenB
      </Typography>
    </Box>
  );
}
