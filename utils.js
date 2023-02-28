const http = require('http')
const https = require('https')
const { createReadStream, writeFileSync, existsSync, rmSync } = require('fs')
const { join } = require('path')
const { Extract } = require('unzipper')

/**
 * download file
 * @param {string} url
 */
function request(url) {
  const protocol = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${res.statusMessage}`))
        return
      }
      const data = []
      res.on('data', (chunk) => {
        data.push(chunk)
      })

      res.on('end', () => {
        const buffer = Buffer.concat(data)
        resolve(buffer)
      })
    })
    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

/**
 * download file
 * @param {string} url
 * @param {string} filePath
 */
async function download(url, filePath) {
  if (existsSync(filePath)) return
  const buffer = await request(url)
  writeFileSync(filePath, buffer)
}

function unzip(zipPath, targetPath) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(zipPath).pipe(Extract({ path: targetPath }))
    stream.on('close', resolve)
    stream.on('error', reject)
  })
}

function installFailed() {
  // eslint-disable-next-line no-console
  console.log('Installation of "\x1b[33mdeta-space-cli\x1b[39m" failed, please run "\x1b[33mnpm install deta-space-cli -g\x1b[39m" to try to reinstall')
}

function remove(path) {
  existsSync(path) && rmSync(path)
}

const spaceBasePath = join(process.env.HOME || process.env.USERPROFILE, '.detaspace')
const spaceBinaryDirPath = join(spaceBasePath, 'bin')
const spacePath = join(spaceBinaryDirPath, 'space')
const spaceBinaryPath = spacePath + (process.platform === 'win32' ? '.exe' : '')

module.exports = { request, download, unzip, installFailed, remove, spaceBasePath, spaceBinaryDirPath, spacePath, spaceBinaryPath }
