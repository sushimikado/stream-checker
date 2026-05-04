fetch('/api/live')
  .then(res => res.text())
  .then(html => {
    document.getElementById('live').innerHTML = html;
  });

fetch('/api/members')
  .then(res => res.text())
  .then(html => {
    document.getElementById('members').innerHTML = html;
  });
