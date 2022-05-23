const mockComponentConsumers = `{
    "version": "1.0.0",
    "name": "@batman/monorepo",
    "dependencies": {
      "@batman/app-shell": {
        "version": "0.0.1",
        "resolved": "file:../../apps/AppShell",
        "dependencies": {
          "@batman/federate-component": {
            "version": "1.0.0"
          }
        }
      },
      "@batman/federate-component": {
        "version": "1.0.0",
        "resolved": "file:../../libs/framework/federate-component"
      },
      "@batman/footer": {
        "version": "0.1.0",
        "resolved": "file:../../apps/MFE/Footer",
        "dependencies": {
          "@batman/federate-component": {
            "version": "1.0.0"
          }
        }
      },
      "@batman/header": {
        "version": "0.1.1",
        "resolved": "file:../../apps/MFE/Header",
        "dependencies": {
          "@batman/federate-component": {
            "version": "1.0.0"
          }
        }
      }
    }
  }`

const mockLoggerConsumers = `{
    "version": "1.0.0",
    "name": "@batman/monorepo",
    "dependencies": {
      "@batman/app-shell": {
        "version": "0.0.1",
        "resolved": "file:../../apps/AppShell",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/core-logger": {
        "version": "7.3.1",
        "resolved": "file:../../libs/framework/logger"
      },
      "@batman/federate-component": {
        "version": "1.0.0",
        "resolved": "file:../../libs/framework/federate-component",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/footer": {
        "version": "0.1.0",
        "resolved": "file:../../apps/MFE/Footer",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/header": {
        "version": "0.1.1",
        "resolved": "file:../../apps/MFE/Header",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/middlewares": {
        "version": "8.0.0",
        "resolved": "file:../../libs/framework/middlewares",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/text-positioner": {
        "version": "0.1.0",
        "resolved": "file:../../apps/MFE/TextPositioner",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      }
    }
  }`

const mockEmptyConsumers = `
  {
    "version": "1.0.0",
    "name": "@batman/monorepo"
  }
  `

const mockRootPackageJson = `
  {
    "name": "@batman/monorepo",
    "version": "1.0.0",
    "description": "Federated Modules Production Grade boilerplate",
    "scripts": {
      "lint-all": "npm run lint --ws --if-present",
      "tsc-all": "npm run tsc --ws --if-present",
      "test-all": "npm run test --ws --if-present",
      "build-all": "npm run build --ws --if-present",
    },
    "repository": {
      "type": "git",
      "url": "git+https://github.com/amido/Next.Ecommerce.UI.Federated.git"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "bugs": {
      "url": "https://github.com/amido/Next.Ecommerce.UI.Federated/issues"
    },
    "homepage": "https://github.com/amido/Next.Ecommerce.UI.Federated#readme",
    "workspaces": [
      "./libs/framework/constants",
      "./libs/framework/eslint-config",
      "./libs/framework/prettier-config",
      "./libs/framework/logger",
      "./libs/framework/remote-urls",
      "./libs/framework/federate-component",
      "./libs/framework/middlewares",
      "./libs/ui-components/Text",
      "./tools/CLI",
      "./apps/AppShell",
      "./apps/MFE/Header",
      "./apps/MFE/Footer",
      "./apps/MFE/TextPositioner"
    ],
    "dependencies": {
      "@babel/core": "^7.16.7",
    },
    "config": {
      "commitizen": {
        "path": "./node_modules/cz-conventional-changelog",
        "skipScope": false,
        "defaultScope": "*"
      }
    },
    "devDependencies": {
      "@types/compression": "^1.7.2"
    }
  }`

const mockAllConsumerPackages = `
{
    "dependencies": {
      "@batman/app-shell": {
        "version": "0.0.1",
        "resolved": "file:../../apps/AppShell",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          },
          "@batman/federate-component": {
            "version": "1.0.0"
          },
          "@batman/middlewares": {
            "version": "8.0.0"
          }
        }
      },
      "@batman/core-logger": {
        "version": "7.3.1",
        "resolved": "file:../../libs/framework/logger"
      },
      "@batman/federate-component": {
        "version": "1.0.0",
        "resolved": "file:../../libs/framework/federate-component",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/footer": {
        "version": "0.1.0",
        "resolved": "file:../../apps/MFE/Footer",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          },
          "@batman/federate-component": {
            "version": "1.0.0"
          },
          "@batman/middlewares": {
            "version": "8.0.0"
          }
        }
      },
      "@batman/header": {
        "version": "0.1.1",
        "resolved": "file:../../apps/MFE/Header",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          },
          "@batman/federate-component": {
            "version": "1.0.0"
          },
          "@batman/middlewares": {
            "version": "8.0.0"
          }
        }
      },
      "@batman/middlewares": {
        "version": "8.0.0",
        "resolved": "file:../../libs/framework/middlewares",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          }
        }
      },
      "@batman/text-positioner": {
        "version": "0.1.0",
        "resolved": "file:../../apps/MFE/TextPositioner",
        "dependencies": {
          "@batman/core-logger": {
            "version": "7.3.1"
          },
          "@batman/middlewares": {
            "version": "8.0.0"
          }
        }
      }
    }
  
}`

module.exports = {
  mockComponentConsumers,
  mockLoggerConsumers,
  mockEmptyConsumers,
  mockRootPackageJson,
  mockAllConsumerPackages,
}
