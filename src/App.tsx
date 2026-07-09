import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const STORAGE_KEY = 'job-application-tracker:applications'
const DEMO_SEEDED_KEY = 'job-application-tracker:demo-seeded'

const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'] as const

type ApplicationStatus = (typeof STATUSES)[number]

type JobApplication = {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  jobLink: string
  deadline: string
  notes: string
  createdAt: string
}

type ApplicationForm = Omit<JobApplication, 'id' | 'createdAt'>

const emptyForm: ApplicationForm = {
  company: '',
  role: '',
  status: 'Saved',
  jobLink: '',
  deadline: '',
  notes: '',
}

const starterApplications: JobApplication[] = [
  {
    id: 'demo-northstar',
    company: 'Northstar Labs',
    role: 'Frontend Engineer',
    status: 'Interview',
    jobLink: 'https://example.com/northstar-frontend',
    deadline: '2026-07-12',
    notes:
      'First technical screen scheduled. Review React state patterns and prepare two project stories.',
    createdAt: '2026-07-05T09:00:00.000Z',
  },
  {
    id: 'demo-blue-ridge',
    company: 'Blue Ridge Analytics',
    role: 'Product Analyst',
    status: 'Applied',
    jobLink: 'https://example.com/blue-ridge-analyst',
    deadline: '2026-07-15',
    notes:
      'Application submitted through careers page. Follow up with hiring team if no reply this week.',
    createdAt: '2026-07-04T14:30:00.000Z',
  },
  {
    id: 'demo-brightcart',
    company: 'BrightCart',
    role: 'Growth Product Manager',
    status: 'Saved',
    jobLink: 'https://example.com/brightcart-growth-pm',
    deadline: '2026-07-18',
    notes:
      'Need to tailor resume toward marketplace experiments, retention, and onboarding metrics.',
    createdAt: '2026-07-03T17:10:00.000Z',
  },
  {
    id: 'demo-orbit',
    company: 'Orbit Health',
    role: 'UX Researcher',
    status: 'Offer',
    jobLink: 'https://example.com/orbit-ux-researcher',
    deadline: '2026-07-20',
    notes:
      'Offer received. Compare compensation, growth path, and remote policy before responding.',
    createdAt: '2026-07-02T11:15:00.000Z',
  },
  {
    id: 'demo-cedar',
    company: 'Cedar AI',
    role: 'Developer Advocate',
    status: 'Rejected',
    jobLink: 'https://example.com/cedar-dev-advocate',
    deadline: '',
    notes:
      'Rejected after portfolio review. Save feedback for future developer relations applications.',
    createdAt: '2026-06-29T10:00:00.000Z',
  },
]

const createId = () => {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const loadApplications = (): JobApplication[] => {
  try {
    const savedApplications = localStorage.getItem(STORAGE_KEY)
    const demoSeeded = localStorage.getItem(DEMO_SEEDED_KEY) === 'true'

    if (!savedApplications) {
      localStorage.setItem(DEMO_SEEDED_KEY, 'true')
      return starterApplications
    }

    const parsed = JSON.parse(savedApplications)

    if (!Array.isArray(parsed)) {
      return []
    }

    if (parsed.length === 0 && !demoSeeded) {
      localStorage.setItem(DEMO_SEEDED_KEY, 'true')
      return starterApplications
    }

    return parsed
  } catch {
    return []
  }
}

const isPendingFollowUp = (application: JobApplication) => {
  return (
    application.deadline !== '' &&
    application.status !== 'Offer' &&
    application.status !== 'Rejected'
  )
}

const formatDate = (dateValue: string) => {
  if (!dateValue) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`))
}

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(loadApplications)
  const [form, setForm] = useState<ApplicationForm>(emptyForm)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
  }, [applications])

  const stats = useMemo(
    () => ({
      total: applications.length,
      interviews: applications.filter((application) => application.status === 'Interview')
        .length,
      offers: applications.filter((application) => application.status === 'Offer').length,
      pendingFollowUps: applications.filter(isPendingFollowUp).length,
    }),
    [applications],
  )

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'All') {
      return applications
    }

    return applications.filter((application) => application.status === statusFilter)
  }, [applications, statusFilter])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const company = form.company.trim()
    const role = form.role.trim()

    if (!company || !role) {
      return
    }

    const newApplication: JobApplication = {
      ...form,
      id: createId(),
      company,
      role,
      jobLink: form.jobLink.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    }

    setApplications((currentApplications) => [newApplication, ...currentApplications])
    setForm(emptyForm)
  }

  const updateStatus = (id: string, status: ApplicationStatus) => {
    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    )
  }

  const deleteApplication = (id: string) => {
    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.id !== id),
    )
  }

  return (
    <main className="app-shell">
      <section className="app-header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Local-first job search workspace</p>
          <h1 id="page-title">Job Application Tracker</h1>
          <p className="header-copy">
            Keep roles, deadlines, interview stages, and follow-ups in one tidy place.
          </p>
        </div>
        <div className="storage-badge">
          <span aria-hidden="true"></span>
          Saved in this browser
        </div>
      </section>

      <section className="stats-grid" aria-label="Dashboard stats">
        <article className="stat-card">
          <span>Total applications</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <span>Interviews</span>
          <strong>{stats.interviews}</strong>
        </article>
        <article className="stat-card">
          <span>Offers</span>
          <strong>{stats.offers}</strong>
        </article>
        <article className="stat-card">
          <span>Pending follow-ups</span>
          <strong>{stats.pendingFollowUps}</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <form className="application-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <h2>Add application</h2>
            <p>Company and role are required.</p>
          </div>

          <label>
            Company
            <input
              type="text"
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              placeholder="Acme Studio"
              required
            />
          </label>

          <label>
            Role
            <input
              type="text"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              placeholder="Product Designer"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ApplicationStatus })
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Deadline
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              />
            </label>
          </div>

          <label>
            Job link
            <input
              type="url"
              value={form.jobLink}
              onChange={(event) => setForm({ ...form, jobLink: event.target.value })}
              placeholder="https://company.com/careers/role"
            />
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Recruiter name, next steps, interview prep, or reminders"
              rows={5}
            />
          </label>

          <button className="primary-action" type="submit">
            Add application
          </button>
        </form>

        <section className="applications-panel" aria-labelledby="applications-title">
          <div className="list-toolbar">
            <div className="section-heading">
              <h2 id="applications-title">Applications</h2>
              <p>
                Showing {filteredApplications.length} of {applications.length}
              </p>
            </div>

            <label className="filter-control">
              Filter
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ApplicationStatus | 'All')
                }
              >
                <option value="All">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredApplications.length > 0 ? (
            <div className="application-list">
              {filteredApplications.map((application) => (
                <article className="application-card" key={application.id}>
                  <div className="card-topline">
                    <div>
                      <h3>{application.role}</h3>
                      <p>{application.company}</p>
                    </div>
                    <span className={`status-pill status-${application.status.toLowerCase()}`}>
                      {application.status}
                    </span>
                  </div>

                  <div className="card-meta">
                    <span>{formatDate(application.deadline)}</span>
                    {application.jobLink ? (
                      <a href={application.jobLink} target="_blank" rel="noreferrer">
                        Open job
                      </a>
                    ) : (
                      <span>No job link</span>
                    )}
                  </div>

                  {application.notes ? <p className="notes">{application.notes}</p> : null}

                  <div className="card-actions">
                    <label>
                      Update status
                      <select
                        value={application.status}
                        onChange={(event) =>
                          updateStatus(application.id, event.target.value as ApplicationStatus)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="ghost-action"
                      type="button"
                      onClick={() => deleteApplication(application.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No applications here yet</h3>
              <p>
                Add a role or switch the filter to see the jobs you are tracking.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
