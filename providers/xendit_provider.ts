/*
|--------------------------------------------------------------------------
| Xendit Provider
|--------------------------------------------------------------------------
|
| The Xendit provider registers the XenditManager as a singleton in the
| IoC container, making it available throughout the application via
| the 'xendit.manager' binding.
|
*/

import { configProvider } from '@adonisjs/core'
import { type ApplicationService } from '@adonisjs/core/types'
import { RuntimeException } from '@adonisjs/core/exceptions'

import { XenditManager } from '../src/xendit_manager.ts'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'xendit.manager': XenditManager
  }
}

export default class XenditProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('xendit.manager', async () => {
      const xenditConfigProvider = this.app.config.get('xendit', {})

      const config = await configProvider.resolve<any>(this.app, xenditConfigProvider)

      if (!config || !config.secretKey) {
        throw new RuntimeException(
          'Invalid "config/xendit.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new XenditManager(config)
    })
  }
}
