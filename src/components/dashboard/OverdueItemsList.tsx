import React from 'react';
import Link from 'next/link';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Typography,
  Divider 
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import DashboardCard from '@/components/common/DashboardCard';

// Define the structure for a processed overdue item
interface ProcessedOverdueItem {
  id: string;
  itemName: string;
  borrower: string;
  dueDate: string;
}

interface OverdueItemsListProps {
  items: ProcessedOverdueItem[];
}

const OverdueItemsList = ({ items }: OverdueItemsListProps) => (
  <DashboardCard
    type="list"
    title="Retours en retard"
    link="/loans?status=OVERDUE"
    headerProps={{ 
      titleTypographyProps: { color: 'error.main' },
      action: <Link href="/loans?status=OVERDUE" style={{ textDecoration: 'none' }}><Typography color="error" variant="button" fontSize="small">Voir tout</Typography></Link>
    }}
  >
    {items.length > 0 ? (
      <>
        <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
          {`Nombre de prêts en retard trouvés : ${items.length}`}
        </Typography>
        <List disablePadding>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem disableGutters>
                <ListItemButton component={Link} href={`/loans?search=${item.id}`}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light' }}>
                      <WarningIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={item.itemName} 
                    secondary={`Par ${item.borrower} - Dû le ${item.dueDate}`} 
                  />
                </ListItemButton>
              </ListItem>
              {index < items.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        Aucun retour en retard en ce moment. Bravo !
      </Typography>
    )}
  </DashboardCard>
);

export default OverdueItemsList;
