"use client";

import { useState, type FormEvent } from "react";

interface User {
  id: string;
  name: string;
  employeeId: string;
  role: "관리자" | "운영자";
}

let nextId = 11;

const INITIAL_USERS: User[] = [
  { id: "1", name: "김민준", employeeId: "EMP1001", role: "관리자" },
  { id: "2", name: "이서연", employeeId: "EMP1002", role: "운영자" },
  { id: "3", name: "박도윤", employeeId: "EMP1003", role: "운영자" },
  { id: "4", name: "최지우", employeeId: "EMP1004", role: "운영자" },
  { id: "5", name: "정하준", employeeId: "EMP1005", role: "관리자" },
  { id: "6", name: "강서준", employeeId: "EMP1006", role: "운영자" },
  { id: "7", name: "조은우", employeeId: "EMP1007", role: "운영자" },
  { id: "8", name: "윤지호", employeeId: "EMP1008", role: "운영자" },
  { id: "9", name: "임수아", employeeId: "EMP1009", role: "운영자" },
  { id: "10", name: "한예준", employeeId: "EMP1010", role: "관리자" },
];

type Mode = null | "add" | "edit";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<{ name: string; employeeId: string; role: User["role"] }>({
    name: "",
    employeeId: "",
    role: "운영자",
  });

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const adminCount = users.filter((u) => u.role === "관리자").length;
  const operatorCount = users.filter((u) => u.role === "운영자").length;

  function openAdd() {
    setForm({ name: "", employeeId: "", role: "운영자" });
    setMode("add");
  }

  function openEdit() {
    if (!selectedUser) return;
    setForm({ name: selectedUser.name, employeeId: selectedUser.employeeId, role: selectedUser.role });
    setMode("edit");
  }

  function handleDelete() {
    if (!selectedId) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedId));
    setSelectedId(null);
    setMode(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const employeeId = form.employeeId.trim();
    if (!name || !employeeId) return;

    if (mode === "add") {
      setUsers((prev) => [...prev, { id: String(nextId++), name, employeeId, role: form.role }]);
    } else if (mode === "edit" && selectedId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedId ? { ...u, name, employeeId, role: form.role } : u))
      );
    }
    setMode(null);
  }

  const fieldClass =
    "rounded-sm border border-grid bg-panel px-2.5 py-1.5 text-sm text-text outline-none focus:border-signal focus:ring-1 focus:ring-signal/50";
  const navBtnClass =
    "flex items-center gap-2 rounded-sm border border-grid px-3 py-2 text-left text-sm text-muted transition-colors hover:border-signal/50 hover:text-signal disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-grid disabled:hover:text-muted";

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">System / Access</div>
        <h1 className="font-hud text-3xl text-text">사용자 관리</h1>
      </div>

      <div className="grid grid-cols-1 divide-y divide-grid rounded-sm border border-grid bg-panel sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        <div className="p-4">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">전체</div>
          <div className="mt-1 font-hud text-2xl text-signal">{users.length}명</div>
        </div>
        <div className="p-4">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">관리자</div>
          <div className="mt-1 font-hud text-2xl text-text">{adminCount}명</div>
        </div>
        <div className="p-4">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">운영자</div>
          <div className="mt-1 font-hud text-2xl text-text">{operatorCount}명</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-6 sm:flex-row sm:items-start">
        <aside className="flex flex-col gap-2 rounded-sm border border-grid bg-panel p-3 sm:w-60 sm:shrink-0">
          <button onClick={openAdd} className={navBtnClass}>
            <span>＋</span>
            <span>사용자 추가</span>
          </button>
          <button onClick={openEdit} disabled={!selectedUser} className={navBtnClass}>
            <span>✎</span>
            <span>사용자 수정</span>
          </button>
          <button onClick={handleDelete} disabled={!selectedUser} className={navBtnClass}>
            <span>×</span>
            <span>사용자 삭제</span>
          </button>

          {mode && (
            <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 border-t border-grid pt-3">
              <div className="font-readout text-xs uppercase tracking-widest text-signal">
                {mode === "add" ? "사용자 추가" : "사용자 수정"}
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="이름"
                className={fieldClass}
              />
              <input
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="사번"
                className={fieldClass}
              />
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User["role"] }))}
                className={fieldClass}
              >
                <option value="관리자">관리자</option>
                <option value="운영자">운영자</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-sm border border-signal/50 bg-signal/10 p-1.5 text-sm text-signal">
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex-1 rounded-sm border border-grid p-1.5 text-sm text-muted hover:text-text"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </aside>

        <div className="flex-1 overflow-hidden rounded-sm border border-grid">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-grid bg-panel-raised text-left font-readout text-xs uppercase tracking-wider text-muted">
                <th className="w-8 p-3"></th>
                <th className="p-3 font-normal">이름</th>
                <th className="p-3 font-normal">사번</th>
                <th className="p-3 font-normal">권한</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedId(user.id)}
                  className={`cursor-pointer border-b border-grid bg-panel last:border-0 hover:bg-panel-raised ${
                    selectedId === user.id ? "bg-panel-raised" : ""
                  }`}
                >
                  <td className="p-3">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full border ${
                        selectedId === user.id ? "border-signal bg-signal shadow-[0_0_6px_var(--color-signal)]" : "border-grid-bright"
                      }`}
                    />
                  </td>
                  <td className="p-3 text-text">{user.name}</td>
                  <td className="p-3 font-readout text-muted">{user.employeeId}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs ${
                        user.role === "관리자"
                          ? "border border-signal/40 bg-signal/10 text-signal"
                          : "border border-grid-bright text-muted"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
