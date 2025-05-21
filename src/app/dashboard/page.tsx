import { prisma } from '@/lib/prisma';
import React from 'react';
import { 
  Typography, 
  Box,
  Grid 
} from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
// Import the extracted components
import QuickActions from '@/components/dashboard/QuickActions';
import StatsOverview from '@/components/dashboard/StatsOverview';
import RecentLoansList from '@/components/dashboard/RecentLoansList';
import OverdueItemsList from '@/components/dashboard/OverdueItemsList';
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/authOptions";
import { redirect } from "next/navigation";

// Import necessary types and enums from Prisma
import type { Item, User, Loan } from '@prisma/client'; 
import { LoanStatus, ItemType } from '@prisma/client'; 
import { formatDate } from '@/lib/utils';

// --- Helper Functions ---

// Use Prisma's LoanStatus enum
function computeLoanStatus(loan: Loan): LoanStatus {
  if (!loan.dueAt) return LoanStatus.ACTIVE;
  
  // Si retourné, c'est retourné
  if (loan.returnedAt) return LoanStatus.RETURNED;
  
  // Si la date de retour est dépassée, c'est en retard
  if (new Date(loan.dueAt) < new Date()) return LoanStatus.OVERDUE;
  
  // Sinon c'est actif
  return LoanStatus.ACTIVE;
}

// Define types needed for data processing within this page
interface ProcessedLoanData {
  id: string;
  itemName: string;
  borrower: string;
  date: string;
  dueDate: string;
  status: LoanStatus; 
}

interface ProcessedOverdueItemData {
  id: string;
  itemName: string;
  borrower: string;
  dueDate: string;
}

interface DashboardStatsData {
  books: number;
  booksBorrowed: number;
  equipment: number;
  equipmentBorrowed: number;
  users: number;
  newUsers: number;
  activeLoans: number;
  overdue: number;
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  console.log('SESSION DASHBOARD:', session);
  if (!session || !session.user?.isAdmin) {
    redirect("/auth/login");
  }
  // Data Fetching
  const [items, users, loansRaw] = await Promise.all([
    prisma.item.findMany(),
    prisma.user.findMany(),
    prisma.loan.findMany({ 
      include: { 
        item: true, 
        borrower: true 
      },
      orderBy: {
        borrowedAt: 'desc' 
      }
    })
  ]);

  // Process Loans with Status
  const loans: (Loan & { status: LoanStatus, item?: Item | null, borrower?: User | null })[] = loansRaw.map(loan => ({ 
    ...loan, 
    status: computeLoanStatus(loan) 
  }));

  // Calculate Stats
  const books = items.filter(i => i.category === ItemType.BOOK).length;
  const booksBorrowed = loans.filter(l => l.item?.category === ItemType.BOOK && l.status === LoanStatus.ACTIVE).length;
  const equipment = items.filter(i => i.category === ItemType.EQUIPMENT).length;
  const equipmentBorrowed = loans.filter(l => l.item?.category === ItemType.EQUIPMENT && l.status === LoanStatus.ACTIVE).length;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); 
  const usersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) > oneWeekAgo).length;

  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const overdueItems = loans.filter(l => l.status === LoanStatus.OVERDUE);

  // Prepare data for components
  const recentLoansData: ProcessedLoanData[] = loans
    .slice(0, 5) 
    .map(l => ({
      id: l.id,
      itemName: l.item?.name || 'Item inconnu',
      borrower: l.borrower ? `${l.borrower.firstName} ${l.borrower.lastName}` : 'Usager inconnu',
      date: l.borrowedAt ? formatDate(l.borrowedAt) : '-', 
      dueDate: l.returnedAt ? formatDate(l.returnedAt) : (l.dueAt ? formatDate(l.dueAt) : '-'), 
      status: l.status
    }));

  const overdueItemsData: ProcessedOverdueItemData[] = overdueItems
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()) 
    .slice(0, 5)
    .map(l => ({
      id: l.id,
      itemName: l.item?.name || 'Item inconnu',
      borrower: l.borrower ? `${l.borrower.firstName} ${l.borrower.lastName}` : 'Usager inconnu',
      dueDate: l.returnedAt ? formatDate(l.returnedAt) : (l.dueAt ? formatDate(l.dueAt) : '-'), 
    }));

  const stats: DashboardStatsData = {
    books,
    booksBorrowed,
    equipment,
    equipmentBorrowed,
    users: users.length,
    newUsers: usersThisWeek,
    activeLoans,
    overdue: overdueItems.length,
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Tableau de bord
        </Typography>
      </Box>

      {/* Première ligne : Actions rapides uniquement */}
      <Box sx={{ mb: 4 }}>
        <QuickActions />
      </Box>

      {/* Deuxième ligne : Stats uniquement */}
      <Box sx={{ mb: 4 }}>
        <StatsOverview stats={stats} />
      </Box>

      {/* Troisième ligne : Prêts en retard et prêts récents */}
      <Grid container spacing={3}> 
        <Grid item xs={12} md={6}>
          <OverdueItemsList items={overdueItemsData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RecentLoansList loans={recentLoansData} />
        </Grid>
      </Grid>
    </MainLayout>
  );
}