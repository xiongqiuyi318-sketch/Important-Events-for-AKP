/*
# 为 events 表添加 sort_order 字段

1. 新增字段
    - `sort_order` (integer, default: 0)：用于手动调整事件排序

2. 数据迁移
    - 为现有事件设置默认的 sort_order 值（按创建时间）

3. 说明
    - sort_order 值越小，排序越靠前
    - 默认值为 0，表示使用自动排序（按优先级和创建时间）
    - 用户手动调整后，会设置具体的 sort_order 值
*/

-- 添加 sort_order 字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 为现有事件设置 sort_order（按创建时间的序号）
WITH ranked_events AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM events
)
UPDATE events
SET sort_order = ranked_events.rn
FROM ranked_events
WHERE events.id = ranked_events.id;
