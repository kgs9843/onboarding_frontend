import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

function apiUrl(path: string) {
  const origin = import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  const base = import.meta.env.VITE_API_BASE_PATH.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${base}${suffix}`;
}

function IconCheck() {
  return (
    <svg
      className="row-action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      className="row-action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function App() {
  const [draft, setDraft] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commitInFlightRef = useRef(false);

  const refreshTodos = useCallback(async () => {
    setError(null);
    const res = await fetch(apiUrl('/todos'));
    if (!res.ok) {
      throw new Error('목록을 불러오지 못했습니다.');
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('목록 형식이 올바르지 않습니다.');
    }
    setTodos(
      data.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: Number(row.id),
          text: String(row.text ?? ''),
          completed: Boolean(row.completed),
        };
      }),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshTodos();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTodos]);

  const commitDraft = async () => {
    const text = draft.trim();
    if (!text || commitInFlightRef.current) return;
    commitInFlightRef.current = true;
    setError(null);
    try {
      const res = await fetch(apiUrl('/todos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = typeof body?.error === 'string' ? body.error : '할 일을 추가하지 못했습니다.';
        throw new Error(msg);
      }
      const created = (await res.json()) as Todo;
      setTodos((prev) => [...prev, created]);
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '할 일을 추가하지 못했습니다.');
    } finally {
      commitInFlightRef.current = false;
    }
  };

  const handleAddClick = () => {
    const text = draft.trim();
    if (text) {
      void commitDraft();
    } else {
      inputRef.current?.focus();
    }
  };

  const completeTodo = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/todos/${id}/complete`), {
        method: 'PATCH',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = typeof body?.error === 'string' ? body.error : '완료 처리에 실패했습니다.';
        throw new Error(msg);
      }
      const updated = (await res.json()) as Todo;
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '완료 처리에 실패했습니다.');
    }
  };

  const deleteTodo = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/todos/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = typeof body?.error === 'string' ? body.error : '삭제에 실패했습니다.';
        throw new Error(msg);
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">할 일</h1>
        <p className="subtitle">내용을 적고 할일 추가를 누르면 서버에 저장돼요.</p>
      </header>

      {error ? (
        <p className="empty" role="alert">
          {error}
        </p>
      ) : null}

      <section className="composer" aria-label="할 일 입력">
        <input
          ref={inputRef}
          className="field"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.repeat) return;
            // IME 조합 중 Enter는 조합 확정용이라 무시 (한글 입력 시 중복 생성 방지)
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            void commitDraft();
          }}
          placeholder="할 일을 적어 주세요"
          autoComplete="off"
          disabled={loading}
        />
        <div className="composer-actions">
          <button type="button" className="btn btn-secondary" onClick={handleAddClick} disabled={loading}>
            할일 추가
          </button>
        </div>
      </section>

      <section className="list-section" aria-label="할 일 목록">
        <h2 className="list-heading">목록</h2>
        {loading ? (
          <p className="empty">불러오는 중…</p>
        ) : todos.length === 0 ? (
          <p className="empty">아직 등록된 할 일이 없어요.</p>
        ) : (
          <ul className="list">
            {todos.map((todo) => (
              <li key={todo.id} className={`row${todo.completed ? ' row-done' : ''}`}>
                <p className="row-text">{todo.text}</p>
                <div className="row-actions">
                  <button
                    type="button"
                    className="row-action row-complete"
                    tabIndex={-1}
                    aria-label={todo.completed ? '이미 완료됨' : '완료'}
                    disabled={todo.completed}
                    onClick={(e) => {
                      e.stopPropagation();
                      void completeTodo(todo.id);
                    }}
                  >
                    <IconCheck />
                  </button>
                  <button
                    type="button"
                    className="row-action row-remove"
                    tabIndex={-1}
                    aria-label="삭제"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteTodo(todo.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
