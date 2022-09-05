# Package consumer test runner

## Overview
This is a monorepo CLI tool used to run a set of (mainly test) commands on the consumers of a specific package after changes are applied to it.

## Flags
### Custom commands
| Flag        | Description          | Example             |
| ----------- | -----------          | -----------         |
| --build-cmd | Custom build command | --build-cmd=lint-ci |
| --lint-cmd  | Custom lint command  | --lint-cmd=lint-ci  |
| --test-cmd  | Custom test command  | --test-cmd=test-ci  |

### Custom command flags
| Flag          | Description        | Example                   |
| -----------   | -----------        | -----------               |
| --build-flags | Custom build flags | --build-cmd='--ci'        |
| --lint-flags  | Custom lint flags  | --lint-flags='--ext .jsx' |
| --test-flags  | Custom test flags  | --test-flags='-- -u'      |

### Running Specific Commands
| Flag        | Description     |
| ----------- | -----------     |
| --build     | Only runs build |
| --lint      | Only runs lint  |
| --test      | Only runs test  |

### Other
| Flag             | Description                             |
| -----------      | -----------                             |
| --only-consumers | Only runs commands on consumer packages |