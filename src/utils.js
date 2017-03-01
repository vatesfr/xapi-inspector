import createArray from 'create-array'
import multi from 'multi-write-stream'
import { PassThrough } from 'stream'
import { request as httpsRequest } from 'https'

// ===================================================================

export const createReadableCopies = (n, readable) => {
  const copies = createArray(n, () => new PassThrough())
  readable.pipe(multi(copies))
  return copies
}

// -------------------------------------------------------------------

export const fromCallback = fn => new Promise((resolve, reject) => {
  fn((error, result) => error
    ? reject(error)
    : resolve(result)
  )
})

// -------------------------------------------------------------------

export const proxyHttpsRequest = ({
  headers,
  hostname,
  method,
  url,
  port
}, inputReq) => new Promise(resolve => {
  const req = httpsRequest({
    headers: headers || inputReq.headers,
    hostname,
    method: method || inputReq.method,
    path: url || inputReq.url,
    port,
    rejectUnauthorized: false
  }, resolve)
  inputReq.pipe(req)
})

// -------------------------------------------------------------------

const _isPort = value => (
  typeof value === 'number' &&
  value >= 0 && value <= 65534 &&
  Math.floor(value) === value
)

// splitHost('localhost:80') => { hostname: 'localhost', port: 80 }
// splitHost('localhost') => { hostname: 'localhost' }
// splitHost('80') => { port: 80 }
export const splitHost = host => {
  host = String(host)
  const i = host.lastIndexOf(':')

  if (i === -1) {
    const port = +host
    return _isPort(port)
      ? { port }
      : { hostname: host }
  }

  const port = +host.slice(i + 1)
  return _isPort(port)
    ? {
      hostname: host.slice(0, i),
      port
    }
    : { hostname: host }
}
