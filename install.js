const { mkdirSync, existsSync, chmodSync } = require('fs')
const { download, installFailed, remove, unzip, spaceBinaryDirPath, spacePath, spaceBinaryPath, isWindows, isLinux, isDarwin, arch } = require('./utils')

const space_uri = 'https://github.com/deta/space-cli/releases/latest/download/space-${target}.zip'

if (!['x86_64', 'arm64'].includes(arch)) throw new Error(`Unsupported architecture ${arch}. Only x64 and arm64 binaries are available.`)

let target
if (isWindows) target = 'windows-x86_64'
if (isLinux) target = 'linux-' + arch
if (isDarwin) target = 'darwin-' + arch

if (!existsSync(spaceBinaryDirPath)) mkdirSync(spaceBinaryDirPath, { recursive: true })
;(async () => {
  const zipPath = spacePath + '.zip'
  let isRemove = false
  try {
    const url = space_uri.replace('${target}', target)
    await download(url, zipPath)
    if (!existsSync(zipPath)) throw new Error('Resource download failed')
    await unzip(zipPath, spaceBinaryDirPath)
  } catch (error) {
    isRemove = true
    installFailed()
    // eslint-disable-next-line no-console
    console.error(error)
  } finally {
    isRemove && remove(zipPath)
    existsSync(spaceBinaryPath) && chmodSync(spaceBinaryPath, 755)
  }
})()
