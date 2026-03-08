import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { NewApiLog, NewApiLogStats, NewApiStatus, NewApiTask } from '../../services/newApiService';
import { LogView } from './types';
import { formatDateTime, formatQuota } from './utils';
import { EmptyState, SectionCard, StatCard } from './ui';

interface LogsPanelProps {
  status: NewApiStatus | null;
  logView: LogView;
  setLogView: React.Dispatch<React.SetStateAction<LogView>>;
  logs: NewApiLog[];
  logsLoading: boolean;
  logStats: NewApiLogStats | null;
  logType: number;
  setLogType: React.Dispatch<React.SetStateAction<number>>;
  logStart: string;
  setLogStart: React.Dispatch<React.SetStateAction<string>>;
  logEnd: string;
  setLogEnd: React.Dispatch<React.SetStateAction<string>>;
  logChannelId: string;
  setLogChannelId: React.Dispatch<React.SetStateAction<string>>;
  logTokenName: string;
  setLogTokenName: React.Dispatch<React.SetStateAction<string>>;
  logModelName: string;
  setLogModelName: React.Dispatch<React.SetStateAction<string>>;
  logPage: number;
  logPageSize: number;
  logTotal: number;
  onUsageSearch: () => Promise<void>;
  onUsagePageChange: (page: number) => Promise<void>;
  tasks: NewApiTask[];
  tasksLoading: boolean;
  taskStart: string;
  setTaskStart: React.Dispatch<React.SetStateAction<string>>;
  taskEnd: string;
  setTaskEnd: React.Dispatch<React.SetStateAction<string>>;
  taskTaskId: string;
  setTaskTaskId: React.Dispatch<React.SetStateAction<string>>;
  taskStatus: string;
  setTaskStatus: React.Dispatch<React.SetStateAction<string>>;
  taskPlatform: string;
  setTaskPlatform: React.Dispatch<React.SetStateAction<string>>;
  taskPage: number;
  taskPageSize: number;
  taskTotal: number;
  onTaskSearch: () => Promise<void>;
  onTaskPageChange: (page: number) => Promise<void>;
}

const inputClassName = 'rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 outline-none transition-colors focus:border-[var(--accent)]';

const formatTaskDuration = (submitTime?: number, finishTime?: number) => {
  if (!submitTime || !finishTime || finishTime < submitTime) return '—';
  const totalSeconds = Math.max(0, Math.floor(finishTime - submitTime));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const normalizeTaskStatus = (value?: string) => {
  switch (String(value || '').toUpperCase()) {
    case 'NOT_START':
      return { label: '未开始', className: 'bg-slate-500/10 text-slate-300 border border-slate-500/30' };
    case 'SUBMITTED':
    case 'QUEUED':
      return { label: '排队中', className: 'bg-sky-500/10 text-sky-300 border border-sky-500/30' };
    case 'IN_PROGRESS':
      return { label: '进行中', className: 'bg-amber-500/10 text-amber-300 border border-amber-500/30' };
    case 'SUCCESS':
      return { label: '成功', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' };
    case 'FAILURE':
      return { label: '失败', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/30' };
    default:
      return { label: value || '未知', className: 'bg-slate-500/10 text-slate-300 border border-slate-500/30' };
  }
};

const normalizeTaskAction = (value?: string) => {
  const action = String(value || '').toLowerCase();
  switch (action) {
    case 'generate':
    case 'text_generate':
      return '文生视频';
    case 'image_generate':
      return '图生视频';
    case 'reference_generate':
      return '参考生视频';
    case 'first_tail_generate':
      return '首尾帧视频';
    case 'remix_generate':
      return '视频重混';
    default:
      return value || '—';
  }
};

const normalizePlatform = (value?: string) => {
  const platform = String(value || '').trim();
  if (!platform) return '—';
  const lower = platform.toLowerCase();
  const mapping: Record<string, string> = {
    openai: 'OpenAI',
    sora: 'Sora',
    kling: 'Kling',
    jimeng: '即梦',
    vidu: 'Vidu',
    gemini: 'Gemini',
    doubao: '豆包',
    suno: 'Suno',
  };
  return mapping[lower] || platform;
};

const parseProgressValue = (value?: string) => {
  if (!value) return null;
  const raw = String(value).trim();
  const normalized = raw.endsWith('%') ? raw.slice(0, -1) : raw;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  if (numeric <= 1 && raw.includes('.')) {
    return Math.max(0, Math.min(100, Math.round(numeric * 100)));
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const TaskProgress: React.FC<{ status?: string; progress?: string }> = ({ status, progress }) => {
  const percent = parseProgressValue(progress);
  if (percent === null) {
    return <span className="text-sm text-[var(--text-secondary)]">{progress || '—'}</span>;
  }

  const barClassName = String(status || '').toUpperCase() === 'FAILURE' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="flex min-w-[160px] items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-hover)]">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="whitespace-nowrap text-xs font-medium text-[var(--text-secondary)]">{percent}%</span>
    </div>
  );
};

export const LogsPanel: React.FC<LogsPanelProps> = ({
  status,
  logView,
  setLogView,
  logs,
  logsLoading,
  logStats,
  logType,
  setLogType,
  logStart,
  setLogStart,
  logEnd,
  setLogEnd,
  logChannelId,
  setLogChannelId,
  logTokenName,
  setLogTokenName,
  logModelName,
  setLogModelName,
  logPage,
  logPageSize,
  logTotal,
  onUsageSearch,
  onUsagePageChange,
  tasks,
  tasksLoading,
  taskStart,
  setTaskStart,
  taskEnd,
  setTaskEnd,
  taskTaskId,
  setTaskTaskId,
  taskStatus,
  setTaskStatus,
  taskPlatform,
  setTaskPlatform,
  taskPage,
  taskPageSize,
  taskTotal,
  onTaskSearch,
  onTaskPageChange,
}) => {
  const usageTotalPages = Math.max(1, Math.ceil(logTotal / logPageSize));
  const taskTotalPages = Math.max(1, Math.ceil(taskTotal / taskPageSize));
  const taskSuccessCount = tasks.filter((task) => String(task.status || '').toUpperCase() === 'SUCCESS').length;
  const taskFailureCount = tasks.filter((task) => String(task.status || '').toUpperCase() === 'FAILURE').length;
  const taskRunningCount = tasks.filter((task) => ['NOT_START', 'SUBMITTED', 'QUEUED', 'IN_PROGRESS'].includes(String(task.status || '').toUpperCase())).length;

  return (
    <div className="space-y-6">
      <SectionCard
        title={logView === 'usage' ? '使用日志' : '任务日志'}
        description={logView === 'usage'
          ? '按时间、令牌、模型和渠道筛选后，快速确认消费与报错来源。'
          : '查看异步任务的提交时间、执行进度、任务状态与结果链接。'}
        action={(
          <button
            onClick={logView === 'usage' ? () => void onUsageSearch() : () => void onTaskSearch()}
            disabled={logView === 'usage' ? logsLoading : tasksLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--btn-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)] disabled:opacity-60"
          >
            {(logView === 'usage' ? logsLoading : tasksLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {logView === 'usage' ? '查询使用日志' : '查询任务日志'}
          </button>
        )}
      >
        <div className="space-y-5">
          <div className="inline-flex rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1">
            <button
              type="button"
              onClick={() => setLogView('usage')}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${logView === 'usage' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              使用日志
            </button>
            <button
              type="button"
              onClick={() => setLogView('tasks')}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${logView === 'tasks' ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              任务日志
            </button>
          </div>

          {logView === 'usage' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <select
                value={logType}
                onChange={(event) => setLogType(Number(event.target.value))}
                className={inputClassName}
              >
                <option value={2}>消费日志</option>
                <option value={4}>错误日志</option>
                <option value={5}>系统日志</option>
                <option value={1}>充值日志</option>
              </select>
              <input
                type="datetime-local"
                value={logStart}
                onChange={(event) => setLogStart(event.target.value)}
                className={inputClassName}
              />
              <input
                type="datetime-local"
                value={logEnd}
                onChange={(event) => setLogEnd(event.target.value)}
                className={inputClassName}
              />
              <input
                value={logChannelId}
                onChange={(event) => setLogChannelId(event.target.value)}
                placeholder="按渠道 ID 筛选"
                className={inputClassName}
              />
              <input
                value={logTokenName}
                onChange={(event) => setLogTokenName(event.target.value)}
                placeholder="按令牌名称筛选"
                className={inputClassName}
              />
              <input
                value={logModelName}
                onChange={(event) => setLogModelName(event.target.value)}
                placeholder="按模型名称筛选"
                className={inputClassName}
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="datetime-local"
                value={taskStart}
                onChange={(event) => setTaskStart(event.target.value)}
                className={inputClassName}
              />
              <input
                type="datetime-local"
                value={taskEnd}
                onChange={(event) => setTaskEnd(event.target.value)}
                className={inputClassName}
              />
              <input
                value={taskTaskId}
                onChange={(event) => setTaskTaskId(event.target.value)}
                placeholder="按任务 ID 筛选"
                className={inputClassName}
              />
              <input
                value={taskPlatform}
                onChange={(event) => setTaskPlatform(event.target.value)}
                placeholder="按平台筛选，例如 openai"
                className={inputClassName}
              />
              <select
                value={taskStatus}
                onChange={(event) => setTaskStatus(event.target.value)}
                className={inputClassName}
              >
                <option value="">全部状态</option>
                <option value="NOT_START">未开始</option>
                <option value="SUBMITTED">已提交</option>
                <option value="QUEUED">排队中</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="SUCCESS">成功</option>
                <option value="FAILURE">失败</option>
              </select>
            </div>
          )}
        </div>
      </SectionCard>

      {logView === 'usage' ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="消费额度" value={formatQuota(logStats?.quota, status)} hint="当前筛选条件下的总消耗" />
            <StatCard label="RPM" value={logStats?.rpm ?? 0} hint="每分钟请求速率" />
            <StatCard label="TPM" value={logStats?.tpm ?? 0} hint="每分钟 Token 消耗量" />
          </div>

          <SectionCard title="日志明细" description="保留时间、令牌、模型和输入输出，方便快速确认消耗来源。">
            {logsLoading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[var(--text-tertiary)]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <EmptyState title="暂无日志" description="你可以先调整时间范围、令牌名称、模型名称或渠道 ID，再重新查询。" />
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[var(--border-primary)]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">时间</th>
                      <th className="px-4 py-3 text-left font-medium">令牌</th>
                      <th className="px-4 py-3 text-left font-medium">模型</th>
                      <th className="px-4 py-3 text-left font-medium">输入 / 输出</th>
                      <th className="px-4 py-3 text-left font-medium">花费</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-[var(--border-primary)] align-top">
                        <td className="whitespace-nowrap px-4 py-3">{formatDateTime(log.created_at)}</td>
                        <td className="px-4 py-3">{log.token_name || '—'}</td>
                        <td className="px-4 py-3">{log.model_name || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{log.prompt_tokens ?? 0} / {log.completion_tokens ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatQuota(log.quota, status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {logTotal > logPageSize && (
              <div className="mt-5 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>第 {logPage} / {usageTotalPages} 页，共 {logTotal} 条</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => void onUsagePageChange(Math.max(1, logPage - 1))}
                    disabled={logPage <= 1}
                    className="rounded-xl border border-[var(--border-primary)] px-3 py-2 disabled:opacity-40"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => void onUsagePageChange(Math.min(usageTotalPages, logPage + 1))}
                    disabled={logPage >= usageTotalPages}
                    className="rounded-xl border border-[var(--border-primary)] px-3 py-2 disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="任务总数" value={taskTotal} hint="当前筛选条件下的总任务数" />
            <StatCard label="本页成功" value={taskSuccessCount} hint="当前列表中的已完成任务" />
            <StatCard label="本页进行中" value={taskRunningCount} hint="当前列表中的排队或执行中任务" />
            <StatCard label="本页失败" value={taskFailureCount} hint="当前列表中的失败任务" />
          </div>

          <SectionCard title="任务明细" description="支持查看异步任务的状态、进度、耗时和结果链接。">
            {tasksLoading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[var(--text-tertiary)]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState title="暂无任务" description="你可以先调整时间范围、任务 ID、平台或状态，再重新查询。" />
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[var(--border-primary)]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">提交时间</th>
                      <th className="px-4 py-3 text-left font-medium">完成时间</th>
                      <th className="px-4 py-3 text-left font-medium">耗时</th>
                      <th className="px-4 py-3 text-left font-medium">平台</th>
                      <th className="px-4 py-3 text-left font-medium">类型</th>
                      <th className="px-4 py-3 text-left font-medium">任务 ID</th>
                      <th className="px-4 py-3 text-left font-medium">任务状态</th>
                      <th className="px-4 py-3 text-left font-medium">进度</th>
                      <th className="px-4 py-3 text-left font-medium">详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const statusMeta = normalizeTaskStatus(task.status);
                      const resultUrl = typeof task.result_url === 'string' && /^https?:\/\//.test(task.result_url) ? task.result_url : '';
                      return (
                        <tr key={task.id} className="border-t border-[var(--border-primary)] align-top">
                          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(task.submit_time)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(task.finish_time)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{formatTaskDuration(task.submit_time, task.finish_time)}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                              {normalizePlatform(task.platform)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{normalizeTaskAction(task.action)}</td>
                          <td className="max-w-[260px] px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                            <div className="break-all">{task.task_id || '—'}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <TaskProgress status={task.status} progress={task.progress} />
                          </td>
                          <td className="px-4 py-3">
                            {resultUrl ? (
                              <a className="text-[var(--accent)] hover:underline" href={resultUrl} target="_blank" rel="noreferrer">
                                查看结果
                              </a>
                            ) : task.fail_reason ? (
                              <span className="block max-w-[240px] truncate text-rose-400" title={task.fail_reason}>
                                {task.fail_reason}
                              </span>
                            ) : (
                              <span className="text-[var(--text-tertiary)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {taskTotal > taskPageSize && (
              <div className="mt-5 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>第 {taskPage} / {taskTotalPages} 页，共 {taskTotal} 条</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => void onTaskPageChange(Math.max(1, taskPage - 1))}
                    disabled={taskPage <= 1}
                    className="rounded-xl border border-[var(--border-primary)] px-3 py-2 disabled:opacity-40"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => void onTaskPageChange(Math.min(taskTotalPages, taskPage + 1))}
                    disabled={taskPage >= taskTotalPages}
                    className="rounded-xl border border-[var(--border-primary)] px-3 py-2 disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};
