(function() {
  function getEditorCode() {
    try {
      const model = window.monaco?.editor?.getModels()?.[0];
      if (model) return model.getValue();
    } catch (_) {}
    try {
      const cm = document.querySelector(".CodeMirror");
      if (cm?.CodeMirror) return cm.CodeMirror.getValue();
    } catch (_) {}
    return "";
  }

  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : "";
  }

  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (url.includes("/check/") && url.includes("submissions")) {
        const clone = response.clone();
        clone.json().then(data => {
          if (data?.state === "SUCCESS" || (data?.status_msg && data?.state !== "PENDING" && data?.state !== "RUNNING_TESTS")) {
            window.postMessage({ 
              type: "LEETCOACH_SUBMISSION", 
              data: {
                ...data,
                code: getEditorCode(),
                slug: getProblemSlug(),
              }
            }, "*");
          }
        }).catch(() => {});
      }
    } catch(_) {}
    return response;
  };
})();