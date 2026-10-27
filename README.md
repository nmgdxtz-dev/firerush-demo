# 火力突围 · Fire Rush

手机网页试玩部署仓库。游戏主页为 `index.html`。

## V0.8 · 夺塔战线（手机新作）

手机试玩：[V0.8 夺塔战线](https://nmgdxtz-dev.github.io/firerush-demo/preview/v0.8/)。V0.6 首页与 V0.7 手机触控预览保留。

这一版是固定战场的攻城 / 夺塔 / 回援循环。两侧供能塔保护主堡：先拆侧塔，在对应侧驻守 1.4 秒完成占领，转化为己方自动防守火力。敌人能侧翼反扑夺回塔，重新接通主堡护盾。破掉三座主堡才能推进完成，不能靠等待过关。

- 原生 Touch Events 优先；开始触摸在游戏区域，移动/抬起/取消在 window 捕获监听。
- 活动手指按 identifier 跟踪，越界继续控制、松手后重新按下恢复，取消或漏掉结束事件也可重新接管。
- 不依赖指针捕获。鼠标事件仅用于桌面后备，忽略触摸派生的 pointer 事件。
- 右下角独立破阵按钮支持第二根手指，不抢走移动手指。保留之前修复的“不因 iOS 偶发 blur 自动弹暂停”行为。

开发：Node 22，无 npm 依赖。`npm run dev` 后打开 `/v08/`；`npm run build` 生成 `preview/v0.8/index.html` 和 `dist/index.html`，均为独立 HTML。线上发布仅使用新增的 V0.8 预览路径。

验证：`npm test`、`npm run balance`；浏览器打开 `/tests/browser.html`。设计与限制见 [V0.8 记录](DESIGN-V08.md)。
