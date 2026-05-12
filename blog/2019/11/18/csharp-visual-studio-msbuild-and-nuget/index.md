---
url: /blog/2019/11/18/csharp-visual-studio-msbuild-and-nuget/index.md
---
在校招与实习前后搭 ASP.NET / WinForm 小项目时，工具链搞不清楚会浪费大量时间。本文为个人备忘，不是教程。

## Visual Studio 与解决方案

* \==解决方案（.sln）==：多个项目的容器；团队约定「一个仓库一个 sln」或按模块拆 sln。
* **生成 / 重新生成**：增量编译失败时，优先 **清理 + 重新生成**，再查引用与目标框架是否一致。
* **调试与 IIS Express / 本地 IIS**：端口占用、站点绑定与应用池账户是最常见的启动失败原因；可与 [《C#遇到的部分坑》](/2019/03/05/c-object/) 里的 IIS 问题对照看。

## MSBuild 要点

* **Configuration / Platform**：`Debug|AnyCPU` 与 Release 的符号、优化、条件编译符号可能不同；CI 里要用与线上一致的配置。
* **复制到输出目录**：`Copy to Output Directory` 与内容文件的打包路径容易在发布时丢文件。
* **多目标框架**：`TargetFrameworks` 与单 `TargetFramework` 行为不同；升级 SDK 前确认第三方包是否支持。

## NuGet

* **PackageReference**（SDK 风格项目）与旧的 `packages.config` 混用会在迁仓库时踩坑。
* **还原失败**：检查源（含私有源）、TLS、代理；团队可锁定 `Directory.Build.props` 里的中央包管理版本策略。

## 延伸阅读

* 实践向坑位总结见 [《C#遇到的部分坑》](/2019/03/05/c-object/)。
