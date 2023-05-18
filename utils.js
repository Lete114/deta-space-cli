const http = require('http')
const https = require('https')
const { writeFileSync, existsSync, rmSync } = require('fs')
const { join } = require('path')
const { spawn } = require('child_process')

/**
 * download file
 * @param {string} url
 */
function request(url) {
  const protocol = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const req = protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(request(res.headers.location))
      if (res.statusCode !== 200) return reject(new Error(`Failed to download file statusCode(${res.statusCode}): ${res.statusMessage}`))

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

function unzip(zipFile, destDir) {
  return new Promise((resolve, reject) => {
    let command, args
    if (process.platform === 'win32') {
      command = 'powershell.exe'
      args = ['-noprofile', '-command', `Expand-Archive "${zipFile}" -DestinationPath "${destDir}"`]
    } else {
      command = 'unzip'
      args = ['-o', '-q', '-d', destDir, zipFile]
    }
    const childProcess = spawn(command, args)
    childProcess.on('error', (err) => {
      reject(err)
    })
    childProcess.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Exit code: ${code}, signal: ${signal}`))
      }
    })
  })
}

function installFailed() {
  // eslint-disable-next-line no-console
  console.log('Installation of "\x1b[33mdeta-space-cli\x1b[39m" failed, please run "\x1b[33mnpm install deta-space-cli -g\x1b[39m" to try to reinstall')
}

function remove(path) {
  existsSync(path) && rmSync(path)
}

const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'
const isDarwin = process.platform === 'darwin'
const arch = process.arch === 'x64' ? 'x86_64' : process.arch
const spaceBasePath = join(process.env.HOME || process.env.USERPROFILE, '.detaspace')
const spaceBinaryDirPath = join(spaceBasePath, 'bin')
const spacePath = join(spaceBinaryDirPath, 'space')
const spaceBinaryPath = spacePath + (isWindows ? '.exe' : '')

module.exports = { arch, isWindows, isLinux, isDarwin, request, download, unzip, installFailed, remove, spaceBasePath, spaceBinaryDirPath, spacePath, spaceBinaryPath }
