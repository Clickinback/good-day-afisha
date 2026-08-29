$ErrorActionPreference = "Stop"
$projectPath = "D:\Good Day Афиша"
$nodeBin = "C:\Users\Никита Успешный\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpm = "C:\Users\Никита Успешный\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$env:Path = "$nodeBin;$env:Path"
Set-Location -LiteralPath $projectPath
& $pnpm pipeline
exit $LASTEXITCODE

