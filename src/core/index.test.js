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
const statusColours = require('./theme/index.cjs')

jest.mock('child_process')
jest.mock('fs/promises')
jest.mock('path')

describe('Utils', () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  describe('getFilesChanged', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {})

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
      expect(filesChanged).toEqual([])
      expect(log).toHaveBeenCalled()
      expect(exit).toBeCalledWith(0)
    })

    it('should exit if there is an error when running the command', async () => {
      const mockGitCliError = `git: 'difhf' is not a git command. See 'git --help'.`
      exec.mockImplementation((command, callback) => callback(null, {stderr: mockGitCliError, stdout: ''}))

      const filesChanged = await getFilesChanged()
      expect(filesChanged).toEqual([])
      expect(error).toHaveBeenCalledWith(chalk.hex(statusColours.error)(mockGitCliError))
      expect(exit).toBeCalledWith(0)
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

    it('should exit if there are no consumers of the package', async () => {
      resolve.mockReturnValueOnce('/Users/jeff/Documents/repos/test/libs/framework/federate-component/package.json')
      exec.mockImplementationOnce((command, callback) => callback(null, {stdout: mockEmptyConsumers}))
      const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)

      await getModuleConsumers(['libs/framework/federate-component/src/index.tsx'])

      expect(log).toHaveBeenNthCalledWith(2, chalk.hex(statusColours.warning)('No consumers for the package'))
      expect(exit).toBeCalledWith(0)
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

      jest.mock('../../../../package.json', () => mockRootPackageJson, {
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
          package: '@batman/federate-component',
        },
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/AppShell', package: '@batman/app-shell'},
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/MFE/Header', package: '@batman/header'},
        {absolutePath: '/Users/jeff/Documents/repos/test/apps/MFE/Footer', package: '@batman/footer'},
      ])
    })
  })

  describe('runCommand', () => {
    it.todo('should run the stage successfully')
    it.todo('should run the stage and store an error when the command failed')
  })
})
