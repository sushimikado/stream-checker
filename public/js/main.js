async function load() {
  try {
    const [liveRes, membersRes] = await Promise.all([
      fetch('/api/live'),
      fetch('/api/members')
    ]);

    const liveHtml = await liveRes.text();
    const membersHtml = await membersRes.text();

    document.getElementById('live').innerHTML = liveHtml;
    document.getElementById('members').innerHTML = membersHtml;

  } catch (e) {
    console.error(e);
  }
}

load();