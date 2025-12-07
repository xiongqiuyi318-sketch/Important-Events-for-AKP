/*
# 添加进口和机械维修类别步骤模板

1. 新增模板
    - 为"进口"类别添加智能步骤生成模板
    - 为"机械维修"类别添加智能步骤生成模板

2. 进口模板步骤
    - wanted product list签字
    - 报价单（或者PI）签字
    - 所有支付已完成
    - 已发货
    - 报关中
    - 已收到MRN
    - 已收货

3. 机械维修模板步骤
    - 故障诊断和评估
    - 制定维修方案
    - 采购维修配件
    - 执行维修作业
    - 功能测试和调试
    - 维修记录归档

4. 优先级
    - 设置为高优先级(10)，确保匹配时优先使用
*/

-- 插入进口类别的步骤模板
INSERT INTO step_templates (category, keywords, template_steps, priority) VALUES
('进口', ARRAY['进口', '进货', '采购', '国际采购', 'import', 'purchase'], 
 '[
    {"title": "wanted product list签字", "description": "确认并签署所需产品清单", "category": "准备"},
    {"title": "报价单（或者PI）签字", "description": "审核并签署报价单或形式发票", "category": "准备"},
    {"title": "所有支付已完成", "description": "完成所有款项支付", "category": "执行"},
    {"title": "已发货", "description": "确认供应商已发货", "category": "执行"},
    {"title": "报关中", "description": "货物正在进行报关手续", "category": "执行"},
    {"title": "已收到MRN", "description": "收到货物运输参考号", "category": "执行"},
    {"title": "已收货", "description": "确认货物已收到并验收", "category": "完成"}
 ]'::jsonb, 10);

-- 插入机械维修类别的步骤模板
INSERT INTO step_templates (category, keywords, template_steps, priority) VALUES
('机械维修', ARRAY['维修', '修理', '保养', '机械', '设备', 'repair', 'maintenance', 'fix'], 
 '[
    {"title": "故障诊断和评估", "description": "检查设备故障原因并评估维修难度", "category": "准备"},
    {"title": "制定维修方案", "description": "根据故障情况制定详细维修计划", "category": "准备"},
    {"title": "采购维修配件", "description": "购买所需的维修零件和材料", "category": "准备"},
    {"title": "执行维修作业", "description": "按照方案进行设备维修", "category": "执行"},
    {"title": "功能测试和调试", "description": "测试设备功能并进行必要调试", "category": "执行"},
    {"title": "维修记录归档", "description": "记录维修过程并归档相关文档", "category": "完成"}
 ]'::jsonb, 10);
