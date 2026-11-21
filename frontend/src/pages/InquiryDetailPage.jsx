import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getInquiry, updateInquiryStatus } from '../api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export function InquiryDetailPage() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setSaveError('');
    setSaveSuccess('');
    try {
      const data = await getInquiry(id);
      setInquiry(data.inquiry);
      setStatus(data.inquiry.status);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      setInquiry(null);
      setLoadError(err instanceof ApiError ? err.message : 'Unable to reach the server.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusSave(event) {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setSaving(true);
    try {
      const data = await updateInquiryStatus(id, status);
      setInquiry(data.inquiry);
      setStatus(data.inquiry.status);
      setSaveSuccess('Status updated.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      setSaveError(err instanceof ApiError ? err.message : 'Unable to reach the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <Link
        to="/"
        className="text-sm font-medium text-teal-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
      >
        Back to dashboard
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Inquiry details</h1>
        {!loading && inquiry ? (
          <button
            type="button"
            onClick={load}
            className="self-start rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            Reload
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500" role="status">
          Loading inquiry…
        </p>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !loadError && inquiry ? (
        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Customer name</dt>
              <dd className="mt-1 break-words text-sm text-slate-900">{inquiry.customerName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Customer contact</dt>
              <dd className="mt-1 break-words text-sm text-slate-900">{inquiry.customerContact}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Subject</dt>
              <dd className="mt-1 break-words text-sm text-slate-900">{inquiry.subject}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{inquiry.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Current status</dt>
              <dd className="mt-1">
                <StatusBadge status={inquiry.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created by</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {inquiry.createdBy?.name ?? 'Unknown'}
                {inquiry.createdBy?.email ? ` (${inquiry.createdBy.email})` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(inquiry.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Updated</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(inquiry.updatedAt)}</dd>
            </div>
          </dl>

          <form onSubmit={handleStatusSave} className="space-y-3 border-t border-slate-200 pt-4">
            <div>
              <label htmlFor="inquiry-status" className="block text-sm font-medium text-slate-700">
                Update status
              </label>
              <select
                id="inquiry-status"
                name="status"
                value={status}
                disabled={saving}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            {saveError ? (
              <p className="text-sm text-red-700" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveSuccess ? (
              <p className="text-sm text-emerald-700" role="status">
                {saveSuccess}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              If this inquiry is open in another tab, reload to see the latest status. The last saved status wins.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
