const cp = require('child_process')
const { mkdirSync, existsSync, chmodSync } = require('fs')
const { request, download, installFailed, remove, unzip, spaceBinaryDirPath, spacePath, spaceBinaryPath, isWindows } = require('./utils')

const architectures = ['x86_64', 'arm64', 'aarch64', 'aarch64_be', 'armv8b', 'armv8l']
const windows = 'x86_64-windows'
const space_uri = 'https://deta-assets-1.s3.eu-central-1.amazonaws.com/releases/space-cli/${version}/space-${target}.zip'

function spawnSync(command, params) {
  const { stdout } = cp.spawnSync(command, params, { encoding: 'utf8' })
  return (stdout || '').toLowerCase().trim()
}

const target_arch = spawnSync('uname', ['-m'])
const target_os = spawnSync('uname', ['-s'])
const supported_architectures = architectures.includes(target_arch)
const isUnix = supported_architectures && target_arch && target_os ? true : false

let target
if (isWindows) target = windows
else if (isUnix) target = target_arch + '-' + target_os
else throw new Error(`Unsupported architecture ${target_arch}. Only x64 and arm64 binaries are available.`)

if (!existsSync(spaceBinaryDirPath)) mkdirSync(spaceBinaryDirPath, { recursive: true })
;(async () => {
  const zipPath = spacePath + '.zip'
  let isRemove = false
  try {
    const rwa_latest_version = await request('https://get.deta.dev/space-cli/latest-version')
    const latest_version = JSON.parse(rwa_latest_version.toString())
    const version = latest_version.tag_name
    const url = space_uri.replace('${version}', version).replace('${target}', target)
    await download(url, zipPath)
    await unzip(zipPath, spaceBinaryDirPath)
  } catch (error) {
    isRemove = true
    installFailed()
    // eslint-disable-next-line no-console
    console.error(error)
  } finally {
    isRemove && remove(zipPath)
    chmodSync(spaceBinaryPath, 755)
  }
})()
