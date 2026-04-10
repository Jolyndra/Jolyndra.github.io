# 本站统计说明

## 运行时间

- 在 `index.html` 的 `<body>` 上修改 **`data-site-launch`**。
- 推荐使用 **带时区的 ISO 时间**，例如北京时间 2026 年 4 月 11 日 0 点：

  `data-site-launch="2026-04-11T00:00:00+08:00"`

- 页面上显示为「本站已运行」的时长，由浏览器当前时间减去该时刻得到，**每秒刷新**。

## 访问次数（PV）

本站使用第三方 **CountAPI**（`api.countapi.xyz`）做简单的 **页面浏览次数（PV）** 统计：每次打开或刷新页面大约记 1 次，**不是**独立访客数（UV）。

### 当前配置（已帮你写好）

在 `index.html` 的 `<body>` 上已设置：

- `data-count-namespace="jolyndra-github-io-main"`（专用于本仓库/GitHub Pages，请勿与别人共用）
- `data-count-key="pv"`

部署后第一次有访问时，CountAPI 会自动创建计数器，页脚「累计访问」会显示数字。

### 若要改名或关闭

- **改名**：把 `data-count-namespace` 改成另一个**唯一**字符串，会得到一套新计数（旧的不自动合并）。
- **关闭**：把 `data-count-namespace=""` 置空，页脚会显示「未启用」。

### 注意

- 数字会随每次访问增加，自己反复刷新也会涨。
- 与 Plausible / Google Analytics 等后台数据**不会**一致，仅供参考。
- 不要把命名空间起得太通用（如 `test`、`homepage`），以免和别人冲突。
