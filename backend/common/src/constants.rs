use std::collections::HashMap;
use std::sync::OnceLock;

pub fn get_system_categories() -> &'static HashMap<&'static str, &'static str> {
    static CATEGORIES: OnceLock<HashMap<&'static str, &'static str>> = OnceLock::new();
    CATEGORIES.get_or_init(|| {
        let mut m = HashMap::new();
        m.insert("shopping", "购物");
        m.insert("transport", "交通");
        m.insert("dining", "餐饮");
        m.insert("entertainment", "娱乐");
        m.insert("housing", "居住");
        m.insert("healthcare", "医疗");
        m.insert("education", "教育");
        m.insert("utilities", "水电煤");
        m.insert("communication", "通讯");
        m.insert("clothing", "服饰");
        m.insert("other_expense", "其他支出");
        m.insert("salary", "工资");
        m.insert("bonus", "奖金");
        m.insert("investment", "投资收益");
        m.insert("other_income", "其他收入");
        m
    })
}

pub fn get_category_name(id: &str) -> String {
    get_system_categories()
        .get(id)
        .map(|&s| s.to_string())
        .unwrap_or_else(|| id.to_string())
}
