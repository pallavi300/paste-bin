(function () {
  var form = document.getElementById('form');
  var content = document.getElementById('content');
  var ttl = document.getElementById('ttl');
  var views = document.getElementById('views');
  var errEl = document.getElementById('error');
  var successEl = document.getElementById('success');
  var pasteLink = document.getElementById('paste-link');
  var copyBtn = document.getElementById('copy-btn');
  var copyMsg = document.getElementById('copy-msg');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    successEl.hidden = true;
  }

  function showSuccess(url) {
    errEl.hidden = true;
    successEl.hidden = false;
    pasteLink.href = url;
    pasteLink.textContent = url;
    copyMsg.textContent = '';
  }

  function hideError() {
    errEl.hidden = true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var body = { content: content.value.trim() };
    var ttlVal = ttl.value.trim();
    var viewsVal = views.value.trim();
    if (ttlVal) body.ttl_seconds = parseInt(ttlVal, 10);
    if (viewsVal) body.max_views = parseInt(viewsVal, 10);

    fetch('/api/pastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { status: r.status, json: j };
        });
      })
      .then(function (res) {
        var status = res.status;
        var json = res.json;
        if (status >= 200 && status < 300 && json.url) {
          showSuccess(json.url);
          return;
        }
        var msg = (json && json.details) ? json.details : (json && json.error) ? json.error : 'Invalid input';
        showError(msg);
      })
      .catch(function () {
        showError('Something went wrong. Please try again.');
      });
  });

  copyBtn.addEventListener('click', function () {
    var url = pasteLink.href;
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      function () {
        copyMsg.textContent = 'Copied!';
      },
      function () {
        copyMsg.textContent = 'Copy failed';
      }
    );
  });
})();
