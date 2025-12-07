/*
# 添加事件开始时间和提醒功能

## 1. 概述
为 events 表添加开始时间和提醒方式字段，支持用户设置事件开始时间并选择提醒方式。

## 2. 新增字段
- **start_time** (timestamptz, nullable): 事件开始时间，可选字段
- **reminder_type** (text, nullable): 提醒方式，可选值：'sound'（铃声）、'vibrate'（振动）、null（不提醒）

## 3. 使用场景
- 用户可以为待办事件设置开始时间
- 系统在开始时间到达时发送提醒
- 用户可以选择提醒方式：铃声、振动或不提醒

## 4. 注意事项
- start_time 和 reminder_type 都是可选字段
- 只有设置了 start_time 的事件才会触发提醒
- reminder_type 为 null 时表示不提醒
*/

-- 添加开始时间字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time timestamptz;

-- 添加提醒方式字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_type text;

-- 添加提醒方式的检查约束
ALTER TABLE events ADD CONSTRAINT check_reminder_type 
  CHECK (reminder_type IS NULL OR reminder_type IN ('sound', 'vibrate'));

-- 添加注释
COMMENT ON COLUMN events.start_time IS '事件开始时间（可选）';
COMMENT ON COLUMN events.reminder_type IS '提醒方式：sound（铃声）、vibrate（振动）、null（不提醒）';
