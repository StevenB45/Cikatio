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
import { SwapHoriz as SwapIcon } from '@mui/icons-material';
import { StatusBadge } from '@/components/items/statusBadges';
import { LoanStatus } from '@prisma/client';
import DashboardCard from '@/components/common/DashboardCard';

// Define the structure for a processed loan item
interface ProcessedLoan {
  id: string;
  itemName: string;
  borrower: string;
  date: string;
  dueDate: string;
  status: LoanStatus;
}

interface RecentLoansListProps {
  loans: ProcessedLoan[];
}

const RecentLoansList = ({ loans }: RecentLoansListProps) => (
  <DashboardCard
    type="list"
    title="Prêts récents"
    link="/loans"
  >
    {loans.length > 0 ? (
      <List disablePadding>
        {loans.map((loan, index) => (
          <React.Fragment key={loan.id}>
            <ListItem disableGutters>
              <ListItemButton component={Link} href={`/loans?search=${loan.id}`}> 
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <SwapIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={loan.itemName} 
                  secondary={`Emprunté par ${loan.borrower} le ${loan.date}`} 
                />
                <StatusBadge status={loan.status} sx={{ ml: 2 }} /> 
              </ListItemButton>
            </ListItem>
            {index < loans.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        Aucun prêt récent.
      </Typography>
    )}
  </DashboardCard>
);

export default RecentLoansList;
