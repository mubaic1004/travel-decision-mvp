# Travel Decision MVP

一个极简、稳定、可替换真实数据源的旅行决策网页 MVP。

它不做 OTA 大而全搜索，也不做聊天式 AI 助手，而是把同一批候选旅行方案压缩成 3 个清晰答案：

- `Cheapest Option`
- `Least Leave Option`
- `Best Value Option`

其中 `Best Value Option` 的排序依据不是最低价格，而是：

- `price_per_effective_hour = total_price / effective_play_hours`

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

仓库内已经附带 `.npmrc`，默认使用项目内本地缓存，并启用兼容的 peer 依赖解析，避免本机全局 npm 缓存权限问题影响安装。

如需构建生产版本：

```bash
npm run build
npm run start
```

## 项目结构

```text
.
├─ package.json
├─ pricing-rules.json
├─ next.config.ts
├─ tailwind.config.ts
├─ postcss.config.js
├─ tsconfig.json
├─ src
│  ├─ app
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components
│  │  ├─ result-card.tsx
│  │  ├─ search-form.tsx
│  │  ├─ state-panel.tsx
│  │  └─ travel-mvp.tsx
│  ├─ lib
│  │  ├─ constants.ts
│  │  └─ travel
│  │     ├─ calculator.ts
│  │     ├─ candidate-generator.ts
│  │     ├─ filters.ts
│  │     ├─ matcher.ts
│  │     ├─ pricing-rules.ts
│  │     ├─ ranker.ts
│  │     ├─ search.ts
│  │     └─ utils.ts
│  └─ types
│     └─ travel.ts
└─ README.md
```

## 当前 MVP 做了什么

- 表单输入：出发地、日期窗口、请假上限、旅行天数范围、候选目的地、基础航班过滤条件
- 候选行程生成
- 基于 `pricing-rules.json` 的规则驱动航班 / 酒店估价
- 航班与酒店过滤
- 有效旅行时间计算
- 总价与每有效小时成本计算
- 三种排序结果输出
- loading / empty / error state
- 桌面端和移动端基础适配

## 核心业务逻辑

### 1. 候选行程生成

文件：`src/lib/travel/candidate-generator.ts`

- 在 `dateRangeStart ~ dateRangeEnd` 内遍历出发日期
- 根据 `tripLengthMin ~ tripLengthMax` 生成返程日期
- 计算 `leaveDates`
- 超过 `maxLeaveDays` 的候选方案直接丢弃

### 2. 规则驱动数据匹配

文件：`src/lib/travel/matcher.ts`

- 读取根目录 `pricing-rules.json`
- 根据 `routes`、`flight_time_templates`、`return_time_templates` 生成候选航班
- 根据 `hotels`、`hotel_price_rules`、`seasonality_rules` 计算酒店价格
- 使用 seeded noise 保持同一行程在本地演示下的价格稳定
- 当前规则覆盖上海出发，并支持规则文件中列出的目的地

### 3. 过滤器

文件：`src/lib/travel/filters.ts`

会过滤掉：

- 去程到达晚于 `latestArrivalTime`
- 回程起飞早于 `earliestReturnTime`
- 转机时长超过 `maxLayoverHours`
- `noRedEye = true` 时的红眼航班
- 酒店/价格缺失的方案
- `effective_play_hours < 10` 的方案

### 4. 有效旅行时间

文件：`src/lib/travel/calculator.ts`

函数：

```ts
calcEffectivePlayHours(arrivalDateTime, returnDepartureDateTime)
```

规则：

- 每天只统计 `09:00 - 22:00`
- 到达当天只统计到达后的有效区间
- 回程当天只统计起飞前的有效区间
- 中间完整天数自然会累计为 `13h`

### 5. 排序输出

文件：`src/lib/travel/ranker.ts`

- `cheapest_option`: `total_price` 升序
- `least_leave_option`: `leave_days_used` 升序，再按 `total_price`
- `best_value_option`: `price_per_effective_hour_with_penalty` 升序

## 当前规则数据说明

- 请假天数按工作日粗略估算，暂未接节假日/调休日历
- 当前 `pricing-rules.json` 仅覆盖上海出发
- 航班与酒店价格是基于规则模型的参考估算，不代表实时成交价
- 暂不接入真实 OTA、航司、酒店供应链
- 节假日窗口和部分季节因子采用轻量规则化近似，适合 MVP 比较用途

## 下一步如何接真实 API

优先替换 `src/lib/travel/search.ts` 的数据来源，而不是重写页面。

推荐顺序：

1. 保留现有 `SearchInput` / `SearchResult` / `RankedTripOption` 类型不动
2. 把 `matcher.ts` 从规则估价层改成真实航班与酒店聚合层
3. 在聚合层里统一转换成当前 `FlightOption` / `HotelOption`
4. 保留 `filters.ts`、`calculator.ts`、`ranker.ts` 继续复用
5. 最后再引入节假日、签证、天气、预算偏好等高级因子

这样可以确保 MVP 的“结果可信逻辑”先稳定，再逐步升级数据真实性。
