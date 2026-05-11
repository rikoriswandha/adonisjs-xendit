import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

const BASE_URL = new URL('../tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  group.each.timeout(0)

  test('publish config, provider, and env variables', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    await fs.create('.env', '')
    await fs.createJson('tsconfig.json', {})
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await app.container.make('ace')
    ace.prompt
      .trap('Enter your Xendit API key')
      .assertFails('', 'Xendit API key is required')
      .assertPasses('sk_secret_123')

    const command = await ace.create(Configure, ['../index.js'])
    await command.exec()

    await assert.fileExists('config/xendit.ts')
    await assert.fileContains('config/xendit.ts', [
      `import { defineConfig } from 'adonisjs-xendit'`,
      `secretKey: env.get('XENDIT_SECRET_KEY')`,
      `environment: env.get('XENDIT_ENVIRONMENT', 'sandbox')`,
      `callbackToken: env.get('XENDIT_CALLBACK_TOKEN')`,
      `timeoutMs: 30000`,
    ])
    await assert.fileContains('adonisrc.ts', 'adonisjs-xendit/xendit_provider')
    await assert.fileContains('.env', 'XENDIT_SECRET_KEY')
    await assert.fileContains('.env', 'XENDIT_ENVIRONMENT=sandbox')
    await assert.fileContains('.env', 'XENDIT_CALLBACK_TOKEN')
    await assert.fileContains('start/env.ts', 'XENDIT_SECRET_KEY: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'XENDIT_ENVIRONMENT')
    await assert.fileContains('start/env.ts', 'XENDIT_CALLBACK_TOKEN')
  })

  test('prompts to overwrite existing config file', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    await fs.create('.env', '')
    await fs.createJson('tsconfig.json', {})
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await fs.create('adonisrc.ts', `export default defineConfig({})`)
    await fs.create('config/xendit.ts', '// existing config')

    const ace = await app.container.make('ace')
    ace.prompt.trap('Enter your Xendit API key').assertPasses('sk_existing_test')
    ace.prompt
      .trap('A config/xendit.ts file already exists. Do you want to overwrite it?')
      .replyWith(false)

    const command = await ace.create(Configure, ['../index.js'])
    await command.exec()

    await assert.fileExists('config/xendit.ts')
    await assert.fileContains('config/xendit.ts', '// existing config')
  })
})
