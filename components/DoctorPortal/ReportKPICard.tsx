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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wide">
        <span className="text-lg">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      <p className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 w-fit px-2 py-1 rounded-md">
        {subtext}
      </p>
    </div>
  );
}