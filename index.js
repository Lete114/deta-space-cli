#!/usr/bin/env node

const cp = require('child_process')
const { installFailed, spaceBinaryPath } = require('./utils')

/**
 *
 * @param {string[]} params
 * @param {string} command
 */
function spawnSync(params, command = spaceBinaryPath) {
  const { error } = cp.spawnSync(command, params, { cwd: process.cwd(), stdio: 'inherit' })
  if (error && error.code === 'ENOENT') installFailed()
}
const argv = process.argv.slice(2)
spawnSync(argv)
