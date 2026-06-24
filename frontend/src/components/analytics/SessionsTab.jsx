const formatDuration = (ms = 0) => {
  if (!ms) return "0s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

export const SessionsTab = ({
    sessions,
    selectedSession,
    selectedSessionId,
    sessionSummary,
    journeyPath,
    pageStats,
    fetchSessionJourney,
}) => {
  return (
    <div className="dashboard-grid">

      {/* Main Content - Detailed Journey */}
      <div className="dashboard-card">
        <h3>
          {selectedSession
            ? `Session ${selectedSession.sessionId.slice(0, 8)}`
            : "Session Details"}
        </h3>

        {!selectedSessionId ? (
          <p className="muted">Select a session.</p>
        ) : (
          <>
            <div className="session-summary">
              <div className="stat-mini">
                <span>Pages</span>
                <strong>{sessionSummary?.pageViews || 0}</strong>
              </div>

              <div className="stat-mini">
                <span>Clicks</span>
                <strong>{sessionSummary?.clicks || 0}</strong>
              </div>

              <div className="stat-mini">
                <span>CTAs</span>
                <strong>{sessionSummary?.ctas || 0}</strong>
              </div>

              <div className="stat-mini">
                <span>Time</span>
                <strong>{formatDuration(sessionSummary?.timeSpent)}</strong>
              </div>
            </div>

            <div className="dashboard-card journey-card">
              <h4>Journey</h4>

              <div className="journey-path">
                {journeyPath.length ? (
                  journeyPath.map((page, index) => (
                    <div
                      key={`${page}-${index}`}
                      className="journey-node"
                    >
                      {page}
                    </div>
                  ))
                ) : (
                  <p className="muted">No journey data.</p>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h4>Page Breakdown</h4>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Views</th>
                      <th>Clicks</th>
                      <th>CTAs</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageStats.map(page => (
                      <tr key={page.page}>
                        <td>{page.page}</td>
                        <td>{page.views}</td>
                        <td>{page.clicks}</td>
                        <td>{page.ctas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar - Sessions */}
      <aside className="dashboard-card">
        <h3>Sessions</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                {/* <th>Events</th> */}
                <th>CTA</th>
                <th>Time</th>
                <th>Last active</th>
              </tr>
            </thead>

            <tbody>
              {sessions.length ? (
                sessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    className={`clickable ${
                      selectedSessionId === session.sessionId
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      fetchSessionJourney(session.sessionId)
                    }
                  >
                    <td>{session.sessionId.slice(0, 8)}...</td>
                    {/* <td>{session.totalEvents}</td> */}
                    <td>{session.ctaClicks || 0}</td>
                    <td>{formatDuration(session.timeSpentMs)}</td>
                    <td>
                      {new Date(
                        session.lastActive
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </aside>

    </div>
  )
}