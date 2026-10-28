# 火力突围 · Fire Rush

手机网页试玩部署仓库。游戏主页为 `index.html`。

## V0.8 · 夺塔战线（手机新作）

手机试玩：[V0.8 夺塔战线](https://nmgdxtz-dev.github.io/firerush-demo/preview/v0.8/)。V0.6 首页与 V0.7 手机触控预览保留。

这一版是固定战场的攻城 / 夺塔 / 回援循环。两侧供能塔保护主堡：先拆侧塔，在对应侧驻守 1.4 秒完成占领，转化为己方自动防守火力。敌人能侧翼反扑夺回塔，重新接通主堡护盾。破掉三座主堡才能推进完成，不能靠等待过关。

- 原生 Touch Events 优先；开始触摸在游戏区域，移动/抬起/取消在 window 捕获监听。
- 活动手指按 identifier 跟踪，越界继续控制、松手后重新按下恢复，取消或漏掉结束事件也可重新接管。
- 不依赖指针捕获。鼠标事件仅用于桌面后备，忽略触摸派生的 pointer 事件。
- 右下角独立破阵按钮支持第二根手指，不抢走移动手指。保留之前修复的“不因 iOS 偶发 blur 自动弹暂停”行为。

开发：Node 22，无 npm 依赖。`npm run dev` 后打开 `/v08/`；`npm run build:v08` 生成 `preview/v0.8/index.html` 和 `dist/index.html`，均为独立 HTML。线上发布仅使用新增的 V0.8 预览路径。

验证：`npm test`、`npm run balance`；浏览器打开 `/tests/browser.html`。设计与限制见 [V0.8 记录](DESIGN-V08.md)。

## V0.9 · 心弦裂潮

[手机试玩：心弦裂潮](https://nmgdxtz-dev.github.io/firerush-demo/preview/v0.9/)。旧版本预览继续保留。

这次把前进变成主要动作：面对持续回涌的真实敌群，先击碎横向游动的橙色缝眼，趁 3.6 秒裂口窗口牵手冲锋。成功起跳后咕咕会撑住裂口，直到两人穿过；世界距离和镜头一起向前推进。硬闯未打穿的缺口会受伤，停着清怪也不能跨过潮脊。

收束成矛会增加伤害、缩小覆盖宽度；展开成翼则交换伤害来覆盖更多侧翼。原生触摸、越界控制、松手续按和独立第二手指技能沿用手机修正版。

当前开发入口为 `npm run dev` 后的 `/v09/`；`npm run build` 生成独立 `preview/v0.9/index.html` 与 `dist/index.html`。V0.8 构建改用 `npm run build:v08`。`npm run balance` 为 V0.9 回放，V0.8 回放用 `npm run balance:v08`。

`npm test` 包含两版玩法与最新输入回归。浏览器打开 `/tests/browser-v09.html` 可运行完整突破、原生触摸、冲锋镜头检查，以及真实引擎逐帧演示。详见 [设计与验证记录](DESIGN-V09.md)。
