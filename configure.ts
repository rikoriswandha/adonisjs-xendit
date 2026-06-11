/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "Configure"
| instance and you can use codemods to modify the source files.
|
*/

import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type Configure from '@adonisjs/core/commands/configure'

const stubsRoot = join(dirname(fileURLToPath(import.meta.url)), 'stubs')

/**
 * Configures the @rikology/adonisjs-xendit package

 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  /**
   * Prompt for Xendit API key (masked input)
   */
  const secretKey = await command.prompt.secure('Enter your Xendit API key', {
    validate: (value: string) => (value ? true : 'Xendit API key is required'),
  })

  /**
   * Check if config file already exists and handle overwrite
   */
  const configPath = command.app.configPath('xendit.ts')
  const configExists = await access(configPath, constants.F_OK)
    .then(() => true)
    .catch(() => false)

  if (configExists) {
    const overwrite = await command.prompt.confirm(
      'A config/xendit.ts file already exists. Do you want to overwrite it?'
    )

    if (!overwrite) {
      command.logger.info('Skipped publishing config/xendit.ts')
    } else {
      await codemods.makeUsingStub(stubsRoot, 'config/xendit.stub', {})
      command.logger.success('Updated config/xendit.ts')
    }
  } else {
    await codemods.makeUsingStub(stubsRoot, 'config/xendit.stub', {})
    command.logger.success('Created config/xendit.ts')
  }

  await codemods.defineEnvVariables(
    {
      XENDIT_SECRET_KEY: secretKey,
      XENDIT_ENVIRONMENT: 'sandbox',
      XENDIT_CALLBACK_TOKEN: '',
    },
    {
      omitFromExample: ['XENDIT_SECRET_KEY', 'XENDIT_CALLBACK_TOKEN'],
    }
  )

  await codemods.defineEnvValidations({
    variables: {
      XENDIT_SECRET_KEY: 'Env.schema.string()',
      XENDIT_ENVIRONMENT: "Env.schema.enum(['sandbox', 'production'] as const)",
      XENDIT_CALLBACK_TOKEN: 'Env.schema.string.optional()',
    },
  })

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@rikology/adonisjs-xendit/xendit_provider')
  })

  command.logger.success('Xendit package configured successfully')
}
