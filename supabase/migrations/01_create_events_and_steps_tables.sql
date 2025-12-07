/*
# 创建事件管理相关表

1. 新建表
    - `events` (事件表)
        - `id` (uuid, 主键, 默认: gen_random_uuid())
        - `user_id` (uuid, 外键关联 auth.users)
        - `title` (text, 事件标题, 必填)
        - `description` (text, 事件描述/备注)
        - `deadline` (timestamptz, 截止时间)
        - `priority` (text, 优先级: 'high', 'medium', 'low', 默认: 'medium')
        - `status` (text, 状态: 'pending', 'in_progress', 'completed', 默认: 'pending')
        - `category` (text, 分类标签)
        - `completed_at` (timestamptz, 完成时间)
        - `created_at` (timestamptz, 默认: now())
        - `updated_at` (timestamptz, 默认: now())
    
    - `steps` (步骤表)
        - `id` (uuid, 主键, 默认: gen_random_uuid())
        - `event_id` (uuid, 外键关联 events, 级联删除)
        - `title` (text, 步骤标题, 必填)
        - `description` (text, 步骤描述)
        - `order_index` (integer, 排序序号, 必填)
        - `is_completed` (boolean, 是否完成, 默认: false)
        - `completed_at` (timestamptz, 完成时间)
        - `is_auto_generated` (boolean, 是否自动生成, 默认: false)
        - `category` (text, 步骤分类)
        - `created_at` (timestamptz, 默认: now())
        - `updated_at` (timestamptz, 默认: now())
    
    - `step_templates` (步骤模板表，用于智能生成)
        - `id` (uuid, 主键, 默认: gen_random_uuid())
        - `category` (text, 适用分类)
        - `keywords` (text[], 关键词数组)
        - `template_steps` (jsonb, 模板步骤数组)
        - `priority` (integer, 优先级, 默认: 0)
        - `created_at` (timestamptz, 默认: now())

2. 安全策略
    - 所有表启用 RLS
    - 用户只能访问自己的事件和步骤
    - step_templates 表所有人可读

3. 触发器
    - 自动更新 updated_at 字段
*/

-- 创建枚举类型
CREATE TYPE event_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE event_status AS ENUM ('pending', 'in_progress', 'completed');

-- 创建 events 表
CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    deadline timestamptz,
    priority event_priority DEFAULT 'medium'::event_priority NOT NULL,
    status event_status DEFAULT 'pending'::event_status NOT NULL,
    category text,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建 steps 表
CREATE TABLE IF NOT EXISTS steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamptz,
    is_auto_generated boolean DEFAULT false NOT NULL,
    category text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建 step_templates 表
CREATE TABLE IF NOT EXISTS step_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    keywords text[] NOT NULL,
    template_steps jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(deadline);
CREATE INDEX IF NOT EXISTS idx_steps_event_id ON steps(event_id);
CREATE INDEX IF NOT EXISTS idx_steps_order ON steps(event_id, order_index);
CREATE INDEX IF NOT EXISTS idx_step_templates_category ON step_templates(category);

-- 启用 RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_templates ENABLE ROW LEVEL SECURITY;

-- events 表策略：用户只能访问自己的事件
CREATE POLICY "Users can view own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- steps 表策略：用户只能访问自己事件的步骤
CREATE POLICY "Users can view own steps" ON steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = steps.event_id 
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own steps" ON steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = steps.event_id 
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own steps" ON steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = steps.event_id 
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own steps" ON steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = steps.event_id 
            AND events.user_id = auth.uid()
        )
    );

-- step_templates 表策略：所有人可读
CREATE POLICY "Everyone can view step templates" ON step_templates
    FOR SELECT USING (true);

-- 创建自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 events 表创建触发器
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 steps 表创建触发器
CREATE TRIGGER update_steps_updated_at
    BEFORE UPDATE ON steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入一些默认的步骤模板
INSERT INTO step_templates (category, keywords, template_steps, priority) VALUES
('会议准备', ARRAY['会议', '开会', '讨论', '汇报'], 
 '[
    {"title": "确定会议议程", "description": "列出需要讨论的主要议题", "category": "准备"},
    {"title": "准备会议材料", "description": "整理相关文档和数据", "category": "准备"},
    {"title": "发送会议通知", "description": "通知参会人员时间地点", "category": "准备"},
    {"title": "预定会议室", "description": "确保会议场地可用", "category": "准备"},
    {"title": "会议总结", "description": "记录会议要点和行动项", "category": "执行"}
 ]'::jsonb, 10),

('项目开发', ARRAY['开发', '项目', '编程', '代码'], 
 '[
    {"title": "需求分析", "description": "明确项目需求和目标", "category": "规划"},
    {"title": "技术方案设计", "description": "确定技术栈和架构", "category": "规划"},
    {"title": "任务分解", "description": "将项目拆分为可执行任务", "category": "规划"},
    {"title": "开发实现", "description": "编写代码实现功能", "category": "执行"},
    {"title": "测试验证", "description": "进行功能测试和bug修复", "category": "执行"},
    {"title": "部署上线", "description": "发布到生产环境", "category": "执行"}
 ]'::jsonb, 10),

('活动策划', ARRAY['活动', '策划', '组织', '举办'], 
 '[
    {"title": "确定活动主题", "description": "明确活动目的和主题", "category": "策划"},
    {"title": "制定活动方案", "description": "规划活动流程和环节", "category": "策划"},
    {"title": "预算编制", "description": "估算活动成本和预算", "category": "策划"},
    {"title": "场地预定", "description": "确定并预定活动场地", "category": "准备"},
    {"title": "物资采购", "description": "购买活动所需物品", "category": "准备"},
    {"title": "人员安排", "description": "分配工作人员和职责", "category": "准备"},
    {"title": "活动执行", "description": "按计划开展活动", "category": "执行"},
    {"title": "活动总结", "description": "评估活动效果和改进点", "category": "总结"}
 ]'::jsonb, 10),

('学习计划', ARRAY['学习', '培训', '课程', '考试'], 
 '[
    {"title": "制定学习目标", "description": "明确要学习的内容和目标", "category": "规划"},
    {"title": "收集学习资料", "description": "准备教材、视频等资源", "category": "准备"},
    {"title": "制定学习计划", "description": "安排每日学习时间和内容", "category": "规划"},
    {"title": "开始学习", "description": "按计划进行学习", "category": "执行"},
    {"title": "练习巩固", "description": "通过练习加深理解", "category": "执行"},
    {"title": "复习总结", "description": "定期复习和总结知识点", "category": "总结"}
 ]'::jsonb, 10),

('通用任务', ARRAY['任务', '工作', '事项'], 
 '[
    {"title": "明确任务目标", "description": "清楚了解要完成什么", "category": "规划"},
    {"title": "制定执行计划", "description": "规划具体执行步骤", "category": "规划"},
    {"title": "开始执行", "description": "按计划推进任务", "category": "执行"},
    {"title": "检查验收", "description": "确认任务完成质量", "category": "总结"}
 ]'::jsonb, 5);
