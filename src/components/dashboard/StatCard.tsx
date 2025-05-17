import React from 'react';
import DashboardCard from '@/components/common/DashboardCard';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  link: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  link 
}: StatCardProps) => (
  <DashboardCard
    type="stat"
    title={title}
    value={value}
    icon={icon}
    iconColor={color}
    subtitle={subtitle}
    link={link}
  />
);

export default StatCard;
