export function getCountdown(target, now = Date.now()) {
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const total = Math.ceil(remaining / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
    reached: remaining === 0,
  };
}

export function formatLaunch(target) {
  const date = new Date(target);
  const options = { timeZone: 'Europe/Moscow' };
  const day = new Intl.DateTimeFormat('ru-RU', { ...options, day: 'numeric', month: 'long', year: 'numeric' }).format(date).replace(/\s*г\.$/, '');
  const time = new Intl.DateTimeFormat('ru-RU', { ...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${day} · ${time} МСК`;
}
