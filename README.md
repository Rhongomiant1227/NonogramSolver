# Nonogram Studio

[English](README.en.md)

Nonogram Studio 是一个本地运行的数织（Nonogram / Picross）求解器，提供响应式 Web UI、线索校验、唯一解/多解反馈和逐格动画。

## 启动

Windows 用户双击 `start.bat` 即可。首次运行会创建 `.venv` 虚拟环境并自动打开浏览器。也可以在 PowerShell 中运行 `.\run.ps1`。默认地址为 <http://localhost:8000>。

项目仅依赖 Python 标准库，不需要下载第三方包。界面支持 1×1 到 120×120 网格，行列线索可用空格、英文逗号或中文逗号分隔，多位数字直接输入（例如 `10 2`）。

## 验证

```powershell
.\.venv\Scripts\python.exe -m unittest -v
```

求解器使用逐行/逐列候选排列、约束传播和最少候选优先搜索。它对这类离散约束问题采用 CPU 优化；GPU 通常不会改善候选筛选，且项目保持零第三方运行依赖。
