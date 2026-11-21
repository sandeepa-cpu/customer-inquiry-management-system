import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, listInquiries } from '../api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

function formatCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export function DashboardPage() {
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listInquiries({
        q,
        status: status || undefined,
      });
      setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Unable to reach the server.');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(event) {
    event.preventDefault();
    setQ(qInput.trim());
  }

  const hasFilters = Boolean(q) || Boolean(status);
  const isEmpty = !loading && !error && inquiries.length === 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inquiries</h1>
          <p className="mt-1 text-sm text-slate-500">Search by customer name or subject, and filter by status.</p>
        </div>
        <Link
          to="/inquiries/new"
          className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        >
          New inquiry
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="inquiry-search" className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id="inquiry-search"
            name="q"
            type="search"
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            placeholder="Customer name or subject"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </div>
        <div className="md:w-48">
          <label htmlFor="inquiry-status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="inquiry-status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500" role="status">
          Loading inquiries…
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            {hasFilters ? 'No inquiries match this search and filter.' : 'No inquiries yet.'}
          </p>
        </div>
      ) : null}

      {!loading && !error && inquiries.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Customer inquiries</caption>
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="border-t border-slate-200">
                    <td className="max-w-[12rem] break-words px-4 py-3 text-slate-900">{inquiry.customerName}</td>
                    <td className="max-w-[12rem] break-words px-4 py-3 text-slate-700">{inquiry.customerContact}</td>
                    <td className="max-w-[16rem] break-words px-4 py-3 text-slate-700">{inquiry.subject}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inquiry.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatCreatedAt(inquiry.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/inquiries/${inquiry.id}`}
                        className="font-medium text-teal-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{inquiry.customerName}</p>
                    <p className="mt-1 text-sm text-slate-600">{inquiry.customerContact}</p>
                  </div>
                  <StatusBadge status={inquiry.status} />
                </div>
                <p className="mt-3 text-sm text-slate-800">{inquiry.subject}</p>
                <p className="mt-2 text-xs text-slate-500">{formatCreatedAt(inquiry.createdAt)}</p>
                <Link
                  to={`/inquiries/${inquiry.id}`}
                  className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                >
                  View details
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
