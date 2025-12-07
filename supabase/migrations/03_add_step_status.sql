/*
# 为步骤表添加状态字段

1. 表结构变更
    - `steps` 表添加新字段
        - `status` (text, 步骤状态, 可选)
        - 用于存储用户自定义的步骤状态信息

2. 说明
    - status 字段允许用户为每个步骤添加自定义状态描述
    - 例如："进行中"、"等待审批"、"已暂停"等
    - 该字段为可选，默认为 NULL
*/

-- 为 steps 表添加 status 字段
ALTER TABLE steps ADD COLUMN IF NOT EXISTS status text;

-- 添加注释
COMMENT ON COLUMN steps.status IS '步骤状态描述，用户可自定义填写';
