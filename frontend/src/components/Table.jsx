import { useLanguage } from '../context/LanguageContext';

const Table = ({ columns, data, renderActions, emptyMessage }) => {
  const { t } = useLanguage();

  return (
    <div className="clinic-card overflow-hidden backdrop-blur">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-sky-100">
        <thead className="bg-sky-50/85">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-4 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">
                {column.label}
              </th>
            ))}
            {renderActions && <th className="px-3 py-4 text-right text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-50">
          {data.length === 0 ? (
            <tr>
              <td className="px-3 py-10 text-center text-sm font-semibold text-slate-500 sm:px-5" colSpan={columns.length + (renderActions ? 1 : 0)}>
                {emptyMessage || t('common.noRecords')}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id} className="hover:bg-sky-50/70">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-700 sm:px-5">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {renderActions && <td className="px-3 py-4 text-right sm:px-5">{renderActions(row)}</td>}
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
