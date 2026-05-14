import { useLanguage } from '../context/LanguageContext';

const Table = ({ columns, data, renderActions, emptyMessage }) => {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-panel backdrop-blur">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-cyan-100">
        <thead className="bg-cyan-50/70">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                {column.label}
              </th>
            ))}
            {renderActions && <th className="px-5 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-cyan-50">
          {data.length === 0 ? (
            <tr>
              <td className="px-5 py-10 text-center text-sm font-semibold text-slate-500" colSpan={columns.length + (renderActions ? 1 : 0)}>
                {emptyMessage || t('common.noRecords')}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id} className="hover:bg-cyan-50/60">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {renderActions && <td className="px-5 py-4 text-right">{renderActions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default Table;
