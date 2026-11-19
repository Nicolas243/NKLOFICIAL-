$ErrorActionPreference = 'Stop'
git config core.hooksPath .githooks
Write-Output 'Git hooks enabled: .githooks'
