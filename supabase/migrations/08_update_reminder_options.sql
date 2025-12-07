/*
# 更新提醒选项

## 变更说明
将 reminder_type 字段改为支持多种提醒选项：
- 'none': 不提醒
- 'start_sound': 开始时间铃声提醒
- 'start_vibrate': 开始时间振动提醒
- 'deadline_sound': 截止时间铃声提醒
- 'deadline_vibrate': 截止时间振动提醒
- 'both_sound': 开始和截止时间都铃声提醒
- 'both_vibrate': 开始和截止时间都振动提醒

## 表结构变更
- events 表的 reminder_type 字段保持为 text 类型，支持上述值
*/

-- 不需要修改表结构，只需要在应用层面支持新的值
-- reminder_type 字段已经是 text 类型，可以存储任意字符串
