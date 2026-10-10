var runtime;
async function startup(data) {
  await Zotero.initializationPromise;
  Services.scriptloader.loadSubScript(data.rootURI + 'runtime.js', globalThis);
  runtime = EngramWeave.createRuntime(data);
  try { await runtime.start(); } catch (error) { await runtime.stop(); runtime = null; throw error; }
}
async function shutdown() { if (runtime) await runtime.stop(); runtime = null; }
function install() {}
function uninstall() {}
function onMainWindowLoad({ window }) { runtime?.loadWindow(window); }
function onMainWindowUnload({ window }) { runtime?.unloadWindow(window); }
