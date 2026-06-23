import type { LogEntry } from '../App';

export default function LiveTransactions({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="log-box">
      {logs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
          No transactions yet.
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className={`log-entry ${log.type}`}>
            <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontSize: '0.75rem' }}>
              [{log.timestamp}]
            </span>
            {log.message}
          </div>
        ))
      )}
    </div>
  );
}
