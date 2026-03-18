interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const cls =
    status === 'payé' ? 'dzm-badge-success' :
    status === 'en attente' ? 'dzm-badge-warning' :
    'dzm-badge-danger';

  return <span className={cls}>{status}</span>;
};

export default StatusBadge;
