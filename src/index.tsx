import './fonts.css'
import './framework/styles.css'
import Assembly from './framework/assembly'
import { Bridge } from './framework/types/modules'
import LiveBridge from './live_bridge'
import FakeBridge from './fake_bridge'

const rootElement = document.getElementById('root') as HTMLElement

const workerFile = new URL('./framework/processing/py_worker.js', import.meta.url)
const worker = new Worker(workerFile)

let assembly: Assembly

const run = (bridge: Bridge, locale: string): void => {
  try {
    assembly = new Assembly(worker, bridge)
    assembly.visualisationEngine.start(rootElement, locale)
    assembly.processingEngine.start()
  } catch (error) {
    console.error('Failed to initialize application:', error)
    // Show error message to user
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application. Please try refreshing the page.</p>
        <p>If the problem persists, please contact support.</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `
  }
}

// Add error handler for worker
worker.onerror = (error) => {
  console.error('Worker error:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Worker Error</h1>
      <p>Failed to initialize the Python worker. Please try refreshing the page.</p>
      <p>If the problem persists, please contact support.</p>
      <pre>${error.message}</pre>
    </div>
  `
}

if (false) { // Always run in standalone mode for Netlify deployment
  // Setup embedded mode (requires to be embedded in iFrame)
  console.log('Initializing bridge system')
  LiveBridge.create(window, run)
} else {
  // Setup local development mode
  console.log('Running with fake bridge')
  run(new FakeBridge(), 'en')
}

const observer = new ResizeObserver(() => {
  const height = window.document.body.scrollHeight
  const action = 'resize'
  window.parent.postMessage({ action, height }, '*')
})

observer.observe(window.document.body)
