interface ReportKPICardProps {
  title: string;
  value: string;
  subtext: string;
  icon: string;
}

export default function ReportKPICard({
  title,
  value,
  subtext,
  icon,
}: ReportKPICardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      <p className="text-sm text-green-500">{subtext}</p>
    </div>
  );
}
