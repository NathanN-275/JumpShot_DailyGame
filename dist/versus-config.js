window.JUMPSHOT_API = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:8787'
  : 'https://jumpshot-versus.umpshot.workers.dev';
