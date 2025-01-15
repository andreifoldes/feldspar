import './fonts.css'
import './framework/styles.css'
import Assembly from './framework/assembly'
import { Bridge } from './framework/types/modules'
import LiveBridge from './live_bridge'
import FakeBridge from './fake_bridge'

const rootElement = document.getElementById('root') as HTMLElement

const workerFile = new URL('./framework/processing/py_worker.js', import.meta.url)
const worker = new Worker(workerFile)

// Add error handling for worker
worker.onerror = (error) => {
  console.error('Worker error:', error)
  rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error loading Python worker. Please check your network connection and try again.</div>`
}

worker.onmessageerror = (event) => {
  console.error('Worker message error:', event)
  rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error communicating with Python worker.</div>`
}

let assembly: Assembly

const run = (bridge: Bridge, locale: string): void => {
  try {
    assembly = new Assembly(worker, bridge)
    assembly.visualisationEngine.start(rootElement, locale)
    assembly.processingEngine.start()
  } catch (error) {
    console.error('Assembly initialization error:', error)
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error initializing application. Please try again later.</div>`
  }
}

if (process.env.REACT_APP_BUILD !== 'standalone' && process.env.NODE_ENV === 'production') {
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
