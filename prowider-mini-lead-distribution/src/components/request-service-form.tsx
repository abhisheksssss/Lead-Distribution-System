'use client'

import { useMemo, useState } from 'react'

import type { CreateLeadResult, Service } from '@/lib/types'

type RequestServiceFormProps = {
  services: Service[]
}

type FormState = {
  name: string
  phoneNumber: string
  city: string
  serviceId: string
  description: string
}

const initialFormState: FormState = {
  name: '',
  phoneNumber: '',
  city: '',
  serviceId: '',
  description: '',
}

export function RequestServiceForm({ services }: RequestServiceFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialFormState,
    serviceId: services[0]?.id ? String(services[0].id) : '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<CreateLeadResult | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const selectedServiceLabel = useMemo(
    () => services.find((service) => String(service.id) === form.serviceId)?.name ?? 'Selected service',
    [form.serviceId, services],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)
    setSuccessResult(null)

    // Final client-side validation
    const validation = validateAll()
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      setSubmitting(false)
      setErrorMessage('Please fix the highlighted fields.')
      return
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          phoneNumber: form.phoneNumber,
          city: form.city,
          serviceId: Number(form.serviceId),
          description: form.description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Lead creation failed.')
      }

      setSuccessResult(data.data)
      setForm({
        ...initialFormState,
        serviceId: services[0]?.id ? String(services[0].id) : '',
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Lead creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return 'Phone number is required.'
    if (!/^\d{7,15}$/.test(digits)) return 'Enter a valid phone number (7–15 digits).'
    return ''
  }

  function validateAll() {
    const errors: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    const phoneErr = validatePhone(form.phoneNumber)
    if (phoneErr) errors.phoneNumber = phoneErr
    if (!form.city.trim()) errors.city = 'City is required.'
    if (!form.serviceId) errors.serviceId = 'Please select a service.'
    if (!form.description.trim()) errors.description = 'Please add a short description.'
    if (form.description.length > 500) errors.description = 'Description must be 500 characters or fewer.'
    return { valid: Object.keys(errors).length === 0, errors }
  }

  return (
    <div className="grid-2">
      <section className="panel stack-md">
        <div className="stack-xs">
          <h2>Submit service enquiry</h2>
          <p className="muted">Duplicate protection applies per phone number and service combination.</p>
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Enter your full name"
              required
            />
            {fieldErrors.name ? <p className="small-text" role="alert" style={{ color: 'var(--danger)' }}>✕ {fieldErrors.name}</p> : null}
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input
              value={form.phoneNumber}
              onChange={(event) => updateField('phoneNumber', event.target.value)}
              inputMode="tel"
              placeholder="9999999999"
              required
            />
            {fieldErrors.phoneNumber ? <p className="small-text" role="alert" style={{ color: 'var(--danger)' }}>✕ {fieldErrors.phoneNumber}</p> : null}
          </label>

          <label className="field">
            <span>City</span>
            <input
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              placeholder="Your city"
              required
            />
            {fieldErrors.city ? <p className="small-text" role="alert" style={{ color: 'var(--danger)' }}>✕ {fieldErrors.city}</p> : null}
          </label>

          <label className="field">
            <span>Service Type</span>
            <select value={form.serviceId} onChange={(event) => updateField('serviceId', event.target.value)} required>
              <option value="">— Select a service —</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {fieldErrors.serviceId ? <p className="small-text" role="alert" style={{ color: 'var(--danger)' }}>✕ {fieldErrors.serviceId}</p> : null}
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={5}
              placeholder="Describe your service request in detail…"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
              {fieldErrors.description ? (
                <p className="small-text" role="alert" style={{ color: 'var(--danger)' }}>✕ {fieldErrors.description}</p>
              ) : (
                <p className="small-text">Describe the request briefly</p>
              )}
              <p className="small-text">{form.description.length}/500</p>
            </div>
          </label>

          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
            aria-disabled={submitting}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ fontSize: '0.9rem' }} /> Submitting…
              </>
            ) : (
              'Create lead'
            )}
          </button>
        </form>
      </section>

      <aside className="panel stack-md">
        <div className="stack-xs">
          <h2>What happens next</h2>
          <p className="muted">Lead creation and provider assignment happen inside the same database transaction.</p>
        </div>

        <ol className="list list--ordered">
          <li>The lead is stored in PostgreSQL.</li>
          <li>Mandatory providers are reserved first when quota remains.</li>
          <li>Remaining slots are filled through persistent round-robin rotation.</li>
          <li>Exactly three providers are assigned or the entire request is rolled back.</li>
        </ol>

        <div className="notice notice--soft">
          <strong>Current selection:</strong> {selectedServiceLabel}
        </div>

        {errorMessage ? (
          <div className="notice notice--error slide-in" role="alert">
            <strong>Error:</strong> {errorMessage}
          </div>
        ) : null}

        {successResult ? (
          <div className="notice notice--success stack-sm slide-in" role="status">
            <strong>✓ Lead #{successResult.leadId} created successfully</strong>
            <p style={{ fontSize: '0.95rem' }}>Assigned providers:</p>
            <ul className="list">
              {successResult.assignedProviders.map((provider) => (
                <li key={provider.providerId} style={{ fontWeight: 500 }}>{provider.providerName}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
