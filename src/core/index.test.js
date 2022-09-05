/* eslint-disable @typescript-eslint/no-var-requires */
const {
  getFilesChanged,
  getModuleRootDirectories,
  getModuleConsumers,
  orderModules,
  runCommand,
} = require('./index.cjs')
const {exec} = require('child_process')
const {readdir} = require('fs/promises')
const {resolve} = require('path')

const chalk = require('chalk')

const {
  mockComponentConsumers,
  mockLoggerConsumers,
  mockEmptyConsumers,
  mockRootPackageJson,
  mockAllConsumerPackages,
} = require('./index.mock.cjs')
const statusColours = require('../utils/theme/index.cjs')

jest.mock('child_process')
jest.mock('fs/promises')
jest.mock('path')

describe('Utils', () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  describe('getFilesChanged', () => {
    afterEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })
    it('should successfully return the files changed', async () => {
      const mockDiff =
        'libs/framework/federate-component/src/client.tsx\nlibs/framework/federate-component/src/index.tsx\nlibs/framework/logger/src/client.ts\n'
      exec.mockImplementation((command, callback) => callback(null, {stdout: mockDiff}))

      expect(await getFilesChanged()).toEqual([
        'libs/framework/federate-component/src/client.tsx',
        'libs/framework/federate-component/src/index.tsx',
        'libs/framework/logger/src/client.ts',
      ])
      expect(log).toHaveBeenCalledWith(chalk.hex(statusColours.success)('Files changed resolved successfully ✅ '))
    })

    it('should exit if no files are found', async () => {
      const mockDiff = ''
      exec.mockImplementation((command, callback) => callback(null, {stdout: mockDiff}))

      const filesChanged = await getFilesChanged()
      expect(filesChanged).toEqual(undefined)
      expect(log).toHaveBeenCalled()
      expect(process.exitCode).toStrictEqual(0)
    })

    it('should exit if there is an error when running the command', async () => {
      const mockGitCliError = `git: 'difhf' is not a git command. See 'git --help'.`
      exec.mockImplementation((command, callback) => callback(null, {stderr: mockGitCliError, stdout: ''}))

      const filesChanged = await getFilesChanged()
      expect(filesChanged).toEqual(undefined)
      expect(error).toHaveBeenCalledWith(chalk.hex(statusColours.error)(mockGitCliError))
      expect(process.exitCode).toEqual(1)
    })
  })

  describe('getModuleRootDirectories', () => {
    const mockSuccessfulDirectory = [
      'babel.config.js',
      'coverage',
      'lib',
      'package.json',
      'rollup.config.js',
      'rollup.prod.config.js',
      'src',
      'tsconfig.json',
    ]

    afterEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    it('should succefully find the package.json related to each file', async () => {
      const files = ['libs/framework/federate-component/src/index.tsx', 'libs/framework/logger/src/client.ts']
      readdir.mockResolvedValue(mockSuccessfulDirectory)

      expect(await getModuleRootDirectories(files)).toEqual([
        'libs/framework/federate-component/src/',
        'libs/framework/logger/src/',
      ])
      expect(log).toBeCalledWith(chalk.hex(statusColours.success)('package.json located for all files ✅ '))
    })

    it('should only return one path when mutiple files share the same package.json', async () => {
      const files = [
        'libs/framework/federate-component/src/client.tsx',
        'libs/framework/federate-component/src/index.tsx',
      ]
      readdir.mockResolvedValueOnce(mockSuccessfulDirectory)

      expect(await getModuleRootDirectories(files)).toEqual(['libs/framework/federate-component/src/'])
      expect(log).toBeCalledWith(chalk.hex(statusColours.success)('package.json located for all files ✅ '))
    })

    it('should recursively move up to the parent directory if package.json is not found', async () => {
      const files = ['libs/framework/federate-component/src/index.tsx']

      readdir.mockResolvedValueOnce(['index.tsx']).mockResolvedValueOnce(mockSuccessfulDirectory)

      expect(await getModuleRootDirectories(files)).toEqual(['libs/framework/federate-component/'])
      expect(log).toBeCalledWith(chalk.hex(statusColours.success)('package.json located for all files ✅ '))
    })
  })

  describe('getModuleConsumers', () => {
    afterEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    jest.mock(
      '/Users/jeff/Documents/repos/test/libs/framework/federate-component/package.json',
      () => ({name: '@batman/federate-component'}),
      {
        virtual: true,
      },
    )
    jest.mock(
      '/Users/jeff/Documents/repos/test/libs/framework/logger/package.json',
      () => ({name: '@batman/core-logger'}),
      {
        virtual: true,
      },
    )

    it('should return a list of consumers for each package', async () => {
      resolve
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/federate-component/package.json')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/logger/package.json')

      exec
        .mockImplementationOnce((command, callback) => callback(null, {stdout: mockComponentConsumers}))
        .mockImplementationOnce((command, callback) => callback(null, {stdout: mockLoggerConsumers}))

      const packageConsumers = await getModuleConsumers([
        'libs/framework/federate-component/src/index.tsx',
        'libs/framework/logger/src/client.ts',
      ])

      expect(packageConsumers).toEqual(
        new Set([
          '@batman/app-shell',
          '@batman/federate-component',
          '@batman/footer',
          '@batman/header',
          '@batman/core-logger',
          '@batman/middlewares',
          '@batman/text-positioner',
        ]),
      )
    })

    it('should log a warning if there are no consumers of the package', async () => {
      resolve.mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/federate-component/package.json')
      exec.mockImplementationOnce((command, callback) => callback(null, {stdout: mockEmptyConsumers}))

      await getModuleConsumers(['libs/framework/federate-component/src/index.tsx'])
      expect(warn).toHaveBeenCalledWith(chalk.hex(statusColours.warning)('No consumers for the @batman/federate-component module'))
    })
  })

  describe('orderModules', () => {
    afterEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })
    it('should order the packages correctly', async () => {
      const packagesSet = new Set([
        '@batman/app-shell',
        '@batman/federate-component',
        '@batman/footer',
        '@batman/header',
      ])

      jest.mock(`${process.cwd()}/package.json`, () => mockRootPackageJson, {
        virtual: true,
      })

      resolve
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/constants')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/eslint-config')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/prettier-config')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/logger')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/remote-urls')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/federate-component')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/middlewares')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/ui-components/Text')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/tools/CLI')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/AppShell')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/MFE/Header')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/MFE/Footer')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/MFE/TextPositioner')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/AppShell')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/federate-component')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/MFE/Footer')
        .mockReturnValueOnce('/Users/jeff/Documents/repos/test/apps/MFE/Header')
      exec.mockImplementation((command, callback) => callback(null, {stdout: mockAllConsumerPackages}))

      const orderedPackages = await orderModules(packagesSet)

      expect(orderedPackages).toStrictEqual([
        {
          absolutePath: '/Users/jeff/Documents/repos/test/libs/framework/federate-component',
          module: '@batman/federate-component',
        },
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/AppShell', module: '@batman/app-shell'},
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/MFE/Header', module: '@batman/header'},
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/MFE/Footer', module: '@batman/footer'},
      ])
    })
  })

  describe('runCommand', () => {
    it.todo('should run the stage successfully')
    it.todo('should run the stage and store an error when the command failed')
  })
})
