(function () {
  var form = document.getElementById('form');
  var content = document.getElementById('content');
  var ttl = document.getElementById('ttl');
  var views = document.getElementById('views');
  var errEl = document.getElementById('error');
  var successEl = document.getElementById('success');
  var submitBtn = document.getElementById('submit-btn');
  var urlDisplay = document.getElementById('url-display');
  var copyBtn = document.getElementById('copy-btn');
  var copyMsg = document.getElementById('copy-msg');
  var openLink = document.getElementById('open-link');
  var againBtn = document.getElementById('again-btn');
  var formWrap = document.getElementById('form-wrap');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    successEl.hidden = true;
    if (formWrap) formWrap.hidden = false;
  }

  function showSuccess(url) {
    errEl.hidden = true;
    form.querySelectorAll('input, textarea').forEach(function (el) { el.disabled = false; });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create paste';
    if (formWrap) formWrap.hidden = true;
    successEl.hidden = false;
    urlDisplay.value = url;
    copyMsg.textContent = '';
    openLink.href = url;
  }

  function hideError() {
    errEl.hidden = true;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Creating…' : 'Create paste';
    form.querySelectorAll('input, textarea').forEach(function (el) { el.disabled = loading; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var body = { content: content.value.trim() };
    var ttlVal = ttl.value.trim();
    var viewsVal = views.value.trim();
    if (ttlVal) body.ttl_seconds = parseInt(ttlVal, 10);
    if (viewsVal) body.max_views = parseInt(viewsVal, 10);

    setLoading(true);
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
        setLoading(false);
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
        setLoading(false);
        showError('Something went wrong. Please try again.');
      });
  });

  copyBtn.addEventListener('click', function () {
    var url = urlDisplay.value;
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

  againBtn.addEventListener('click', function () {
    successEl.hidden = true;
    if (formWrap) formWrap.hidden = false;
    form.reset();
    copyMsg.textContent = '';
    hideError();
  });
})();
