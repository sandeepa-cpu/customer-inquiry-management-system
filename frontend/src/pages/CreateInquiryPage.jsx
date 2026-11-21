import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, createInquiry } from '../api.js';

const LIMITS = {
  customerName: 200,
  customerContact: 200,
  subject: 200,
  description: 5000,
};

function validate(values) {
  const errors = {};
  for (const [name, max] of Object.entries(LIMITS)) {
    const trimmed = values[name].trim();
    if (!trimmed) {
      errors[name] = 'This field is required.';
    } else if (trimmed.length > max) {
      errors[name] = `Must be ${max} characters or fewer.`;
    }
  }
  return errors;
}

export function CreateInquiryPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    customerName: '',
    customerContact: '',
    subject: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const data = await createInquiry({
        customerName: values.customerName.trim(),
        customerContact: values.customerContact.trim(),
        subject: values.subject.trim(),
        description: values.description.trim(),
      });
      const id = data?.inquiry?.id;
      if (!id) {
        setFormError('Inquiry was created but no id was returned.');
        return;
      }
      navigate(`/inquiries/${id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      setFormError(err instanceof ApiError ? err.message : 'Unable to reach the server.');
    } finally {
      setSubmitting(false);
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
      <h1 className="text-2xl font-semibold text-slate-900">Create inquiry</h1>
      <p className="text-sm text-slate-500">
        Enter the customer details. Status is set to New automatically. All fields are required.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {formError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-slate-700">
            Customer name
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            maxLength={LIMITS.customerName}
            value={values.customerName}
            onChange={(event) => updateField('customerName', event.target.value)}
            aria-invalid={Boolean(fieldErrors.customerName)}
            aria-describedby={fieldErrors.customerName ? 'customerName-error' : undefined}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
          {fieldErrors.customerName ? (
            <p id="customerName-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.customerName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="customerContact" className="block text-sm font-medium text-slate-700">
            Customer contact
          </label>
          <input
            id="customerContact"
            name="customerContact"
            type="text"
            maxLength={LIMITS.customerContact}
            value={values.customerContact}
            onChange={(event) => updateField('customerContact', event.target.value)}
            aria-invalid={Boolean(fieldErrors.customerContact)}
            aria-describedby={fieldErrors.customerContact ? 'customerContact-error' : undefined}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
          {fieldErrors.customerContact ? (
            <p id="customerContact-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.customerContact}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            maxLength={LIMITS.subject}
            value={values.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            aria-invalid={Boolean(fieldErrors.subject)}
            aria-describedby={fieldErrors.subject ? 'subject-error' : undefined}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
          {fieldErrors.subject ? (
            <p id="subject-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.subject}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={LIMITS.description}
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
          {fieldErrors.description ? (
            <p id="description-error" className="mt-1 text-sm text-red-700">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Saving…' : 'Create inquiry'}
        </button>
      </form>
    </section>
  );
}
