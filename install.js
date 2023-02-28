const cp = require('child_process')
const { mkdirSync, existsSync } = require('fs')
const { request, download, installFailed, remove, unzip, spaceBinaryDirPath, spacePath, spaceBinaryPath } = require('./utils')

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

let target
if (target_arch && target_os) {
  if (!supported_architectures) throw new Error(`Unsupported architecture ${target_arch}. Only x64 and arm64 binaries are available.`)
  target = target_arch + '-' + target_os
} else {
  target = windows
}

const zipPath = spacePath + '.zip'

if (!existsSync(spaceBinaryDirPath)) mkdirSync(spaceBinaryDirPath, { recursive: true })
;(async () => {
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
  } finally {
    isRemove && remove(zipPath)
    if (supported_architectures) spawnSync('chmod', ['+x', spaceBinaryPath])
  }
})()
